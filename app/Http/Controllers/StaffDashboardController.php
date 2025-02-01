<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class StaffDashboardController extends Controller
{
    public function index()
    {
        // Only accessible by guard:staff
        $dashboardData = [
            'title' => 'Staff Dashboard',
            'info'  => 'Any data relevant to the  Admin',
            // Add more data if needed, e.g., statistics, notifications, etc.
        ];
           // Render the Owner Dashboard view
           return Inertia::render('Staff/DashboardLayoutWrapper', $dashboardData);
        }
}
