<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;


class OwnerAuthController extends Controller
{
    /**
     * Show the Owner login form.
     */
    public function showLoginForm()
    {
        return Inertia::render('Auth/OwnerLogin');
    }

    /**
     * Handle the Owner login request.
     */
    public function login(Request $request)
    {
        // Validate the incoming request
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ], [
            'email.required' => 'Email is required.',
            'email.email'    => 'Please provide a valid email address.',
            'password.required' => 'Password is required.',
        ]);

        // Optional "remember me" checkbox
        // By default it's false if not present
        $remember = $request->boolean('remember', false);

        // Attempt login via the 'owner' guard
        if (Auth::guard('owner')->attempt($credentials, $remember)) {
            // Regenerate session to prevent fixation
            $request->session()->regenerate();

            // Redirect to the Owner dashboard
            return redirect()->route('owner.dashboard')
                             ->with('success', 'Welcome, Owner!');
        }

        // If login fails
        return back()->withErrors([
            'email' => 'Invalid Owner credentials.',
        ])->onlyInput('email');
    }

    /**
     * Log the Owner out of the application.
     */
    public function logout(Request $request)
    {
        Auth::guard('owner')->logout();

        // Invalidate and regenerate session tokens
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('owner.login')
                         ->with('success','Owner logged out successfully.');
    }
}
