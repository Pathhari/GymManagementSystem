<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StaffAuthController extends Controller
{
    public function showLoginForm()
    {
        return view('auth.staff-login'); 
        // Or Inertia::render('Staff/Auth/Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        // Attempt with 'staff' guard
        if (Auth::guard('staff')->attempt($credentials)) {
            return redirect()->route('staff.dashboard');
        }

        return back()->withErrors([
            'email' => 'Invalid Staff credentials',
        ]);
    }

    public function logout()
    {
        Auth::guard('staff')->logout();
        return redirect()->route('staff.login')->with('success','Staff logged out.');
    }
}
