<?php

// app/Http/Controllers/ProfileController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        if ($user = Auth::guard('owner')->user()) {
            return response()->json($user);
        }
        if ($user = Auth::guard('admin')->user()) {
            return response()->json($user);
        }
        if ($user = Auth::guard('staff')->user()) {
            return response()->json($user);
        }
        return response()->json(['error' => 'Not authenticated'], 401);
    }

    public function update(Request $request)
    {
        // Check which guard is logged in
        if ($user = Auth::guard('owner')->user()) {
            // Do owner validation & update
            return $this->updateOwner($request, $user);
        }
        if ($user = Auth::guard('admin')->user()) {
            // Do admin validation & update
            return $this->updateAdmin($request, $user);
        }
        if ($user = Auth::guard('staff')->user()) {
            // Do staff validation & update
            return $this->updateStaff($request, $user);
        }
        return response()->json(['error' => 'Not authenticated'], 401);
    }

    private function updateOwner(Request $request, $user)
    {
        $data = $request->validate([
            'email'                => 'required|email|unique:owners,email,' . $user->id,
            'password'             => 'nullable|min:8',
            'password_confirmation'=> 'nullable|same:password',
        ]);

        $user->email = $data['email'];
        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }
        $user->save();

        return response()->json(['message' => 'Owner profile updated successfully.'], 200);
    }

    private function updateAdmin(Request $request, $user)
    {
        $data = $request->validate([
            'email'                => 'required|email|unique:admins,email,' . $user->id,
            'password'             => 'nullable|min:8',
            'password_confirmation'=> 'nullable|same:password',
        ]);

        $user->email = $data['email'];
        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }
        $user->save();

        return response()->json(['message' => 'Admin profile updated successfully.'], 200);
    }

    private function updateStaff(Request $request, $user)
    {
        $data = $request->validate([
            'email'                => 'required|email|unique:staff,email,' . $user->id,
            'password'             => 'nullable|min:8',
            'password_confirmation'=> 'nullable|same:password',
        ]);

        $user->email = $data['email'];
        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }
        $user->save();

        return response()->json(['message' => 'Staff profile updated successfully.'], 200);
    }
}
