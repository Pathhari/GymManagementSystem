<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DailyCashFlow;
use App\Models\Expense;
use App\Models\Promotions;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    /* ------------------------------------------------------------------
     * DAILY CASH FLOW
     * ------------------------------------------------------------------ */

    /**
     * Show any data needed before creating a cash flow record
     * (e.g., branch list). Returns JSON instead of an Inertia page.
     */
    public function createCashFlow()
    {
        // Example: if you want to return branches or other data needed on the form:
        // $branches = Branch::select('BranchID','BranchName')->get();
        // return response()->json([
        //     'branches' => $branches
        // ]);

        return response()->json([
            'message' => 'Endpoint for creating a new cash flow record. Provide branch list here if needed.'
        ]);
    }

    /**
     * Store a newly created DailyCashFlow record and return JSON.
     */
    public function storeCashFlow(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'BranchID'         => 'required|exists:branches,BranchID',
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

        // Compute total
        $total = 0;
        $total += $data['CashSales']        ?? 0;
        $total += $data['GCashSales']       ?? 0;
        $total += $data['BPISales']         ?? 0;
        $total += $data['BDOSales']         ?? 0;
        $total += $data['WalkInBDOSales']   ?? 0;
        $total += $data['WalkInCashSales']  ?? 0;
        $total += $data['WalkInGCashSales'] ?? 0;
        $total += $data['WalkInBPISales']   ?? 0;
        $data['TotalSales'] = $total;

        // Staff branch check
        if ($staff) {
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            if (! in_array($data['BranchID'], $staffBranchIDs)) {
                return response()->json([
                    'error' => 'You cannot create a Cash Flow for a branch you are not assigned to.'
                ], 403);
            }
        }

        $flow = DailyCashFlow::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Cash flow recorded successfully.',
            'data'    => $flow
        ], 201);
    }

    /**
     * Return list of daily cash flow records in JSON.
     */
    public function indexCashFlow()
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        if ($staff) {
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            $flows = DailyCashFlow::select('CashFlowID','Date','BusinessType','TotalSales','Remarks')
                ->whereIn('BranchID', $staffBranchIDs)
                ->orderBy('Date','desc')
                ->get();
        } elseif ($admin || $owner) {
            $flows = DailyCashFlow::orderBy('Date','desc')->get();
        } else {
            $flows = collect([]);
        }

        return response()->json(['flows' => $flows]);
    }

    /* ------------------------------------------------------------------
     * EXPENSES
     * ------------------------------------------------------------------ */

    /**
     * Return any data needed to create an expense (JSON).
     */
    public function createExpense()
    {
        // Example: branches, expense categories, etc.
        // $branches = Branch::select('BranchID','BranchName')->get();

        return response()->json([
            'message' => 'Endpoint for creating a new expense.',
            // 'branches' => $branches
        ]);
    }

    /**
     * Store a new Expense in JSON.
     */
    public function storeExpense(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'BranchID'       => 'required|exists:branches,BranchID',
            'ExpenseDate'    => 'required|date',
            'ExpenseCategory'=> 'required|string|max:100',
            'Amount'         => 'required|numeric|min:0',
            'PaymentMethod'  => 'nullable|string|max:50',
            'StaffID'        => 'nullable|exists:staff,StaffID',
            'Notes'          => 'nullable|string',
        ]);

        // Staff branch check
        if ($staff) {
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            if (! in_array($data['BranchID'], $staffBranchIDs)) {
                return response()->json([
                    'error' => 'You cannot create an Expense for a branch you are not assigned to.'
                ], 403);
            }
        }

        $expense = Expense::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Expense created successfully.',
            'data'    => $expense
        ], 201);
    }

    /**
     * Return list of expenses in JSON.
     */
    public function indexExpenses()
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        if ($staff) {
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            $expenses = Expense::with('staff')
                ->select('ExpenseID','ExpenseDate','ExpenseCategory','Amount','Notes','StaffID','BranchID')
                ->whereIn('BranchID', $staffBranchIDs)
                ->orderBy('ExpenseDate','desc')
                ->get();
        } elseif ($admin || $owner) {
            $expenses = Expense::with('staff')
                ->orderBy('ExpenseDate','desc')
                ->get();
        } else {
            $expenses = collect([]);
        }

        return response()->json(['expenses' => $expenses]);
    }

    /**
     * Update an expense by ID (JSON).
     */
    public function updateExpense(Request $request, $id)
    {
        $staff = auth('staff')->user();
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

        // Staff => check branch pivot
        if ($staff) {
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            if (! in_array($expense->BranchID, $staffBranchIDs)) {
                return response()->json([
                    'error' => 'Cannot update expense from a branch you are not assigned to.'
                ], 403);
            }
            if (! in_array($data['BranchID'], $staffBranchIDs)) {
                return response()->json([
                    'error' => 'Cannot change expense to a branch you are not assigned to.'
                ], 403);
            }
        }

        $expense->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Expense updated successfully.',
            'data'    => $expense
        ]);
    }

    /**
     * Delete an expense by ID (JSON).
     */
    public function destroyExpense($id)
    {
        $staff = auth('staff')->user();
        $expense = Expense::findOrFail($id);

        if ($staff) {
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            if (! in_array($expense->BranchID, $staffBranchIDs)) {
                return response()->json([
                    'error' => 'Cannot delete an expense from a branch you are not assigned to.'
                ], 403);
            }
        }

        $expense->delete();

        return response()->json([
            'success' => true,
            'message' => 'Expense deleted successfully.'
        ]);
    }

    /* ------------------------------------------------------------------
     * PROMOTIONS
     * ------------------------------------------------------------------ */

    /**
     * List all promotions. Return JSON.
     */
    public function indexPromotions(Request $request)
    {
        $promos = Promotions::orderBy('Name','asc')->get();

        return response()->json([
            'promos' => $promos
        ]);
    }

    /**
     * Create or update a Promotion (JSON).
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
            $promo = Promotions::create($data);
        }

        return response()->json([
            'success' => true,
            'message' => 'Promotion saved successfully.',
            'data'    => $promo
        ]);
    }

    /**
     * Toggle active/inactive for a promotion. Return JSON.
     */
    public function togglePromotion($id)
    {
        $promo = Promotions::findOrFail($id);

        if ($promo->Status === 'Active') {
            $promo->update(['Status' => 'Inactive']);
        } else {
            $promo->update(['Status' => 'Active']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Promotion status toggled.',
            'data'    => $promo
        ]);
    }

    /**
     * Financial summary (already returns JSON).
     */
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
            'net_profit'    => $totalRevenue - $totalExpenses
        ]);
    }
}
