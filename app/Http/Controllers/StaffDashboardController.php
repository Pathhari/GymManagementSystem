<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class StaffDashboardController extends Controller
{
    public function index()
    {
        // Only accessible by guard:staff
        return Inertia::render('Staff/Dashboard', [
            'title' => 'Staff Dashboard',
            'info'  => 'Staff-friendly overview or partial data'
        ]);
    }
}
