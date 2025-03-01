<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    /**
     * Store a newly created admin in the admins table.
     * POST /admin
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'FullName' => 'required|string|max:255',
            'Email'    => 'required|email|unique:admins,Email',
            'Phone'    => 'nullable|string|max:50',
            'Role'     => 'required|string|max:50', 
            // e.g. "Admin" or "Owner"
            
            'password' => 'nullable|min:8|confirmed',
            // "password_confirmation" must match the name if `confirmed`
            
            'Notes'    => 'nullable|string'
        ]);

        // If a password was provided => hash it; else omit
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        // Create the admin record in `admins` table
        $admin = Admin::create($data);

        return response()->json($admin, 201);
    }
}
