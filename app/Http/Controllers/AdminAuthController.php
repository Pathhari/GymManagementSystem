<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminAuthController extends Controller
{
    public function showLoginForm()
    {
        return Inertia::render('Auth/AdminLogin');
    }

    public function login(Request $request)
    {
        // Validate incoming request
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Attempt to log in with 'admin' guard
        if (!Auth::guard('admin')->attempt($credentials)) {
            return response()->json([
                'errors' => ['general' => 'Invalid login credentials.'],
            ], 422);
        }

        // Regenerate session and redirect to the admin dashboard
        $request->session()->regenerate();
        return response()->json(['success' => true, 'redirect' => route('admin.dashboard')], 200);
    }

    public function logout()
    {
        Auth::guard('admin')->logout();
        return redirect()->route('admin.login')->with('success', 'Admin logged out.');
    }
}
