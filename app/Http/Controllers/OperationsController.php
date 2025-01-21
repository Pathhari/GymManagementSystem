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
     * P. LOCKER & LOCKER USAGE
     * ------------------------------------------------------------------ */

    /**
     * 44. Manage Locker => route:Owner,Admin,Staff
     * Show a list of lockers and their status.
     */
    public function indexLockers()
    {
        $staff = auth('staff')->user();

        if ($staff) {
            $lockers = Locker::where('BranchID',$staff->BranchID)
                ->orderBy('LockerNumber','asc')
                ->get();
        } else {
            // admin/owner => all
            $lockers = Locker::orderBy('LockerNumber','asc')->get();
        }

        return Inertia::render('Operations/Lockers/Index', [
            'lockers' => $lockers
        ]);
    }

    /**
     * Create or update a Locker record.
     */
    public function storeLocker(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'LockerID'     => 'nullable|exists:lockers,LockerID',
            'LockerNumber' => 'required|string|max:50',
            'Status'       => 'required|string|max:50',
            'Notes'        => 'nullable|string',
            'BranchID'     => 'nullable|exists:branches,BranchID',
        ]);

        // Staff forced to own branch
        if ($staff) {
            $data['BranchID'] = $staff->BranchID;
        }

        if (!empty($data['LockerID'])) {
            $locker = Locker::findOrFail($data['LockerID']);

            // If staff => branch check
            if ($staff && $locker->BranchID != $staff->BranchID) {
                abort(403,'Cannot update locker from another branch.');
            }

            // Check unique LockerNumber ignoring self
            $locker->update($data);
        } else {
            // If staff => or admin => create new
            Locker::create($data);
        }

        return redirect()
            ->route('operations.lockers.index')
            ->with('success','Locker saved successfully.');
    }

    /**
     * 45. Borrow Key => create a LockerUsage
     */
    public function borrowLockerKey(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'LockerID' => 'required|exists:lockers,LockerID',
            'MemberID' => 'required|exists:members,MemberID',
            'Notes'    => 'nullable|string',
        ]);

        // Check staff’s branch vs. locker->BranchID
        if ($staff) {
            $lockerCheck = Locker::where('LockerID',$data['LockerID'])
                ->where('BranchID',$staff->BranchID)
                ->first();
            if (!$lockerCheck) {
                abort(403,'Cannot borrow a locker from another branch.');
            }
        }

        LockerUsage::create([
            'LockerID'     => $data['LockerID'],
            'MemberID'     => $data['MemberID'],
            'KeyBorrowed'  => true,
            'BorrowDate'   => now(),
            'Returned'     => false,
            'Notes'        => $data['Notes'] ?? null,
        ]);

        // Optionally update locker status => "Occupied"
        Locker::where('LockerID',$data['LockerID'])->update(['Status'=>'Occupied']);

        return redirect()->back()->with('success','Locker key borrowed successfully.');
    }

    /**
     * Return Locker Key => update an existing LockerUsage record
     */
    public function returnLockerKey($usageId)
    {
        $staff = auth('staff')->user();
        $usage = LockerUsage::findOrFail($usageId);

        // If staff => check usage->locker->BranchID
        if ($staff && $usage->locker && $usage->locker->BranchID != $staff->BranchID) {
            abort(403,'Cannot return a locker key from another branch.');
        }

        if ($usage->Returned) {
            return redirect()->back()->with('info','Key already returned.');
        }

        $usage->update([
            'ReturnDate' => now(),
            'Returned'   => true,
        ]);

        // Optionally set locker back to "Available"
        $locker = $usage->locker;
        if ($locker) {
            $locker->update(['Status'=>'Available']);
        }

        return redirect()->back()->with('success','Locker key returned successfully.');
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

        // If staff is logged in, show equipment specific to their branch.
        // Otherwise (admin/owner), show all.
        if ($staff) {
            $equipment = Equipment::where('BranchID', $staff->BranchID)
                ->orderBy('Name', 'asc')
                ->get();
        } else {
            $equipment = Equipment::orderBy('Name', 'asc')->get();
        }

        return Inertia::render('Operations/Equipment/Index', [
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

    /**
     * 47. Add MaintenanceLog => route:All
     */
    public function addMaintenanceLog(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'EquipmentID'         => 'required|exists:equipment,EquipmentID',
            'MaintenanceDate'     => 'required|date',
            'IssueDescription'    => 'nullable|string|max:255',
            'Resolution'          => 'nullable|string|max:255',
            'MaintainedBy'        => 'nullable|integer',
            'NextMaintenanceDate' => 'nullable|date|after_or_equal:MaintenanceDate',
            'Notes'               => 'nullable|string',
        ]);

        // Staff => check equipment branch
        if ($staff) {
            $eqCheck = Equipment::where('EquipmentID', $data['EquipmentID'])
                ->where('BranchID', $staff->BranchID)
                ->first();

            if (!$eqCheck) {
                abort(403, 'Cannot log maintenance for another branch’s equipment.');
            }
        }

        MaintenanceLog::create($data);

        return redirect()->back()->with('success', 'Maintenance log recorded successfully.');
    }

    /**
     * Fetch all maintenance logs (example).
     */
    public function indexMaintenanceLogs()
    {
        // You can filter by branch if desired:
        // e.g., $logs = MaintenanceLog::whereHas('equipment', function($q) use ($staff) {
        //     if ($staff) $q->where('BranchID', $staff->BranchID);
        // })->with('equipment')->get();

        $logs = MaintenanceLog::with('equipment')->get();
        return response()->json(['logs' => $logs], 200);
    }
    
    /* ------------------------------------------------------------------
     * S. MEMBERVISIT
     * ------------------------------------------------------------------ */

    /**
     * 50. Log Visit => route:All
     */
    public function createVisit()
    {
        // Possibly staff can only pick members of their branch => if you wish
        // For now, we show all members
        $members = Member::orderBy('FullName')->get();

        return Inertia::render('Operations/Visits/Create', compact('members'));
    }

    public function storeVisit(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'MemberID'      => 'required|exists:members,MemberID',
            'VisitDate'     => 'required|date',
            'VisitTime'     => 'required',
            'CheckInMethod' => 'nullable|string|max:50',
            'Remarks'       => 'nullable|string',
            'BranchID'      => 'nullable|exists:branches,BranchID',
        ]);

        // If staff, fix BranchID
        if ($staff) {
            $data['BranchID'] = $staff->BranchID;
        }

        MemberVisit::create($data);

        return redirect()
            ->route('operations.visits.index')
            ->with('success','Visit logged successfully.');
    }

    // 51. View/Update => route:All
    public function indexVisits()
    {
        $staff = auth('staff')->user();

        if ($staff) {
            $visits = MemberVisit::where('BranchID',$staff->BranchID)
                ->with('member')
                ->orderBy('VisitDate','desc')
                ->get();
        } else {
            $visits = MemberVisit::with('member')
                ->orderBy('VisitDate','desc')
                ->get();
        }

        return Inertia::render('Operations/Visits/Index', compact('visits'));
    }

    public function editVisit($id)
    {
        $staff = auth('staff')->user();
        $visit = MemberVisit::findOrFail($id);

        // Check branch
        if ($staff && $visit->BranchID != $staff->BranchID) {
            abort(403,'Cannot edit a visit from another branch.');
        }

        $members = Member::orderBy('FullName')->get();

        return Inertia::render('Operations/Visits/Edit', [
            'visit'   => $visit,
            'members' => $members
        ]);
    }

    public function updateVisit(Request $request, $id)
    {
        $staff = auth('staff')->user();
        $visit = MemberVisit::findOrFail($id);

        if ($staff && $visit->BranchID != $staff->BranchID) {
            abort(403,'Cannot update a visit from another branch.');
        }

        $data = $request->validate([
            'MemberID'      => 'required|exists:members,MemberID',
            'VisitDate'     => 'required|date',
            'VisitTime'     => 'required',
            'CheckInMethod' => 'nullable|string|max:50',
            'Remarks'       => 'nullable|string',
            'BranchID'      => 'nullable|exists:branches,BranchID',
        ]);

        // If staff, forcibly keep the old BranchID or staff->BranchID
        if ($staff) {
            $data['BranchID'] = $staff->BranchID;
        }

        $visit->update($data);

        return redirect()
            ->route('operations.visits.index')
            ->with('success','Visit updated successfully.');
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

