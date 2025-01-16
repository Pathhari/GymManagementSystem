<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class OwnerDashboardController extends Controller
{
    /**
     * Display the Owner Dashboard.
     *
     * This method renders the Owner dashboard page using Inertia.
     * The route should be protected by the 'auth:owner' middleware.
     */
    public function index()
    {
        // Fetch any relevant data for the dashboard here
        $dashboardData = [
            'title' => 'Owner (Super Admin) Dashboard',
            'info'  => 'Any data relevant to the Super Admin',
            // Add more data if needed, e.g., statistics, notifications, etc.
        ];

        // Render the Owner Dashboard view
        return Inertia::render('Owner/DashboardLayoutWrapper', $dashboardData);
    }
}
