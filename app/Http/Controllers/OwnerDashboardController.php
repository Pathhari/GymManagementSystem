<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\Member;
use App\Models\Expense;

class OwnerDashboardController extends Controller
{
    /**
     * Render the main Owner (Super Admin) Dashboard via Inertia.
     */
    public function index()
    {
        $dashboardData = [
            'title' => 'Owner (Super Admin) Dashboard',
            'info'  => 'Any data relevant to the Super Admin',
        ];

        return Inertia::render('Owner/DashboardLayoutWrapper', $dashboardData);
    }

    /**
     * Return key metrics and notifications for the Owner Dashboard.
     *
     * Supports query parameters:
     * - period   (daily, weekly, monthly, yearly)
     * - dateFrom (YYYY-MM-DD)
     * - dateTo   (YYYY-MM-DD)
     * - branch   (branch ID or 'all')
     */
    public function metrics(Request $request)
    {
        $period   = $request->query('period', 'monthly');
        $dateFrom = $request->query('dateFrom');
        $dateTo   = $request->query('dateTo');
        $branch   = $request->query('branch', 'all');

        // 1) Build query for payments that are 'Completed' or 'Paid',
        //    ensuring we include facility/coaching/membership payments.
        $paymentsQuery = Payment::whereIn('Status', ['Completed','Paid']);

        // If branch != 'all', limit by BranchID
        if ($branch !== 'all') {
            $paymentsQuery->where('BranchID', $branch);
        }

        // If dateFrom/dateTo set => filter by PaymentDate
        if (!empty($dateFrom)) {
            $paymentsQuery->whereDate('PaymentDate', '>=', $dateFrom);
        }
        if (!empty($dateTo)) {
            $paymentsQuery->whereDate('PaymentDate', '<=', $dateTo);
        }

        // Sum all amounts => totalRevenue
        $totalRevenue = $paymentsQuery->sum('Amount');

        // 2) Calculate total expenses
        $expensesQuery = Expense::query();
        if ($branch !== 'all') {
            $expensesQuery->where('BranchID', $branch);
        }
        if (!empty($dateFrom)) {
            $expensesQuery->whereDate('ExpenseDate', '>=', $dateFrom);
        }
        if (!empty($dateTo)) {
            $expensesQuery->whereDate('ExpenseDate', '<=', $dateTo);
        }
        $totalExpenses = $expensesQuery->sum('Amount');

        // 3) Example metrics: # of members, # of "emails sent," etc.
        $totalEmailsSent = Member::count();
        $totalClients    = Member::count(); // or some other logic

        // 4) Dummy traffic
        $trafficReceived = 1000;

        // 5) Dummy notifications
        $notifications = [
            ['message' => 'New transaction completed: TXN001'],
            ['message' => 'Revenue milestone reached: $500,000'],
            ['message' => 'New client added: Company ABC'],
            ['message' => 'System update available: Version 2.3'],
            ['message' => 'Performance review scheduled for next week'],
            ['message' => 'Reminder: Monthly report due in 3 days'],
            ['message' => 'New member registered: John Doe'],
            ['message' => 'Website traffic spike detected'],
            ['message' => 'New feature release: Dark mode now available'],
            ['message' => 'System maintenance scheduled for tomorrow'],
        ];

        return response()->json([
            'metrics' => [
                'totalRevenue'    => $totalRevenue,
                'totalExpenses'   => $totalExpenses,
                'totalEmailsSent' => $totalEmailsSent,
                'totalClients'    => $totalClients,
                'trafficReceived' => $trafficReceived,
            ],
            'notifications' => $notifications,
        ]);
    }
}
