<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\DailyCashFlow;
use App\Models\Expense;
use App\Models\Promotions;
// If you have a Staff model, you can reference it too:
// use App\Models\Staff;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    /* ------------------------------------------------------------------
     * X. DAILY CASH FLOW (Table #10 in ERD)
     * ------------------------------------------------------------------ */

    /**
     * 61. Record => route:Owner,Admin
     * Show form to create a new daily cash flow record.
     */
    public function createCashFlow()
    {
        // If admin/owner can choose the branch, you might load a Branch::all() here
        // and pass it to the view. For staff, they'd have only 1 branch.
        // Example:
        // $branches = auth('owner')->check() || auth('admin')->check()
        //     ? Branch::orderBy('BranchName')->get()
        //     : null;

        return Inertia::render('Finance/CashFlow/Create'/*, compact('branches')*/);
    }

    /**
     * Store a newly created DailyCashFlow record.
     */
    public function storeCashFlow(Request $request)
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        // Validation of daily cash flow fields
        $data = $request->validate([
            'Date'              => 'required|date',
            'BusinessType'      => 'required|string|max:100',  
            'CashSales'         => 'nullable|numeric|min:0',
            'GCashSales'        => 'nullable|numeric|min:0',
            'BPISales'          => 'nullable|numeric|min:0',
            'WalkInCashSales'   => 'nullable|numeric|min:0',
            'WalkInGCashSales'  => 'nullable|numeric|min:0',
            'WalkInBPISales'    => 'nullable|numeric|min:0',
            'PettyCash'         => 'nullable|numeric|min:0',
            'DepositedAmount'   => 'nullable|numeric|min:0',
            'Remarks'           => 'nullable|string',
        ]);

        // Auto-compute total
        $total  = 0;
        $total += $data['CashSales']         ?? 0;
        $total += $data['GCashSales']        ?? 0;
        $total += $data['BPISales']          ?? 0;
        $total += $data['WalkInCashSales']   ?? 0;
        $total += $data['WalkInGCashSales']  ?? 0;
        $total += $data['WalkInBPISales']    ?? 0;
        $data['TotalSales'] = $total;

        // If staff, auto-assign their BranchID
        if ($staff) {
            $data['BranchID'] = $staff->BranchID;
        } 
        // If owner or admin can pick a branch from the form, you'd do:
        // else if ($admin || $owner) { $data['BranchID'] = $request->BranchID; }

        DailyCashFlow::create($data);

        return redirect()
            ->route('finance.cashflow.index')
            ->with('success','Cash flow recorded successfully.');
    }

    /**
     * 62. View => route:Owner,Admin,Staff
     * Possibly partial data for Staff (per your example).
     */
    public function indexCashFlow()
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        // Staff can only see daily cash flow for their branch
        if ($staff) {
            // Possibly partial columns
            $flows = DailyCashFlow::select(
                'CashFlowID','Date','BusinessType','TotalSales','Remarks'
            )
            ->where('BranchID', $staff->BranchID)
            ->orderBy('Date','desc')
            ->get();
        } elseif ($admin) {
            // Admin sees full columns from all branches (assuming multi-branch)
            // Or if an admin is pinned to a single branch, filter here as well
            $flows = DailyCashFlow::orderBy('Date','desc')->get();
        } elseif ($owner) {
            // Owner sees everything
            $flows = DailyCashFlow::orderBy('Date','desc')->get();
        } else {
            // If user is not recognized, or for universal logic
            $flows = DailyCashFlow::orderBy('Date','desc')->get();
        }

        return Inertia::render('Finance/CashFlow/Index', [
            'flows' => $flows
        ]);
    }

    /* ------------------------------------------------------------------
     * AE. EXPENSES TABLE (#81–84 in ERD)
     * ------------------------------------------------------------------ */

    /**
     * 81. Create => route:Owner,Admin
     * Show a form to create a new expense record.
     */
    public function createExpense()
    {
        // If admin/owner can pick the branch, load branches
        // If staff => pinned to 1 branch
        return Inertia::render('Finance/Expenses/Create');
    }

    /**
     * Store a new Expense record.
     */
    public function storeExpense(Request $request)
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        $data = $request->validate([
            'ExpenseDate'     => 'required|date',
            'ExpenseCategory' => 'required|string|max:100',
            'Amount'          => 'required|numeric|min:0',
            'PaymentMethod'   => 'nullable|string|max:50',
            'StaffID'         => 'nullable|exists:staff,StaffID',
            'Notes'           => 'nullable|string',
        ]);

        // If staff, auto-assign BranchID
        if ($staff) {
            $data['BranchID'] = $staff->BranchID;
        } 
        // If admin/owner can choose a branch from the form:
        // else if ($admin || $owner) { $data['BranchID'] = $request->BranchID; }

        Expense::create($data);

        return redirect()
            ->route('finance.expenses.index')
            ->with('success','Expense created successfully.');
    }

    /**
     * 82. Read => route:All (Staff partial?)
     */
    public function indexExpenses()
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        // If staff => filter by staff->BranchID
        if ($staff) {
            // staff sees partial columns + only their branch
            $expenses = Expense::with('staff')
                ->select('ExpenseID','ExpenseDate','ExpenseCategory','Amount','Notes','StaffID','BranchID')
                ->where('BranchID', $staff->BranchID)
                ->orderBy('ExpenseDate','desc')
                ->get();
        } elseif ($admin || $owner) {
            // admin/owner => see all branches, all columns
            $expenses = Expense::with('staff')
                ->orderBy('ExpenseDate','desc')
                ->get();
        } else {
            // fallback => maybe no data
            $expenses = collect([]);
        }

        return Inertia::render('Finance/Expenses/Index', [
            'expenses' => $expenses
        ]);
    }

    /**
     * 83. Update => route:Owner,Admin
     * Show form to edit existing expense.
     */
    public function editExpense($id)
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        $expense = Expense::findOrFail($id);

        // If staff, ensure it’s in their branch
        if ($staff && $expense->BranchID != $staff->BranchID) {
            abort(403, 'Cannot edit an expense from another branch.');
        }

        return Inertia::render('Finance/Expenses/Edit', [
            'expense' => $expense
        ]);
    }

    public function updateExpense(Request $request, $id)
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        $expense = Expense::findOrFail($id);

        // staff => check branch
        if ($staff && $expense->BranchID != $staff->BranchID) {
            abort(403, 'Cannot update an expense from another branch.');
        }

        $data = $request->validate([
            'ExpenseDate'     => 'required|date',
            'ExpenseCategory' => 'required|string|max:100',
            'Amount'          => 'required|numeric|min:0',
            'PaymentMethod'   => 'nullable|string|max:50',
            'StaffID'         => 'nullable|exists:staff,StaffID',
            'Notes'           => 'nullable|string',
        ]);

        // If staff => keep existing expense->BranchID (cannot change)
        // If admin/owner => could allow $data['BranchID'] = $request->BranchID if you want

        $expense->update($data);

        return redirect()
            ->route('finance.expenses.index')
            ->with('success','Expense updated successfully.');
    }

    /**
     * 84. Delete => route:Owner,Admin
     */
    public function destroyExpense($id)
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        $expense = Expense::findOrFail($id);

        // staff => block if belongs to another branch
        if ($staff && $expense->BranchID != $staff->BranchID) {
            abort(403, 'Cannot delete an expense from another branch.');
        }

        $expense->delete();

        return redirect()
            ->route('finance.expenses.index')
            ->with('success','Expense deleted successfully.');
    }


    /* ------------------------------------------------------------------
     * U. PROMOTIONS TABLE (#54–55)
     * ------------------------------------------------------------------ */

    /**
     * 54. Create/Edit => route:All
     * Display all promotions; staff might see partial if needed.
     */
    public function indexPromotions()
    {
        // Currently, no BranchID in promotions table,
        // so we won’t filter by branch.
        // If you want staff to see partial columns, do it similarly:
        //   ->select('PromotionID','Name',...) for staff
        $promos = Promotions::orderBy('Name','asc')->get();

        return Inertia::render('Finance/Promotions/Index', compact('promos'));
    }

    /**
     * Store or update a Promotion (like a simple create).
     */
    public function storePromotion(Request $request)
    {
        $data = $request->validate([
            'PromotionID'        => 'nullable|exists:promotions,PromotionID',
            'Name'               => 'required|string|max:255',
            'DiscountType'       => 'required|string|max:50',
            'DiscountValue'      => 'required|numeric|min:0',
            'StartDate'          => 'required|date',
            'EndDate'            => 'nullable|date|after_or_equal:StartDate',
            'TermsAndConditions' => 'nullable|string',
            'Status'             => 'nullable|string|max:50',
        ]);

        if (!empty($data['PromotionID'])) {
            $promo = Promotions::findOrFail($data['PromotionID']);
            $promo->update($data);
        } else {
            Promotions::create($data);
        }

        return redirect()
            ->back()
            ->with('success','Promotion saved successfully.');
    }

    /**
     * 55. Activate/Deactivate => route:All
     */
    public function togglePromotion($id)
    {
        $promo = Promotions::findOrFail($id);

        if ($promo->Status === 'Active') {
            $promo->update(['Status' => 'Inactive']);
        } else {
            $promo->update(['Status' => 'Active']);
        }

        return redirect()->back()
            ->with('success','Promotion status toggled.');
    }
}
