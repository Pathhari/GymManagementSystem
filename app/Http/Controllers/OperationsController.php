<?php

namespace App\Http\Controllers;
use Carbon\Carbon;
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
use App\Models\Payment;
use App\Models\Invoice;
use App\Models\InvoiceLineItem;
use App\Models\PaymentInvoice;
use App\Models\DailyCashFlow;
use Illuminate\Support\Facades\DB;

class OperationsController extends Controller
{
 
    // ------------------------------------------------------------
    // A) PRODUCT + INVENTORY
    // ------------------------------------------------------------

    /**
     * List products. Staff sees only their branches; Admin/Owner see all.
     */
    public function indexProducts()
    {
        $staff = auth('staff')->user();

        $query = Product::query()->orderBy('ProductName', 'asc');

        if ($staff) {
            $branchIDs = $staff->branches->pluck('BranchID');
            $query->whereIn('BranchID', $branchIDs);
        }

        $products = $query->get();

        // Return JSON (or Inertia data if you're using Inertia)
        return response()->json([
            'products' => $products
        ]);
    }

    /**
     * Store or update a product. Staff => must match one of their branches.
     */
    public function storeProduct(Request $request)
    {
        $staff = auth('staff')->user();

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
            'BranchID'       => 'nullable|exists:branches,BranchID',
        ]);

        if ($staff) {
            // Force to staff's branch if creating new
            $branchIDs = $staff->branches->pluck('BranchID');

            if (!empty($data['ProductID'])) {
                $product = Product::findOrFail($data['ProductID']);
                if (!$branchIDs->contains($product->BranchID)) {
                    return response()->json(['error' => 'Unauthorized: different branch'], 403);
                }
                $product->update($data);
            } else {
                // If new product but BranchID not in staff's branches => error
                if (empty($data['BranchID']) || !$branchIDs->contains($data['BranchID'])) {
                    return response()->json([
                        'error' => 'Cannot create product in another branch'
                    ], 403);
                }
                Product::create($data);
            }
        } else {
            // Admin/Owner => can create or update with any branch
            if (!empty($data['ProductID'])) {
                $product = Product::findOrFail($data['ProductID']);
                $product->update($data);
            } else {
                Product::create($data);
            }
        }

        return response()->json(['message' => 'Product saved successfully.'], 200);
    }

    /**
     * Adjust stock => create a ProductInventoryLog. Staff => branch check.
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

        DB::transaction(function () use ($data, $staff) {
            // Check branch if staff
            $product = Product::lockForUpdate()->findOrFail($data['ProductID']);

            if ($staff) {
                $branchIDs = $staff->branches->pluck('BranchID');
                if (!$branchIDs->contains($product->BranchID)) {
                    abort(403, 'Cannot adjust stock of another branch’s product.');
                }
            }

            // Adjust
            $newStock = $product->StockLevel + $data['QuantityChange'];
            if ($newStock < 0) {
                abort(400, 'Stock cannot go below zero.');
            }
            $product->StockLevel = $newStock;
            $product->save();

            // Log
            ProductInventoryLog::create([
                'ProductID'      => $product->ProductID,
                'ChangeDate'     => now(),
                'ChangeType'     => $data['ChangeType'] ?? 'Adjustment',
                'QuantityChange' => $data['QuantityChange'],
                'NewStockLevel'  => $newStock,
                'StaffID'        => $staff ? $staff->StaffID : null,
                'Notes'          => $data['Notes'] ?? null,
            ]);
        });

        return response()->json(['message' => 'Stock adjusted successfully.'], 200);
    }

    /**
     * Delete product. Staff => must match branch; otherwise admin/owner.
     */
    public function destroyProduct($id)
    {
        $staff = auth('staff')->user();

        $product = Product::findOrFail($id);

        if ($staff) {
            $branchIDs = $staff->branches->pluck('BranchID');
            if (!$branchIDs->contains($product->BranchID)) {
                return response()->json([
                    'error' => 'Cannot delete product from another branch.'
                ], 403);
            }
        }
        $product->delete();

        return response()->json(['message' => 'Product removed successfully.'], 200);
    }



  /* ------------------------------------------------------------------
 * P. LOCKER & LOCKER USAGE (JSON Responses)
 * ------------------------------------------------------------------ */
    public function indexLockers()
    {
        $staff = auth('staff')->user();

        // Prepare the locker query
        $query = Locker::with([
            'lockerUsages' => function ($q) {
                $q->where('Returned', false)
                  ->with('member')
                  ->orderBy('BorrowDate', 'desc');
            }
        ]);

        // If staff is logged in, filter by their branch IDs
        if ($staff) {
            $branchIDs = $staff->branches->pluck('BranchID');
            $query->whereIn('BranchID', $branchIDs);
        }

        $lockers = $query->get();

        // Format response data (include occupant info if a usage is active)
        $response = $lockers->map(function ($locker) {
            $activeUsage = $locker->lockerUsages->first();
            return [
                'LockerID'     => $locker->LockerID,
                'LockerNumber' => $locker->LockerNumber,
                'Status'       => $locker->Status,
                'BranchID'     => $locker->BranchID,
                'occupant'     => $activeUsage ? [
                    'UsageID'  => $activeUsage->UsageID,
                    'MemberID' => $activeUsage->MemberID,
                    'FullName' => $activeUsage->member->FullName ?? '',
                ] : null,
            ];
        });

        return response()->json(['lockers' => $response], 200);
    }

    /**
     * Create or update a locker. Staff can only operate on their own branches.
     */
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

            // Enforce staff branch restrictions
            if ($staff) {
                $branchIDs = $staff->branches->pluck('BranchID');

                // If new locker (LockerID empty):
                // - If BranchID is not set or not in staff's branches, return error or pick a default
                if (empty($data['LockerID'])) {
                    if (empty($data['BranchID']) || !$branchIDs->contains($data['BranchID'])) {
                        return response()->json([
                            'error' => 'Cannot create locker in an unauthorized branch.'
                        ], 403);
                    }
                }

                // If updating an existing locker:
                // - Check if the existing locker’s branch is in staff's branches
                if (!empty($data['LockerID'])) {
                    $locker = Locker::findOrFail($data['LockerID']);
                    if (!$branchIDs->contains($locker->BranchID)) {
                        return response()->json([
                            'error' => 'Cannot update a locker from another branch.'
                        ], 403);
                    }
                }
            }

            // If we are updating an existing locker
            if (!empty($data['LockerID'])) {
                $locker = Locker::findOrFail($data['LockerID']);
                $locker->update($data);
            } else {
                // Creating a new locker
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

    /**
     * Borrow a locker key. Staff can only borrow lockers from their own branches.
     */
    public function borrowLockerKey(Request $request)
    {
        try {
            $staff = auth('staff')->user();

            $data = $request->validate([
                'LockerID' => 'required|exists:lockers,LockerID',
                'MemberID' => 'required|exists:members,MemberID',
                'Notes'    => 'nullable|string',
            ]);

            // Check staff branch restrictions
            if ($staff) {
                $branchIDs = $staff->branches->pluck('BranchID');
                $lockerCheck = Locker::where('LockerID', $data['LockerID'])
                                     ->whereIn('BranchID', $branchIDs)
                                     ->first();
                if (!$lockerCheck) {
                    return response()->json([
                        'error' => 'Cannot borrow a locker from another branch.'
                    ], 403);
                }
            }

            // Create locker usage entry
            LockerUsage::create([
                'LockerID'    => $data['LockerID'],
                'MemberID'    => $data['MemberID'],
                'KeyBorrowed' => true,
                'BorrowDate'  => now(),
                'Returned'    => false,
                'Notes'       => $data['Notes'] ?? null,
            ]);

            // Mark locker as occupied
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

    /**
     * Return a locker key. Staff can only return lockers from their own branches.
     */
    public function returnLockerKey($usageId)
    {
        try {
            $staff = auth('staff')->user();
            $usage = LockerUsage::findOrFail($usageId);

            // Enforce staff branch restriction
            if ($staff) {
                $branchIDs = $staff->branches->pluck('BranchID');
                if (!$branchIDs->contains($usage->locker->BranchID)) {
                    return response()->json([
                        'error' => 'Cannot return a locker key from another branch.'
                    ], 403);
                }
            }

            if ($usage->Returned) {
                // Locker already returned - no further action needed
                return response()->json([
                    'message' => 'Locker key was already returned.'
                ], 200);
            }

            // Update locker usage record
            $usage->update([
                'ReturnDate' => now(),
                'Returned'   => true,
            ]);

            // Mark locker as available again
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

    public function lockerActivityLog()
    {
        try {
            // Get the authenticated staff (if applicable)
            $staff = auth('staff')->user();
    
            // Build a query to fetch all locker usage records, including the member and locker details.
            $query = LockerUsage::with(['member', 'locker']);
    
            // If staff is logged in, restrict to lockers in their branches.
            if ($staff) {
                $branchIDs = $staff->branches->pluck('BranchID');
                $query->whereHas('locker', function ($q) use ($branchIDs) {
                    $q->whereIn('BranchID', $branchIDs);
                });
            }
    
            // Order by BorrowDate descending so the most recent activities are first.
            $usageLogs = $query->orderBy('BorrowDate', 'desc')->get();
    
            return response()->json(['usages' => $usageLogs], 200);
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

        $query = Equipment::orderBy('Name', 'asc');

        if ($staff) {
            $branchIDs = $staff->branches->pluck('BranchID');
            $query->whereIn('BranchID', $branchIDs);
        }

        $equipment = $query->get();

        return response()->json([
            'equipment' => $equipment
        ]);
    }

    /**
     * Store or update an equipment record.
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

        if ($staff) {
            $branchIDs = $staff->branches->pluck('BranchID');

            // Update
            if (!empty($data['EquipmentID'])) {
                $eq = Equipment::findOrFail($data['EquipmentID']);
                if (!$branchIDs->contains($eq->BranchID)) {
                    return response()->json(['error' => 'Cannot update another branch’s equipment.'], 403);
                }
                $eq->update($data);
            } else {
                // Create
                if (empty($data['BranchID']) || !$branchIDs->contains($data['BranchID'])) {
                    return response()->json([
                        'error' => 'Cannot create equipment for another branch.'
                    ], 403);
                }
                Equipment::create($data);
            }
        } else {
            // Admin/Owner => any branch
            if (!empty($data['EquipmentID'])) {
                $eq = Equipment::findOrFail($data['EquipmentID']);
                $eq->update($data);
            } else {
                Equipment::create($data);
            }
        }

        return response()->json(['message' => 'Equipment saved successfully.'], 200);
    }

    /**
     * Maintenance logs list, staff => only see logs for eq in their branch(es).
     */
    public function indexMaintenanceLogs()
    {
        $staff = auth('staff')->user();

        $query = MaintenanceLog::with(['equipment', 'maintainer'])->latest();

        if ($staff) {
            $branchIDs = $staff->branches->pluck('BranchID');
            // filter logs via equipment’s branch
            $query->whereHas('equipment', function($q) use ($branchIDs) {
                $q->whereIn('BranchID', $branchIDs);
            });
        }

        return response()->json([
            'logs' => $query->get()
        ]);
    }

    /**
     * Create a new maintenance log record.
     */
    public function storeMaintenanceLog(Request $request)
    {
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

        if ($staff) {
            $branchIDs = $staff->branches->pluck('BranchID');
            $equipment = Equipment::findOrFail($data['EquipmentID']);
            if (!$branchIDs->contains($equipment->BranchID)) {
                return response()->json(['error' => 'Unauthorized: different branch'], 403);
            }
        }

        if (empty($data['MaintainedBy'])) {
            if ($staff) {
                $data['MaintainedBy'] = $staff->StaffID;
            } else {
                // Admin/Owner => set null or 0
                $data['MaintainedBy'] = null;
            }
        }

        $log = MaintenanceLog::create($data);

        return response()->json([
            'success' => true,
            'log'     => $log->load('equipment'),
            'message' => 'Maintenance log recorded successfully'
        ], 201);
    }

    /**
     * Update existing maintenance log (if you allow edits).
     */
    public function updateMaintenanceLog(Request $request, $id)
    {
        $staff = auth('staff')->user();

        $log = MaintenanceLog::findOrFail($id);
        $data = $request->validate([
            'IssueDescription'    => 'nullable|string|max:255',
            'Resolution'          => 'nullable|string|max:255',
            'NextMaintenanceDate' => 'nullable|date',
            'Notes'               => 'nullable|string',
        ]);

        // Check branch if staff
        if ($staff) {
            $branchIDs = $staff->branches->pluck('BranchID');
            // ensure the equipment’s branch is in staff’s branches
            if (!$branchIDs->contains($log->equipment->BranchID)) {
                return response()->json(['error' => 'Unauthorized: different branch'], 403);
            }
        }

        $log->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Maintenance log updated successfully.',
            'log' => $log
        ]);
    }

    /**
     * Delete MaintenanceLog
     */
    public function destroyMaintenanceLog($id)
    {
        $staff = auth('staff')->user();

        $log = MaintenanceLog::findOrFail($id);
        if ($staff) {
            $branchIDs = $staff->branches->pluck('BranchID');
            if (!$branchIDs->contains($log->equipment->BranchID)) {
                return response()->json(['error' => 'Unauthorized: different branch'], 403);
            }
        }

        $log->delete();

        return response()->json([
            'success' => true,
            'message' => 'Maintenance log deleted successfully.'
        ]);
    }

    public function getMaintenanceStats()
    {
        // Identify the logged-in user from possible guards
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();
    
        if ($staff) {
            // Staff: filter logs by equipment's BranchID matching one of staff's branches
            $branchIDs = $staff->branches->pluck('BranchID');
            $pendingCount = MaintenanceLog::where('Resolution', 'pending')
                ->whereHas('equipment', function($q) use ($branchIDs) {
                    $q->whereIn('BranchID', $branchIDs);
                })->count();
        } else {
            // Admin/Owner: no branch filtering (full access)
            $pendingCount = MaintenanceLog::where('Resolution', 'pending')->count();
        }
    
        return response()->json([
            'pending_maintenance' => $pendingCount
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
    
    public function historyVisits()
    {
        // Example: Fetch recent visits
        $visits = Visit::orderBy('VisitTime', 'desc')
            ->take(50) // or however many
            ->get();

        // Return JSON
        return response()->json(['visits' => $visits]);
    }


       /**
     * Display a listing of Walk-In records.
     * route: operations.walkins.index
     */
  public function indexWalkIns()
{
    // 1) Identify who is logged in (staff/admin/owner).
    $staff = auth('staff')->user();
    
    // 2) If we have a staff user, gather all the branches they belong to:
    // (assuming the staff model has ->branches pivot)
    if ($staff) {
        $branchIDs = $staff->branches->pluck('BranchID');

        // 3) If `walk_ins` table has a direct BranchID column:
        $walkIns = WalkIn::whereIn('BranchID', $branchIDs)
            ->orderBy('WalkInID','desc')
            ->get();
        
        // Or if `walk_ins` references a member who has `StartedBranchID`:
        /*
        $walkIns = WalkIn::whereHas('member', function($q) use ($branchIDs) {
            $q->whereIn('StartedBranchID', $branchIDs);
        })
        ->orderBy('WalkInID','desc')
        ->get();
        */
    }
    else {
        // 4) If this request is from admin or owner => show all walk-ins
        $walkIns = WalkIn::orderBy('WalkInID','desc')->get();
    }

    // Finally return JSON:
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
        // We check which guard is authenticated:
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();
    
        // Validate input
        $data = $request->validate([
            'BranchID'      => 'nullable|exists:branches,BranchID',
            'FullName'      => 'nullable|string|max:255',
            'VisitDate'     => 'required|date',
            'Notes'         => 'nullable|string',
    
            'PaymentMethod' => 'nullable|string|max:50',
            'PaymentAmount' => 'nullable|numeric|min:0',
            'PaymentFor'    => 'nullable|string', // possibly a JSON array
        ]);
    
        /**
         *  CASE 1: Staff => force BranchID to staff’s single assigned branch
         */
        if ($staff) {
            // If staff has a single column `BranchID`
            // or if staff->BranchID is null, but staff->branches pivot is multiple => pick one
            $data['BranchID'] = $staff->BranchID;
            // or if staff->branches is a collection:
            // $data['BranchID'] = $staff->branches->first()->BranchID ?? null;
        }
    
        /**
         *  CASE 2: Owner/Admin => let them pick from front end
         *  i.e. if user passes BranchID in the request
         *  If user doesn’t pass one, we can default to 1 or throw an error
         */
        elseif ($admin || $owner) {
            // If request didn’t supply a BranchID, you can decide to require it:
            if (empty($data['BranchID'])) {
                // e.g. default or throw:
                $data['BranchID'] = 1; 
            }
        }
    
        // By now, $data['BranchID'] is set (unless we abort).
        $branchID = $data['BranchID'] ?? null;
    
        // If still null, daily flow won't update
        if (!$branchID) {
            // handle it or throw an exception
            abort(422, 'No valid BranchID was set.');
        }
    
        // 1) Create the WalkIn
        $walkIn = WalkIn::create([
            'BranchID'  => $branchID,
            'FullName'  => $data['FullName'] ?? null,
            'VisitDate' => $data['VisitDate'],
            'Notes'     => $data['Notes'] ?? null,
        ]);
    
        // 2) Create Payment if PaymentMethod & PaymentAmount
        if (!empty($data['PaymentMethod']) && !empty($data['PaymentAmount'])) {
            $paymentFor = ["Walk-In Payment"];
            if (!empty($data['PaymentFor'])) {
                $decoded = json_decode($data['PaymentFor'], true);
                if (is_array($decoded)) {
                    $paymentFor = $decoded;
                }
            }
    
            $payment = Payment::create([
                'BranchID'      => $branchID,
                'WalkInName'    => $data['FullName'] ?? 'Walk-In',
                'PaymentMethod' => $data['PaymentMethod'],
                'Amount'        => $data['PaymentAmount'],
                'PaymentFor'    => $paymentFor,
                'PaymentDate'   => now(),
                'Status'        => 'Completed',
            ]);
    
            $walkIn->PaymentID = $payment->PaymentID;
            $walkIn->save();
    
            // Update daily flow
            $this->updateDailyFlowForWalkIn(
                $branchID,
                $data['VisitDate'],
                $data['PaymentMethod'],
                $data['PaymentAmount']
            );
        }
    
        return response()->json($walkIn, 201);
    }
    

    /**
     *  Increment the daily cash flow with the correct "WalkIn" field
     *  based on the PaymentMethod. E.g. "W-In Cash" => WalkInCashSales.
     */
    protected function updateDailyFlowForWalkIn($branchID, $visitDate, $method, $amount)
    {
        if (!$branchID) {
            return; // If no branch, skip
        }

        // 1) Find or create the daily flow row
        //    Suppose we put all walk-ins under "Gym" business type, or use "Cafe," etc.
        $flow = DailyCashFlow::firstOrNew([
            'BranchID'     => $branchID,
            'Date'         => date('Y-m-d', strtotime($visitDate)),
            'BusinessType' => 'Gym',
        ]);

        // 2) Figure out which WalkIn column to increment
        $field = null;
        switch ($method) {
            case 'W-In Cash':
                $field = 'WalkInCashSales';
                break;
            case 'W-In GCash':
                $field = 'WalkInGCashSales';
                break;
            case 'W-In BPI':
                $field = 'WalkInBPISales';
                break;
            case 'W-In BDO':
                $field = 'WalkInBDOSales';
                break;
            default:
                // fallback if your PaymentMethod doesn't match these
                $field = 'WalkInCashSales';
                break;
        }

        // 3) Increment that field by $amount
        if ($field) {
            $existing = (float) $flow->{$field};
            $flow->{$field} = $existing + (float) $amount;
        }

        // 4) Recalc total
        $flow->TotalSales = (
            (float) $flow->CashSales
            + (float) $flow->GCashSales
            + (float) $flow->BPISales
            + (float) $flow->BDOSales
            + (float) $flow->WalkInCashSales
            + (float) $flow->WalkInGCashSales
            + (float) $flow->WalkInBPISales
            + (float) $flow->WalkInBDOSales
        );

        // 5) Save
        $flow->save();
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

