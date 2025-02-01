<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // Fetch any relevant data for the dashboard here
        $dashboardData = [
            'title' => 'Admin Dashboard',
            'info'  => 'Any data relevant to the  Admin',
            // Add more data if needed, e.g., statistics, notifications, etc.
        ];

        // Render the Owner Dashboard view
        return Inertia::render('Admin/DashboardLayoutWrapper', $dashboardData);
    }
}