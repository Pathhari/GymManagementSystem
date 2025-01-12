<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OwnerAuthController extends Controller
{
    public function showLoginForm()
    {
        // Return a view or Inertia page for Owner login
        return view('auth.owner-login'); 
        // Or Inertia::render('Owner/Auth/Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        // Attempt login with the 'owner' guard
        if (Auth::guard('owner')->attempt($credentials)) {
            // success
            return redirect()->route('owner.dashboard');
        }

        // fail
        return back()->withErrors([
            'email' => 'Invalid Owner credentials',
        ]);
    }

    public function logout()
    {
        Auth::guard('owner')->logout();
        // Optionally session()->invalidate(), session()->regenerateToken(), etc.

        return redirect()->route('owner.login')->with('success','Owner logged out.');
    }
}
