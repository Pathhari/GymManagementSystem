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

    public function createCashFlow()
    {
        return response()->json([
            'message' => 'Endpoint for creating a new cash flow record. Provide branch list here if needed.'
        ]);
    }

    public function generateDailyCashFlow(Request $request)
    {
        $request->validate([
            'date'      => 'required|date',
            'branch_id' => 'required|exists:branches,BranchID',
        ]);
    
        $date     = $request->input('date');
        $branchId = $request->input('branch_id');
    
        // Always set BusinessType = 'Gym' here, so PettyCash is 0
        // (We do not carry petty cash in Gym record)
        $dailyFlow = DailyCashFlow::firstOrCreate(
            [
                'Date'         => $date,
                'BranchID'     => $branchId,
                'BusinessType' => 'Gym',
            ],
            [
                'CashSales'        => 0,
                'GCashSales'       => 0,
                'BPISales'         => 0,
                'BDOSales'         => 0,
                'WalkInCashSales'  => 0,
                'WalkInGCashSales' => 0,
                'WalkInBPISales'   => 0,
                'WalkInBDOSales'   => 0,
                'PettyCash'        => 0,   // Always 0 for Gym
                'DepositedAmount'  => 0,
                'TotalSales'       => 0,
            ]
        );
    
        // -- No leftover petty cash logic here since "Gym" does not hold PettyCash --
    
        // Sum membership payments for this date/branch
        $payments = \App\Models\Payment::whereDate('PaymentDate', $date)
            ->where('BranchID', $branchId)
            ->get();
    
        $sumCash  = $payments->where('PaymentMethod', 'Cash')->sum('Amount');
        $sumGCash = $payments->where('PaymentMethod', 'GCash')->sum('Amount');
        $sumBPI   = $payments->where('PaymentMethod', 'BPI')->sum('Amount');
        $sumBDO   = $payments->where('PaymentMethod', 'BDO')->sum('Amount');
    
        $dailyFlow->CashSales  = $sumCash;
        $dailyFlow->GCashSales = $sumGCash;
        $dailyFlow->BPISales   = $sumBPI;
        $dailyFlow->BDOSales   = $sumBDO;
    
        // Recompute total
        $dailyFlow->TotalSales =
            ($dailyFlow->CashSales ?? 0) +
            ($dailyFlow->GCashSales ?? 0) +
            ($dailyFlow->BPISales ?? 0) +
            ($dailyFlow->BDOSales ?? 0) +
            ($dailyFlow->WalkInCashSales ?? 0) +
            ($dailyFlow->WalkInGCashSales ?? 0) +
            ($dailyFlow->WalkInBPISales ?? 0) +
            ($dailyFlow->WalkInBDOSales ?? 0);
    
        $dailyFlow->save();
    
        return response()->json([
            'success' => true,
            'message' => 'Daily cash flow (Gym) generated/updated successfully.',
            'data'    => $dailyFlow,
        ], 200);
    }
    


    public function storeCashFlow(Request $request)
    {
        $staff = auth('staff')->user();
    
        // 1) Validate
        //    If you have no scenario where BranchID can be null, remove the "Overall" logic entirely:
        $data = $request->validate([
            'BranchID'         => 'required|exists:branches,BranchID',
            'Date'             => 'required|date',
            'BusinessType'     => 'required|string|max:100',
    
            'CashSales'        => 'nullable|numeric|min:0',
            'GCashSales'       => 'nullable|numeric|min:0',
            'BPISales'         => 'nullable|numeric|min:0',
            'BDOSales'         => 'nullable|numeric|min:0',
    
            'WalkInCashSales'  => 'nullable|numeric|min:0',
            'WalkInGCashSales' => 'nullable|numeric|min:0',
            'WalkInBPISales'   => 'nullable|numeric|min:0',
            'WalkInBDOSales'   => 'nullable|numeric|min:0',
    
            'PettyCash'        => 'nullable|numeric|min:0',
            'DepositedAmount'  => 'nullable|numeric|min:0',
            'Remarks'          => 'nullable|string',
        ]);
    
        // If you still want "Overall" to have null BranchID, handle it here:
        // (Remove if you are no longer using Overall lumpsum)
        if ($data['BusinessType'] === 'Overall') {
            $data['BranchID'] = null;
        }
    
        // 2) Staff check
        if ($staff && !empty($data['BranchID'])) {
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            if (!in_array($data['BranchID'], $staffBranchIDs)) {
                return response()->json([
                    'error' => 'You cannot create a Cash Flow for a branch you are not assigned to.'
                ], 403);
            }
        }
    
        // 3) Compute total from sales columns
        $total = 0;
        $total += $data['CashSales']        ?? 0;
        $total += $data['GCashSales']       ?? 0;
        $total += $data['BPISales']         ?? 0;
        $total += $data['BDOSales']         ?? 0;
        $total += $data['WalkInCashSales']  ?? 0;
        $total += $data['WalkInGCashSales'] ?? 0;
        $total += $data['WalkInBPISales']   ?? 0;
        $total += $data['WalkInBDOSales']   ?? 0;
    
        $data['TotalSales'] = $total;
    
        // 4) Upsert: check if row already exists for [Date + BranchID + BusinessType]
        $existingQuery = DailyCashFlow::where('BusinessType', $data['BusinessType'])
            ->whereDate('Date', $data['Date']);
    
        if ($data['BusinessType'] !== 'Overall') {
            $existingQuery->where('BranchID', $data['BranchID']);
        } else {
            $existingQuery->whereNull('BranchID');
        }
    
        $existing = $existingQuery->first();
    
        if ($existing) {
            // We have a record -> update/merge
            $existing->CashSales        += $data['CashSales']        ?? 0;
            $existing->GCashSales       += $data['GCashSales']       ?? 0;
            $existing->BPISales         += $data['BPISales']         ?? 0;
            $existing->BDOSales         += $data['BDOSales']         ?? 0;
            $existing->WalkInCashSales  += $data['WalkInCashSales']  ?? 0;
            $existing->WalkInGCashSales += $data['WalkInGCashSales'] ?? 0;
            $existing->WalkInBPISales   += $data['WalkInBPISales']   ?? 0;
            $existing->WalkInBDOSales   += $data['WalkInBDOSales']   ?? 0;
    
            // *** Now we let every business have petty & deposit
            // If you want to ADD to petty, do +=. If you want to OVERWRITE, do =.
            $existing->PettyCash       += $data['PettyCash']       ?? 0;
            $existing->DepositedAmount += $data['DepositedAmount'] ?? 0;
    
            // Recompute total
            $existing->TotalSales = (
                $existing->CashSales + $existing->GCashSales + 
                $existing->BPISales   + $existing->BDOSales   +
                $existing->WalkInCashSales  + $existing->WalkInGCashSales + 
                $existing->WalkInBPISales   + $existing->WalkInBDOSales
            );
    
            // Append remarks if provided
            if (!empty($data['Remarks'])) {
                $existing->Remarks = trim($existing->Remarks . ' | ' . $data['Remarks']);
            }
    
            $existing->save();
            $flow = $existing;
        } else {
            // Create new
            $flow = DailyCashFlow::create($data);
        }
    
        return response()->json([
            'success' => true,
            'message' => 'Cash flow recorded successfully.',
            'data'    => $flow,
        ], 201);
    }
    

    public function indexCashFlow()
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        if ($staff) {
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            $flows = DailyCashFlow::select('CashFlowID', 'Date', 'BusinessType', 'TotalSales', 'Remarks')
                ->whereIn('BranchID', $staffBranchIDs)
                ->orderBy('Date', 'desc')
                ->get();
        } elseif ($admin || $owner) {
            $flows = DailyCashFlow::orderBy('Date', 'desc')->get();
        } else {
            $flows = collect([]);
        }

        return response()->json(['flows' => $flows]);
    }

    /* ------------------------------------------------------------------
     * EXPENSES
     * ------------------------------------------------------------------ */

    public function createExpense()
    {
        return response()->json([
            'message' => 'Endpoint for creating a new expense.'
        ]);
    }

    public function storeExpense(Request $request)
    {
        $staff = auth('staff')->user();
    
        $data = $request->validate([
            'BranchID'        => 'required|exists:branches,BranchID',
            'ExpenseDate'     => 'required|date',
            'ExpenseCategory' => 'required|string|max:100',
            'Amount'          => 'required|numeric|min:0',
            'PaymentMethod'   => 'nullable|string|max:50',
            'StaffID'         => 'nullable|exists:staff,StaffID',
            'Notes'           => 'nullable|string',
    
            // NEW validation for BusinessType
            'BusinessType'    => 'required|string|max:50', 
            // optionally -> 'in:Gym,Cafe,Yogurt,"Yogurt Cafe"' if you want to enforce choices
        ]);
    
        if ($staff) {
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            if (!in_array($data['BranchID'], $staffBranchIDs)) {
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

    public function indexExpenses()
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();
    
        if ($staff) {
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            $expenses = Expense::with('staff')
                ->select('ExpenseID', 'ExpenseDate', 'ExpenseCategory',
                         'Amount', 'Notes', 'StaffID', 'BranchID',
                         'BusinessType' // <--- Include this so it shows in JSON
                )
                ->whereIn('BranchID', $staffBranchIDs)
                ->orderBy('ExpenseDate', 'desc')
                ->get();
        } elseif ($admin || $owner) {
            $expenses = Expense::with('staff')
                ->orderBy('ExpenseDate', 'desc')
                ->get(); 
                // returns all columns, including BusinessType if you haven't hidden it
        } else {
            $expenses = collect([]);
        }
    
        return response()->json(['expenses' => $expenses]);
    }
    
    public function updateExpense(Request $request, $id)
    {
        $staff   = auth('staff')->user();
        $expense = Expense::findOrFail($id);
    
        $data = $request->validate([
            'BranchID'        => 'required|exists:branches,BranchID',
            'ExpenseDate'     => 'required|date',
            'ExpenseCategory' => 'required|string|max:100',
            'Amount'          => 'required|numeric|min:0',
            'PaymentMethod'   => 'nullable|string|max:50',
            'StaffID'         => 'nullable|exists:staff,StaffID',
            'Notes'           => 'nullable|string',
            
            // NEW
            'BusinessType'    => 'required|string|max:50',
        ]);
    
        if ($staff) {
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            if (!in_array($expense->BranchID, $staffBranchIDs)) {
                return response()->json([
                    'error' => 'Cannot update expense from a branch you are not assigned to.'
                ], 403);
            }
            if (!in_array($data['BranchID'], $staffBranchIDs)) {
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
    
    public function destroyExpense($id)
    {
        $staff = auth('staff')->user();
        $expense = Expense::findOrFail($id);

        if ($staff) {
            $staffBranchIDs = $staff->branches->pluck('BranchID')->toArray();
            if (!in_array($expense->BranchID, $staffBranchIDs)) {
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

    public function indexPromotions(Request $request)
    {
        $promos = Promotions::orderBy('Name', 'asc')->get();

        return response()->json([
            'promos' => $promos
        ]);
    }

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
     * Return financial summary (total revenue, net profit).
     */
    public function getFinancialSummary()
    {
        $staff = auth('staff')->user();

        $cashFlowQuery = DailyCashFlow::query();
        $expenseQuery = Expense::query();

        if ($staff) {
            $branchIds = $staff->branches->pluck('BranchID')->toArray();
            $cashFlowQuery->whereIn('BranchID', $branchIds);
            $expenseQuery->whereIn('BranchID', $branchIds);
        }

        $totalRevenue = $cashFlowQuery->sum('TotalSales');
        $totalExpenses = $expenseQuery->sum('Amount');
        $netProfit = $totalRevenue - $totalExpenses;

        return response()->json([
            'total_revenue' => $totalRevenue,
            'net_profit'    => $netProfit
        ]);
    }

    /**
     * NEW: Overview KPIs endpoint that aggregates multiple KPI values.
     * These values will populate the front-end overview cards.
     */
    public function getOverviewKPIs()
    {
        $staff = auth('staff')->user();

        // Financial summary
        $cashFlowQuery = DailyCashFlow::query();
        $expenseQuery = Expense::query();
        if ($staff) {
            $branchIds = $staff->branches->pluck('BranchID')->toArray();
            $cashFlowQuery->whereIn('BranchID', $branchIds);
            $expenseQuery->whereIn('BranchID', $branchIds);
        }
        $totalRevenue = $cashFlowQuery->sum('TotalSales');
        $totalExpenses = $expenseQuery->sum('Amount');
        $netProfit = $totalRevenue - $totalExpenses;

        // New Members This Month
        $currentMonth = date('M Y');
        $newMembersThisMonth = DB::table('members')
            ->whereNotNull('MembershipStartDate')
            ->whereRaw("DATE_FORMAT(MembershipStartDate, '%b %Y') = ?", [$currentMonth])
            ->count();

        // Attendance Rate: average weekly attendance based on 'attendances' table
        $weeklyAttendance = DB::table('attendances')
            ->select(
                DB::raw("YEAR(Date) as year"),
                DB::raw("WEEK(Date, 1) as week"),
                DB::raw("COUNT(*) as totalAttendance")
            )
            ->groupBy('year', 'week')
            ->get();
        $sumAttendance = $weeklyAttendance->sum('totalAttendance');
        $numWeeks = $weeklyAttendance->count();
        $avgAttendance = $numWeeks > 0 ? $sumAttendance / $numWeeks : 0;
        // Assuming a weekly target of 100 attendances
        $attendanceRatePercent = $avgAttendance > 0 ? min(round(($avgAttendance / 100) * 100), 100) : 0;
        $attendanceRate = $attendanceRatePercent . "%";

        // Most Popular Service: determine the facility with the highest number of bookings this month
        $popularBooking = DB::table('bookings')
            ->select('FacilityID', DB::raw("COUNT(*) as count"))
            ->whereYear('BookingDate', date('Y'))
            ->whereMonth('BookingDate', date('m'))
            ->groupBy('FacilityID')
            ->orderByDesc('count')
            ->first();
        $mostPopularService = "N/A";
        if ($popularBooking) {
            $facility = DB::table('facilities')
                ->where('FacilityID', $popularBooking->FacilityID)
                ->first();
                if ($facility) {
                    $mostPopularService = $facility->FacilityName; 
                }
                
        }

        return response()->json([
            'total_revenue'          => $totalRevenue,
            'net_profit'             => $netProfit,
            'new_members_this_month' => $newMembersThisMonth,
            'attendance_rate'        => $attendanceRate,
            'most_popular_service'   => $mostPopularService,
        ]);
    }

    /**
     * Alias for front-end compatibility.
     * GET /finance/summary will now call this method.
     */
    public function indexSummary()
    {
        return $this->getOverviewKPIs();
    }
}
