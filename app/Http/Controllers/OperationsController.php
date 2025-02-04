<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\ProductInventoryLog;
use App\Models\Locker;
use App\Models\LockerUsage;
use App\Models\Equipment;
use App\Models\MaintenanceLog;
use App\Models\MemberVisit;
use App\Models\Member;
use App\Models\WalkIn; 
use Illuminate\Support\Facades\DB;

class OperationsController extends Controller
{
    /* ------------------------------------------------------------------
     * AC. INVENTORY MANAGEMENT
     * Product + ProductInventoryLog
     * ------------------------------------------------------------------ */

    /**
     * 74. Show (Create/Edit) Products => route:Owner,Admin
     * Actually, this method displays all existing products.
     */
    public function indexProducts()
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        // Staff sees only their branch. Owner/Admin see all.
        if ($staff) {
            $products = Product::where('BranchID', $staff->BranchID)
                ->orderBy('ProductName','asc')
                ->get();
        } else {
            // Admin or Owner => show all
            $products = Product::orderBy('ProductName','asc')->get();
        }

        return Inertia::render('Operations/Inventory/Index', compact('products'));
    }

    /**
     * Store or update a Product in the DB.
     * Called after a user submits a form for a new or edited product.
     */
    public function storeProduct(Request $request)
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        // Validate
        $data = $request->validate([
            'ProductID'      => 'nullable|exists:products,ProductID',
            'ProductName'    => 'required|string|max:255',
            'Category'       => 'nullable|string|max:100',
            'StockLevel'     => 'required|integer|min:0',
            'ReorderLevel'   => 'nullable|integer|min:0',
            'UnitOfMeasure'  => 'nullable|string|max:50',
            'Cost'           => 'nullable|numeric|min:0',
            'Price'          => 'nullable|numeric|min:0',
            'Notes'          => 'nullable|string',
            // Because branch-based:
            'BranchID'       => 'nullable|exists:branches,BranchID',
        ]);

        // If staff => forcibly set BranchID to staff->BranchID
        if ($staff) {
            $data['BranchID'] = $staff->BranchID;
        } 
        // If admin/owner => they can pass in BranchID from the form 
        // (or you can auto-set a default if needed).

        if (!empty($data['ProductID'])) {
            // Update existing
            $product = Product::findOrFail($data['ProductID']);

            // Check if staff -> can only update if product->BranchID == staff->BranchID
            if ($staff && $product->BranchID != $staff->BranchID) {
                abort(403, 'You cannot update another branch’s product.');
            }

            $product->update($data);
        } else {
            // Create new
            Product::create($data);
        }

        return redirect()
            ->route('operations.products.index')
            ->with('success','Product saved successfully.');
    }

    /**
     * 75. Adjust Stock => route:Owner,Admin,Staff
     * Creates a ProductInventoryLog entry for each stock adjustment.
     */
    public function adjustStock(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'ProductID'       => 'required|exists:products,ProductID',
            'QuantityChange'  => 'required|integer',
            'ChangeType'      => 'nullable|string|max:50',
            'Notes'           => 'nullable|string',
        ]);

        // Ensure staff can only adjust products from their branch
        if ($staff) {
            $productCheck = Product::where('ProductID',$data['ProductID'])
                ->where('BranchID',$staff->BranchID)
                ->first();

            if (!$productCheck) {
                abort(403, 'You cannot adjust stock of another branch’s product.');
            }
        }

        DB::transaction(function () use ($data, $staff) {
            // Lock row to avoid race conditions
            $product = Product::lockForUpdate()->find($data['ProductID']);

            $newStock = $product->StockLevel + $data['QuantityChange'];
            if ($newStock < 0) {
                abort(400, 'Stock cannot go below zero.');
            }
            $product->StockLevel = $newStock;
            $product->save();

            // Insert a new inventory log
            ProductInventoryLog::create([
                'ProductID'     => $product->ProductID,
                'ChangeDate'    => now(),
                'ChangeType'    => $data['ChangeType'] ?? 'Adjustment',
                'QuantityChange'=> $data['QuantityChange'],
                'NewStockLevel' => $newStock,
                'StaffID'       => $staff ? $staff->StaffID : null,
                'Notes'         => $data['Notes'] ?? null,
            ]);
        });

        return redirect()->back()->with('success','Stock adjusted successfully.');
    }

    /**
     * 76. Delete Product => route:Owner,Admin
     */
    public function destroyProduct($id)
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        $product = Product::findOrFail($id);

        // Staff not supposed to delete => but if your RBA matrix allows staff, 
        // you can do the same branch check:
        if ($staff && $product->BranchID != $staff->BranchID) {
            abort(403, 'You cannot delete a product in another branch.');
        }

        $product->delete();

        return redirect()
            ->route('operations.products.index')
            ->with('success','Product removed successfully.');
    }

    /**
     * 77. View Stock => route:Owner,Admin,Staff
     * Possibly partial logic if staff should see limited columns.
     */
    public function viewStockLevels()
    {
        $staff = auth('staff')->user();

        if ($staff) {
            $products = Product::where('BranchID',$staff->BranchID)
                ->orderBy('ProductName')
                ->get();
        } else {
            $products = Product::orderBy('ProductName')->get();
        }

        return Inertia::render('Operations/Inventory/StockLevels', [
            'products' => $products
        ]);
    }


  /* ------------------------------------------------------------------
 * P. LOCKER & LOCKER USAGE (JSON Responses)
 * ------------------------------------------------------------------ */

 public function indexLockers()
 {
     $staff = auth('staff')->user();
 
     $query = Locker::with(['lockerUsages' => function($q){
         $q->where('Returned', false)
           ->with('member')
           ->orderBy('BorrowDate','desc');
     }]);
 
     if ($staff) {
         $query->where('BranchID', $staff->BranchID);
     }
 
     $lockers = $query->get();
 
     // Map each locker to a structure with occupant if usage found
     $response = $lockers->map(function($locker){
         $activeUsage = $locker->lockerUsages->first(); 
         return [
             'LockerID'      => $locker->LockerID,
             'LockerNumber'  => $locker->LockerNumber,
             'Status'        => $locker->Status,
             'BranchID'      => $locker->BranchID,
             'occupant'      => $activeUsage ? [
                 'UsageID'  => $activeUsage->UsageID,
                 'MemberID' => $activeUsage->MemberID,
                 'FullName' => $activeUsage->member->FullName ?? '',
             ] : null,
         ];
     });
 
     return response()->json(['lockers' => $response], 200);
 }
 

public function storeLocker(Request $request)
{
    try {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'LockerID'     => 'nullable|exists:lockers,LockerID',
            'LockerNumber' => 'required|string|max:50',
            'Status'       => 'required|string|max:50',
            'Notes'        => 'nullable|string',
            'BranchID'     => 'nullable|exists:branches,BranchID',
        ]);

        // Force staff to their branch
        if ($staff) {
            $data['BranchID'] = $staff->BranchID;
        }

        if (!empty($data['LockerID'])) {
            $locker = Locker::findOrFail($data['LockerID']);
            if ($staff && $locker->BranchID !== $staff->BranchID) {
                return response()->json(['error' => 'Cannot update locker of another branch.'], 403);
            }
            $locker->update($data);
        } else {
            $locker = Locker::create($data);
        }

        return response()->json([
            'message' => 'Locker saved successfully.',
            'locker'  => $locker
        ], 200);

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'error'  => 'Validation failed.',
            'errors' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        return response()->json([
            'error'   => 'Server error.',
            'message' => $e->getMessage()
        ], 500);
    }
}

public function borrowLockerKey(Request $request)
{
    try {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'LockerID' => 'required|exists:lockers,LockerID',
            'MemberID' => 'required|exists:members,MemberID',
            'Notes'    => 'nullable|string',
        ]);

        // Ensure staff only borrows lockers in their branch
        if ($staff) {
            $lockerCheck = Locker::where('LockerID', $data['LockerID'])
                ->where('BranchID', $staff->BranchID)
                ->first();
            if (!$lockerCheck) {
                return response()->json(['error' => 'Cannot borrow locker from another branch.'], 403);
            }
        }

        LockerUsage::create([
            'LockerID'    => $data['LockerID'],
            'MemberID'    => $data['MemberID'],
            'KeyBorrowed' => true,
            'BorrowDate'  => now(),
            'Returned'    => false,
            'Notes'       => $data['Notes'] ?? null,
        ]);

        // Optionally mark locker as Occupied
        Locker::where('LockerID', $data['LockerID'])->update(['Status' => 'Occupied']);

        return response()->json([
            'message' => 'Locker key borrowed successfully.'
        ], 200);

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'error'  => 'Validation failed.',
            'errors' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        return response()->json([
            'error'   => 'Server error.',
            'message' => $e->getMessage()
        ], 500);
    }
}

public function returnLockerKey($usageId)
{
    try {
        $staff = auth('staff')->user();
        $usage = LockerUsage::findOrFail($usageId);

        if ($staff && $usage->locker && $usage->locker->BranchID !== $staff->BranchID) {
            return response()->json(['error' => 'Cannot return locker key from another branch.'], 403);
        }

        if ($usage->Returned) {
            // Already returned, not an error but no change needed
            return response()->json([
                'message' => 'Locker key was already returned.'
            ], 200);
        }

        $usage->update([
            'ReturnDate' => now(),
            'Returned'   => true,
        ]);

        // Optionally set locker back to "Available"
        if ($usage->locker) {
            $usage->locker->update(['Status' => 'Available']);
        }

        return response()->json([
            'message' => 'Locker key returned successfully.'
        ], 200);

    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'error' => 'Usage record not found.'
        ], 404);
    } catch (\Exception $e) {
        return response()->json([
            'error'   => 'Server error.',
            'message' => $e->getMessage()
        ], 500);
    }
}


  /* ------------------------------------------------------------------
     * Q. EQUIPMENT & MAINTENANCE
     * ------------------------------------------------------------------ */

    /**
     * 46. Equipment => route:All
     */
    public function indexEquipment()
    {
        $staff = auth('staff')->user();
    
        $equipment = $staff
            ? Equipment::where('BranchID', $staff->BranchID)
                ->orderBy('Name', 'asc')
                ->get()
            : Equipment::orderBy('Name', 'asc')->get();
    
        return response()->json([
            'equipment' => $equipment
        ]);
    }
    
    /**
     * Create or update an Equipment record
     */
    public function storeEquipment(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'EquipmentID'         => 'nullable|exists:equipment,EquipmentID',
            'Name'                => 'required|string|max:100',
            'SerialNumber'        => 'nullable|string|max:100',
            'Status'              => 'required|string|max:50',
            'LastMaintenanceDate' => 'nullable|date',
            'Notes'               => 'nullable|string',
            'BranchID'            => 'nullable|exists:branches,BranchID',
        ]);

        // If staff, ensure equipment is always assigned to staff's branch.
        if ($staff) {
            $data['BranchID'] = $staff->BranchID;
        }

        if (!empty($data['EquipmentID'])) {
            // Update existing
            $eq = Equipment::findOrFail($data['EquipmentID']);

            // Staff: must match eq->BranchID
            if ($staff && $eq->BranchID != $staff->BranchID) {
                abort(403, 'Cannot update equipment of another branch.');
            }

            $eq->update($data);
        } else {
            // Create new
            Equipment::create($data);
        }

        return redirect()
            ->route('operations.equipment.index')
            ->with('success', 'Equipment saved successfully.');
    }

    public function indexMaintenanceLogs()
    {
        $staff = auth('staff')->user();
        
        $query = MaintenanceLog::with(['equipment', 'maintainer']);
        
        if ($staff) {
            $query->whereHas('equipment', function($q) use ($staff) {
                $q->where('BranchID', $staff->BranchID);
            });
        }
        
        return response()->json([
            'logs' => $query->latest()->get()
        ]);
    }

/**
 * Store a new maintenance log (RESTful version)
 */
public function storeMaintenanceLog(Request $request)
{
    try {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        $data = $request->validate([
            'EquipmentID'         => 'required|exists:equipment,EquipmentID',
            'MaintenanceDate'     => 'required|date',
            'IssueDescription'    => 'nullable|string|max:255',
            'Resolution'          => 'nullable|string|max:255',
            'MaintainedBy'        => 'nullable|integer',
            'NextMaintenanceDate' => 'nullable|date|after_or_equal:MaintenanceDate',
            'Notes'               => 'nullable|string',
        ]);

        // Staff-specific branch validation
        if ($staff) {
            $equipment = Equipment::findOrFail($data['EquipmentID']);
            if ($equipment->BranchID !== $staff->BranchID) {
                return response()->json([
                    'error' => 'Unauthorized: Cannot log maintenance for equipment in another branch'
                ], 403);
            }
        }

        // Set maintained by if not provided
        if (empty($data['MaintainedBy'])) {
            if ($staff) {
                $data['MaintainedBy'] = $staff->StaffID;
            } elseif ($admin || $owner) {
                // Set to 0 or null for admin/owner initiated maintenance
                $data['MaintainedBy'] = null; 
            }
        }

        $log = MaintenanceLog::create($data);

        return response()->json([
            'success' => true,
            'log' => $log->load('equipment'),
            'message' => 'Maintenance log recorded successfully'
        ], 201);

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'error' => 'Validation error',
            'errors' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Server error',
            'message' => $e->getMessage()
        ], 500);
    }
}

public function getMaintenanceStats()
{
    $staff = auth('staff')->user();
    
    $query = MaintenanceLog::query();
    
    if ($staff) {
        $query->whereHas('equipment', function($q) use ($staff) {
            $q->where('BranchID', $staff->BranchID);
        });
    }
    
    return response()->json([
        'pending_maintenance' => $query->where('Resolution', 'pending')->count()
    ]);
}

public function destroyMaintenanceLog($id)
{
    $log = MaintenanceLog::findOrFail($id);
    $log->delete();

    return response()->json([
        'success' => true,
        'message' => 'Maintenance log deleted successfully.'
    ]);
}

/* ------------------------------------------------------------------
     * S. MEMBER VISIT (JSON Endpoints)
     * ------------------------------------------------------------------ */

    /**
     * Store a new member visit (check-in).
     * Accepts biometric or card/manual check-in data.
     */
    public function storeVisit(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'MemberID'      => 'required|exists:members,MemberID',
            'VisitDate'     => 'nullable|date',         // if omitted, defaults to today
            'VisitTime'     => 'nullable',              // if omitted, defaults to now
            'CheckInMethod' => 'nullable|string|max:50', // e.g., "biometric", "card", "manual"
            'Remarks'       => 'nullable|string',
            'BranchID'      => 'nullable|exists:branches,BranchID',
        ]);

        // Set defaults if not provided.
        if (empty($data['VisitDate'])) {
            $data['VisitDate'] = Carbon::today()->toDateString();
        }
        if (empty($data['VisitTime'])) {
            $data['VisitTime'] = Carbon::now()->format('H:i:s');
        }
        if (empty($data['CheckInMethod'])) {
            // Default to "card" check-in if no method provided.
            $data['CheckInMethod'] = 'card';
        }

        // If a staff member is logged in, force BranchID to their branch.
        if ($staff) {
            $data['BranchID'] = $staff->BranchID;
        }

        // Attempt to create the visit record.
        try {
            $visit = MemberVisit::create($data);
        } catch (\Illuminate\Database\QueryException $e) {
            // If a duplicate is attempted (e.g., due to unique constraint violation),
            // return a 409 Conflict response.
            return response()->json([
                'message' => 'Member is already checked in for today.'
            ], 409);
        }

        return response()->json([
            'message' => 'Visit logged successfully.',
            'visit'   => $visit
        ], 201);
    }

    /**
     * Display a list of visit logs.
     */
    public function indexVisits()
    {
        $staff = auth('staff')->user();

        if ($staff) {
            $visits = MemberVisit::where('BranchID', $staff->BranchID)
                ->with('member')
                ->orderBy('VisitDate', 'desc')
                ->orderBy('VisitTime', 'desc')
                ->get();
        } else {
            $visits = MemberVisit::with('member')
                ->orderBy('VisitDate', 'desc')
                ->orderBy('VisitTime', 'desc')
                ->get();
        }

        return response()->json([
            'visits' => $visits
        ]);
    }

    /**
     * Update an existing visit log.
     */
    public function updateVisit(Request $request, $id)
    {
        $staff = auth('staff')->user();
        $visit = MemberVisit::findOrFail($id);

        // Ensure staff can only update visits for their branch.
        if ($staff && $visit->BranchID != $staff->BranchID) {
            return response()->json(['message' => 'Cannot update a visit from another branch.'], 403);
        }

        $data = $request->validate([
            'MemberID'      => 'required|exists:members,MemberID',
            'VisitDate'     => 'required|date',
            'VisitTime'     => 'required',
            'CheckInMethod' => 'nullable|string|max:50',
            'Remarks'       => 'nullable|string',
            'BranchID'      => 'nullable|exists:branches,BranchID',
        ]);

        // Enforce staff branch if applicable.
        if ($staff) {
            $data['BranchID'] = $staff->BranchID;
        }

        $visit->update($data);

        return response()->json([
            'message' => 'Visit updated successfully.',
            'visit'   => $visit
        ]);
    }

    /**
     * (Optional) Delete a visit log.
     */
    public function destroyVisit($id)
    {
        $staff = auth('staff')->user();
        $visit = MemberVisit::findOrFail($id);

        if ($staff && $visit->BranchID != $staff->BranchID) {
            return response()->json(['message' => 'Cannot delete a visit from another branch.'], 403);
        }

        $visit->delete();

        return response()->json([
            'message' => 'Visit deleted successfully.'
        ]);
    }

       /**
     * Display a listing of Walk-In records.
     * route: operations.walkins.index
     */
    public function indexWalkIns()
    {
        // however you store these
        $walkIns = WalkIn::orderBy('WalkInID','desc')->get();
        
        // Return JSON so the front end can .then((res) => setWalkInRecords(res.data))
        return response()->json($walkIns);
    }
    /**
     * Show the form to create a new Walk-In record.
     * route: operations.walkins.create
     */
    public function createWalkIn()
    {
        // Possibly fetch branch list if Admin/Owner can pick a branch
        // or auto-assign if staff is logged in.
        $staff = auth('staff')->user();
        // E.g., staff can only create for their own branch:
        $defaultBranchID = $staff ? $staff->BranchID : null;

        return Inertia::render('Operations/WalkIn/Create', [
            'defaultBranchID' => $defaultBranchID,
            // anything else you want passed to the form
        ]);
    }

    /**
     * Store a new Walk-In record in the database.
     * route: operations.walkins.store
     */
    public function storeWalkIn(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'PaymentID'      => 'nullable|exists:payments,PaymentID',
            'BranchID'       => 'nullable|exists:branches,BranchID',
            'FullName'       => 'nullable|string|max:255',
            'VisitDate'      => 'required|date',       // or dateTime if you want '2023-01-01 10:00'
            'Notes'          => 'nullable|string',      
        ]);

        // If staff => force the BranchID to staff->BranchID
        if ($staff) {
            $data['BranchID'] = $staff->BranchID;
        }

        // If PaymentStatus isn't provided, we can set default:
        if (!isset($data['PaymentStatus'])) {
            $data['PaymentStatus'] = 'Pending';
        }

        WalkIn::create($data);

        return redirect()
            ->route('operations.walkins.index')
            ->with('success','Walk-In record created.');
    }

    /**
     * Show the edit form for an existing Walk-In.
     * route: operations.walkins.edit
     */
    public function editWalkIn($id)
    {
        $staff = auth('staff')->user();
        $walkIn = WalkIn::findOrFail($id);

        // If staff => ensure same branch
        if ($staff && $walkIn->BranchID != $staff->BranchID) {
            abort(403, 'Cannot edit a walk-in from another branch.');
        }

        return Inertia::render('Operations/WalkIn/Edit', [
            'walkIn' => $walkIn
        ]);
    }

    /**
     * Update the specified Walk-In record.
     * route: operations.walkins.update
     */
    public function updateWalkIn(Request $request, $id)
    {
        $staff = auth('staff')->user();
        $walkIn = WalkIn::findOrFail($id);

        if ($staff && $walkIn->BranchID != $staff->BranchID) {
            abort(403, 'Cannot update a walk-in from another branch.');
        }

        $data = $request->validate([
            'FullName'       => 'nullable|string|max:255',
            'VisitDate'      => 'required|date',
            'PaymentID' => 'nullable|exists:payments,id',
            'PaymentMethod'  => 'nullable|string|max:50',
            'AmountPaid'     => 'numeric|min:0',
            'PaymentStatus'  => 'string|in:Pending,Completed,Failed',
            'Notes'          => 'nullable|string',
            'BranchID'       => 'nullable|exists:branches,BranchID',
        ]);

        // staff cannot change BranchID -> enforce staff’s Branch again
        if ($staff) {
            $data['BranchID'] = $staff->BranchID;
        }

        $walkIn->update($data);

        return redirect()
            ->route('operations.walkins.index')
            ->with('success','Walk-In updated.');
    }

    /**
     * Delete a Walk-In record.
     * route: operations.walkins.destroy
     */
    public function destroyWalkIn($id)
    {
        $staff = auth('staff')->user();
        $walkIn = WalkIn::findOrFail($id);

        if ($staff && $walkIn->BranchID != $staff->BranchID) {
            abort(403, 'Cannot delete a walk-in from another branch.');
        }

        $walkIn->delete();

        return redirect()
            ->route('operations.walkins.index')
            ->with('success','Walk-In record deleted.');
    }
}

