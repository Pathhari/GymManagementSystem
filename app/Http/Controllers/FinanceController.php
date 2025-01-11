<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\DailyCashFlow;
use App\Models\Expense;
use App\Models\Promotions;
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
        // Possibly no extra data needed—just show the form
        return Inertia::render('Finance/CashFlow/Create');
    }

    /**
     * Store a newly created DailyCashFlow record.
     */
    public function storeCashFlow(Request $request)
    {
        // Validating fields from your DailyCashFlow ERD structure
        $data = $request->validate([
            'Date'              => 'required|date',
            'BusinessType'      => 'required|string|max:100',  // e.g. 'Gym', 'Cafe', 'Yogurt Cafe'
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

        // Auto-compute TotalSales from the relevant fields:
        $total = 0;
        $total += $data['CashSales']         ?? 0;
        $total += $data['GCashSales']        ?? 0;
        $total += $data['BPISales']          ?? 0;
        $total += $data['WalkInCashSales']   ?? 0;
        $total += $data['WalkInGCashSales']  ?? 0;
        $total += $data['WalkInBPISales']    ?? 0;
        $data['TotalSales'] = $total;

        // Create the daily cash flow record
        DailyCashFlow::create($data);

        return redirect()
            ->route('finance.cashflow.index')
            ->with('success','Cash flow recorded successfully.');
    }

    /**
     * 62. View => route:Owner,Admin,Staff
     * Possibly partial data for Staff.
     */
    public function indexCashFlow()
    {
        $user = auth()->user();

        if ($user && $user->role === 'Staff') {
            // Staff sees partial columns
            $flows = DailyCashFlow::select(
                'CashFlowID','Date','BusinessType','TotalSales','Remarks'
            )->orderBy('Date','desc')->get();
        } else {
            // Owner/Admin see full columns
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
        // If you need Staff info for StaffID, you could load it here
        // e.g. $staff = Staff::all();
        return Inertia::render('Finance/Expenses/Create'/*, compact('staff')*/);
    }

    /**
     * Store a new Expense record.
     */
    public function storeExpense(Request $request)
    {
        // Fields from ERD:
        // ExpenseID (PK), ExpenseDate, ExpenseCategory, Amount, PaymentMethod, StaffID, Notes
        $data = $request->validate([
            'ExpenseDate'     => 'required|date',
            'ExpenseCategory' => 'required|string|max:100',
            'Amount'          => 'required|numeric|min:0',
            'PaymentMethod'   => 'nullable|string|max:50',  // e.g. 'Cash','GCash','BPI'
            'StaffID'         => 'nullable|exists:staff,StaffID', // if a staff member incurred it
            'Notes'           => 'nullable|string',
        ]);

        // Create expense row
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
        $user = auth()->user();

        if ($user && $user->role === 'Staff') {
            // Staff sees partial columns, e.g., not PaymentMethod
            $expenses = Expense::with('staff')
                ->select('ExpenseID','ExpenseDate','ExpenseCategory','Amount','StaffID','Notes')
                ->orderBy('ExpenseDate','desc')
                ->get();
        } else {
            // Owner/Admin see full columns
            $expenses = Expense::with('staff')
                ->orderBy('ExpenseDate','desc')
                ->get();
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
        $expense = Expense::findOrFail($id);
        // $staff = Staff::all(); // if you want to let user pick new StaffID

        return Inertia::render('Finance/Expenses/Edit', [
            'expense' => $expense
            // 'staff' => $staff
        ]);
    }

    public function updateExpense(Request $request, $id)
    {
        $expense = Expense::findOrFail($id);

        $data = $request->validate([
            'ExpenseDate'     => 'required|date',
            'ExpenseCategory' => 'required|string|max:100',
            'Amount'          => 'required|numeric|min:0',
            'PaymentMethod'   => 'nullable|string|max:50',
            'StaffID'         => 'nullable|exists:staff,StaffID',
            'Notes'           => 'nullable|string',
        ]);

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
        $expense = Expense::findOrFail($id);
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
        // promotions => [PromotionID, Name, DiscountType, DiscountValue, StartDate, EndDate, TermsAndConditions, Status]
        $promos = Promotions::orderBy('Name','asc')->get();

        return Inertia::render('Finance/Promotions/Index', compact('promos'));
    }

    /**
     * Store or update a Promotion
     */
    public function storePromotion(Request $request)
    {
        $data = $request->validate([
            'PromotionID'        => 'nullable|exists:promotions,PromotionID',
            'Name'               => 'required|string|max:255',
            'DiscountType'       => 'required|string|max:50',   // e.g. 'Percentage','FixedAmount'
            'DiscountValue'      => 'required|numeric|min:0',
            'StartDate'          => 'required|date',
            'EndDate'            => 'nullable|date|after_or_equal:StartDate',
            'TermsAndConditions' => 'nullable|string',
            'Status'             => 'nullable|string|max:50',  // 'Active','Expired','Scheduled'
        ]);

        if (!empty($data['PromotionID'])) {
            // Update existing
            $promo = Promotions::findOrFail($data['PromotionID']);
            $promo->update($data);
        } else {
            // Create new
            Promotions::create($data);
        }

        return redirect()->back()->with('success','Promotion saved successfully.');
    }

    /**
     * 55. Activate/Deactivate => route:All
     */
    public function togglePromotion($id)
    {
        $promo = Promotions::findOrFail($id);

        // If currently 'Active', switch to 'Inactive' or vice versa
        if ($promo->Status === 'Active') {
            $promo->update(['Status' => 'Inactive']);
        } else {
            $promo->update(['Status' => 'Active']);
        }

        return redirect()->back()->with('success','Promotion status toggled.');
    }
}
