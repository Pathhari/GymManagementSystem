<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
}
