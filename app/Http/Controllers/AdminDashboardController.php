<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // Only accessible by guard:admin
        return Inertia::render('Admin/Dashboard', [
            'title' => 'Admin (Manager) Dashboard',
            'info'  => 'Any manager-level data'
        ]);
    }
}
