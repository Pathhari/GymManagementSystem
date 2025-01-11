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
use Illuminate\Support\Facades\DB; // if needed for transactions

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
        // Get all products from the DB
        $products = Product::orderBy('ProductName','asc')->get();

        return Inertia::render('Operations/Inventory/Index', compact('products'));
    }

    /**
     * Store or update a Product in the DB.
     * Called after a user submits a form for a new or edited product.
     */
    public function storeProduct(Request $request)
    {
        // Validate according to your Product table fields
        $data = $request->validate([
            // If you want to handle create vs. update in one method, you might check if an ID is present
            'ProductID'      => 'nullable|exists:products,ProductID',
            'ProductName'    => 'required|string|max:255',
            'Category'       => 'nullable|string|max:100',
            'StockLevel'     => 'required|integer|min:0',
            'ReorderLevel'   => 'nullable|integer|min:0',
            'UnitOfMeasure'  => 'nullable|string|max:50',
            'Cost'           => 'nullable|numeric|min:0',
            'Price'          => 'nullable|numeric|min:0',
            'Notes'          => 'nullable|string',
        ]);

        if (!empty($data['ProductID'])) {
            // If ProductID was supplied, we update an existing record
            $product = Product::findOrFail($data['ProductID']);
            $product->update($data);
        } else {
            // Otherwise, we create a new product
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
        $data = $request->validate([
            'ProductID'       => 'required|exists:products,ProductID',
            'QuantityChange'  => 'required|integer',
            'ChangeType'      => 'nullable|string|max:50', // e.g. 'Purchase', 'Usage', 'Disposal'
            'Notes'           => 'nullable|string',
        ]);

        // We'll do an example of an atomic update to the product's StockLevel
        DB::transaction(function () use ($data) {
            // 1) Fetch product
            $product = Product::lockForUpdate()->find($data['ProductID']);

            // 2) Calculate new stock
            $newStock = $product->StockLevel + $data['QuantityChange'];
            if ($newStock < 0) {
                // Ensure we don’t go negative; or handle how you wish
                abort(400, 'Stock cannot go below zero.');
            }

            $product->StockLevel = $newStock;
            $product->save();

            // 3) Insert ProductInventoryLog
            ProductInventoryLog::create([
                'ProductID'     => $product->ProductID,
                'ChangeDate'    => now(),
                'ChangeType'    => $data['ChangeType'] ?? 'Adjustment',
                'QuantityChange'=> $data['QuantityChange'],
                'NewStockLevel' => $newStock,
                // If you track who performed the action:
                // 'StaffID'    => auth()->id() 
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
        $product = Product::findOrFail($id);
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
        // Could do a more advanced aggregated view
        // For example, each Product with current StockLevel
        $products = Product::orderBy('ProductName')->get();

        return Inertia::render('Operations/Inventory/StockLevels', [
            'products' => $products
        ]);
    }


    /* ------------------------------------------------------------------
     * P. LOCKER & LOCKER USAGE
     * ------------------------------------------------------------------ */

    /**
     * 44. Manage Locker => route:Owner,Admin,Staff
     * We show a list of lockers and their status.
     */
    public function indexLockers()
    {
        $lockers = Locker::orderBy('LockerNumber','asc')->get();

        return Inertia::render('Operations/Lockers/Index', [
            'lockers' => $lockers
        ]);
    }

    /**
     * Create or update a Locker record.
     */
    public function storeLocker(Request $request)
    {
        $data = $request->validate([
            'LockerID'    => 'nullable|exists:lockers,LockerID',
            'LockerNumber'=> 'required|string|max:50|unique:lockers,LockerNumber,'.$request->LockerID.',LockerID',
            'Status'      => 'required|string|max:50',   // e.g. 'Available', 'Occupied', 'OutOfService'
            'Notes'       => 'nullable|string',
        ]);

        if (!empty($data['LockerID'])) {
            // update existing
            $locker = Locker::findOrFail($data['LockerID']);
            $locker->update($data);
        } else {
            // create new
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
        $data = $request->validate([
            'LockerID'    => 'required|exists:lockers,LockerID',
            'MemberID'    => 'required|exists:members,MemberID',
            'Notes'       => 'nullable|string',
        ]);

        // Create a new usage record
        LockerUsage::create([
            'LockerID'     => $data['LockerID'],
            'MemberID'     => $data['MemberID'],
            'KeyBorrowed'  => true,
            'BorrowDate'   => now(),
            'Returned'     => false,
            'Notes'        => $data['Notes'] ?? null,
        ]);

        // Optionally update locker status => 'Occupied'
        Locker::where('LockerID',$data['LockerID'])->update(['Status'=>'Occupied']);

        return redirect()->back()->with('success','Locker key borrowed successfully.');
    }

    /**
     * Return Locker Key => update an existing LockerUsage record
     */
    public function returnLockerKey($usageId)
    {
        $usage = LockerUsage::findOrFail($usageId);
        if ($usage->Returned) {
            return redirect()->back()->with('info','Key already returned.');
        }

        $usage->update([
            'ReturnDate' => now(),
            'Returned'   => true,
        ]);

        // Optionally set locker back to 'Available'
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
        $equipment = Equipment::orderBy('Name','asc')->get();

        return Inertia::render('Operations/Equipment/Index', [
            'equipment' => $equipment
        ]);
    }

    /**
     * Create or update an Equipment record
     */
    public function storeEquipment(Request $request)
    {
        $data = $request->validate([
            'EquipmentID'        => 'nullable|exists:equipment,EquipmentID',
            'Name'               => 'required|string|max:100',
            'SerialNumber'       => 'nullable|string|max:100|unique:equipment,SerialNumber,'.$request->EquipmentID.',EquipmentID',
            'Status'             => 'required|string|max:50', // e.g. 'Available','InMaintenance','OutOfService'
            'LastMaintenanceDate'=> 'nullable|date',
            'Notes'              => 'nullable|string',
        ]);

        if (!empty($data['EquipmentID'])) {
            // update
            $eq = Equipment::findOrFail($data['EquipmentID']);
            $eq->update($data);
        } else {
            // create
            Equipment::create($data);
        }

        return redirect()
            ->route('operations.equipment.index')
            ->with('success','Equipment saved successfully.');
    }

    /**
     * 47. Add MaintenanceLog => route:All
     */
    public function addMaintenanceLog(Request $request)
    {
        $data = $request->validate([
            'EquipmentID'        => 'required|exists:equipment,EquipmentID',
            'MaintenanceDate'    => 'required|date',
            'IssueDescription'   => 'nullable|string|max:255',
            'Resolution'         => 'nullable|string|max:255',
            'MaintainedBy'       => 'nullable|integer', // if referencing staff ID or external
            'NextMaintenanceDate'=> 'nullable|date|after_or_equal:MaintenanceDate',
            'Notes'              => 'nullable|string',
        ]);

        MaintenanceLog::create($data);

        // Optionally update equipment status => 'InMaintenance' or something
        // Or keep it separate.

        return redirect()->back()->with('success','Maintenance log recorded successfully.');
    }


    /* ------------------------------------------------------------------
     * S. MEMBERVISIT
     * ------------------------------------------------------------------ */

    /**
     * 50. Log Visit => route:All
     */
    public function createVisit()
    {
        // For a dropdown of members
        $members = Member::orderBy('FullName')->get();

        return Inertia::render('Operations/Visits/Create', compact('members'));
    }

    public function storeVisit(Request $request)
    {
        $data = $request->validate([
            'MemberID'      => 'required|exists:members,MemberID',
            'VisitDate'     => 'required|date',
            'VisitTime'     => 'required',
            'CheckInMethod' => 'nullable|string|max:50', // e.g. 'Biometric','Card'
            'Remarks'       => 'nullable|string',
        ]);

        MemberVisit::create($data);

        return redirect()
            ->route('operations.visits.index')
            ->with('success','Visit logged successfully.');
    }

    // 51. View/Update => route:All
    public function indexVisits()
    {
        $visits = MemberVisit::with('member')->orderBy('VisitDate','desc')->get();

        return Inertia::render('Operations/Visits/Index', compact('visits'));
    }

    public function editVisit($id)
    {
        $visit   = MemberVisit::findOrFail($id);
        $members = Member::orderBy('FullName')->get();

        return Inertia::render('Operations/Visits/Edit', [
            'visit'   => $visit,
            'members' => $members
        ]);
    }

    public function updateVisit(Request $request, $id)
    {
        $visit = MemberVisit::findOrFail($id);

        $data = $request->validate([
            'MemberID'      => 'required|exists:members,MemberID',
            'VisitDate'     => 'required|date',
            'VisitTime'     => 'required',
            'CheckInMethod' => 'nullable|string|max:50',
            'Remarks'       => 'nullable|string',
        ]);

        $visit->update($data);

        return redirect()
            ->route('operations.visits.index')
            ->with('success','Visit updated successfully.');
    }
}
