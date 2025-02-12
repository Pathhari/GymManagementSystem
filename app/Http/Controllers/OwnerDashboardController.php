<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\Member;
use App\Models\Expense; // Make sure you have this model

class OwnerDashboardController extends Controller
{
    /**
     * Render the dashboard layout.
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
     * Return key metrics and notifications for the dashboard.
     *
     * Query parameters:
     * - period (daily, weekly, monthly, yearly)
     * - dateFrom (YYYY-MM-DD)
     * - dateTo (YYYY-MM-DD)
     * - branch (branch ID or 'all')
     */
    public function metrics(Request $request)
    {
        $period   = $request->query('period', 'monthly');
        $dateFrom = $request->query('dateFrom');
        $dateTo   = $request->query('dateTo');
        $branch   = $request->query('branch', 'all');

        // Build query for completed payments to calculate total revenue
        $paymentsQuery = Payment::where('Status', 'Completed');
        if ($branch !== 'all') {
            $paymentsQuery->where('BranchID', $branch);
        }
        if ($dateFrom) {
            $paymentsQuery->whereDate('PaymentDate', '>=', $dateFrom);
        }
        if ($dateTo) {
            $paymentsQuery->whereDate('PaymentDate', '<=', $dateTo);
        }
        $totalRevenue = $paymentsQuery->sum('Amount');

        // Calculate total expenses based on Expense model
        $expensesQuery = Expense::query();
        if ($branch !== 'all') {
            $expensesQuery->where('BranchID', $branch);
        }
        if ($dateFrom) {
            $expensesQuery->whereDate('ExpenseDate', '>=', $dateFrom);
        }
        if ($dateTo) {
            $expensesQuery->whereDate('ExpenseDate', '<=', $dateTo);
        }
        $totalExpenses = $expensesQuery->sum('Amount');

        // For demonstration, use the Member count for totalEmailsSent and totalClients.
        $totalEmailsSent = Member::count();
        $totalClients    = Member::count();

        // Dummy traffic value – replace with real logic if needed.
        $trafficReceived = 1000;

        // Dummy notifications; replace with dynamic notifications if available.
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
