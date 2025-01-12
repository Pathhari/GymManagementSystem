<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class OwnerDashboardController extends Controller
{
    public function index()
    {
        // Only accessible by guard:owner (see route)
        return Inertia::render('Owner/Dashboard', [
            'title' => 'Owner (Super Admin) Dashboard',
            'info'  => 'Any data relevant to the Super Admin'
        ]);
    }
}
