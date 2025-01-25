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
    
        $data = $request->validate([
            'BranchID'         => 'required|exists:branches,BranchID',  // always pick a branch
            'Date'             => 'required|date',
            'BusinessType'     => 'required|string|max:100',
            'CashSales'        => 'nullable|numeric|min:0',
            'GCashSales'       => 'nullable|numeric|min:0',
            'BPISales'         => 'nullable|numeric|min:0',
            'WalkInCashSales'  => 'nullable|numeric|min:0',
            'WalkInGCashSales' => 'nullable|numeric|min:0',
            'WalkInBPISales'   => 'nullable|numeric|min:0',
            'PettyCash'        => 'nullable|numeric|min:0',
            'DepositedAmount'  => 'nullable|numeric|min:0',
            'Remarks'          => 'nullable|string',
        ]);
    
        // Auto-compute total
        $total = 0;
        $total += $data['CashSales']        ?? 0;
        $total += $data['GCashSales']       ?? 0;
        $total += $data['BPISales']         ?? 0;
        $total += $data['WalkInCashSales']  ?? 0;
        $total += $data['WalkInGCashSales'] ?? 0;
        $total += $data['WalkInBPISales']   ?? 0;
        $data['TotalSales'] = $total;
    
        // If staff is logged in, ensure the selected BranchID is one they have access to
        if ($staff) {
            // If staff is multi-branch assigned, verify that $request->BranchID is in their pivot
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            if (! in_array($data['BranchID'], $staffBranchIDs)) {
                abort(403, 'You cannot create a Cash Flow for a branch you are not assigned to.');
            }
        } 
        // If admin/owner => we trust the incoming BranchID is valid
    
        DailyCashFlow::create($data);
    
        return redirect()
            ->route('finance.cashflow.index')
            ->with('success','Cash flow recorded successfully.');
    }
    
    public function indexCashFlow()
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();
    
        if ($staff) {
            // If staff => show only branches they have
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            // Possibly partial columns
            $flows = DailyCashFlow::select('CashFlowID','Date','BusinessType','TotalSales','Remarks')
                ->whereIn('BranchID', $staffBranchIDs)
                ->orderBy('Date','desc')
                ->get();
        } elseif ($admin || $owner) {
            // Admin/Owner => see everything
            $flows = DailyCashFlow::orderBy('Date','desc')->get();
        } else {
            // If no auth => maybe show none or handle differently
            $flows = collect([]);
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
            'BranchID'       => 'required|exists:branches,BranchID',
            'ExpenseDate'    => 'required|date',
            'ExpenseCategory'=> 'required|string|max:100',
            'Amount'         => 'required|numeric|min:0',
            'PaymentMethod'  => 'nullable|string|max:50',
            'StaffID'        => 'nullable|exists:staff,StaffID',
            'Notes'          => 'nullable|string',
        ]);
    
        if ($staff) {
            // If staff => check if BranchID is among staff->branches
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            if (! in_array($data['BranchID'], $staffBranchIDs)) {
                abort(403, 'You cannot create an Expense for a branch you are not assigned to.');
            }
        }
    
        Expense::create($data);
    
        return redirect()->route('finance.expenses.index')
            ->with('success','Expense created successfully.');
    }
    
    public function indexExpenses()
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();
    
        if ($staff) {
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            // Staff sees partial columns + only branches in $staffBranchIDs
            $expenses = Expense::with('staff')
                ->select('ExpenseID','ExpenseDate','ExpenseCategory','Amount','Notes','StaffID','BranchID')
                ->whereIn('BranchID', $staffBranchIDs)
                ->orderBy('ExpenseDate','desc')
                ->get();
        } elseif ($admin || $owner) {
            // admin/owner => see all
            $expenses = Expense::with('staff')
                ->orderBy('ExpenseDate','desc')
                ->get();
        } else {
            $expenses = collect([]);
        }
    
        return Inertia::render('Finance/Expenses/Index', [
            'expenses' => $expenses
        ]);
    }
    
    public function updateExpense(Request $request, $id)
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();
    
        $expense = Expense::findOrFail($id);
    
        $data = $request->validate([
            'BranchID'       => 'required|exists:branches,BranchID',
            'ExpenseDate'    => 'required|date',
            'ExpenseCategory'=> 'required|string|max:100',
            'Amount'         => 'required|numeric|min:0',
            'PaymentMethod'  => 'nullable|string|max:50',
            'StaffID'        => 'nullable|exists:staff,StaffID',
            'Notes'          => 'nullable|string',
        ]);
    
        // Staff => check pivot
        if ($staff) {
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            // Also ensure the existing expense belongs to one of staff's branches
            // AND the new BranchID is also allowed
            if (! in_array($expense->BranchID, $staffBranchIDs)) {
                abort(403, 'Cannot update expense from a branch you are not assigned to.');
            }
            if (! in_array($data['BranchID'], $staffBranchIDs)) {
                abort(403, 'Cannot change expense to a branch you are not assigned to.');
            }
        }
    
        $expense->update($data);
    
        return redirect()->route('finance.expenses.index')
            ->with('success','Expense updated successfully.');
    }
    
    public function destroyExpense($id)
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();
    
        $expense = Expense::findOrFail($id);
    
        if ($staff) {
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            if (! in_array($expense->BranchID, $staffBranchIDs)) {
                abort(403, 'Cannot delete an expense from a branch you are not assigned to.');
            }
        }
    
        $expense->delete();
    
        return redirect()->route('finance.expenses.index')
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

    public function getFinancialSummary()
    {
        $staff = auth('staff')->user();
        
        $cashFlowQuery = DailyCashFlow::query();
        $expenseQuery = Expense::query();
        
        if ($staff) {
            $branchIds = $staff->branches->pluck('BranchID');
            $cashFlowQuery->whereIn('BranchID', $branchIds);
            $expenseQuery->whereIn('BranchID', $branchIds);
        }
        
        $totalRevenue = $cashFlowQuery->sum('TotalSales');
        $totalExpenses = $expenseQuery->sum('Amount');
        
        return response()->json([
            'total_revenue' => $totalRevenue,
            'net_profit' => $totalRevenue - $totalExpenses
        ]);
    }

}
