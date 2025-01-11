<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Welcome', [
            'title' => 'Dashboard Title',
            'info' => 'Some dynamic info from the server'
        ]);
    }
}
