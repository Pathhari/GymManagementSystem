<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use Illuminate\Http\Request;

class CoachController extends Controller
{
    /**
     * List all Coaches.
     */
    public function index()
    {
        $coaches = Coach::orderBy('FullName')->get();
        return response()->json(['coaches' => $coaches]);
    }

    /**
     * Create a new Coach.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'FullName'      => 'required|string|max:255',
            'Specialty'     => 'nullable|string|max:255',
            'Availability'  => 'nullable|string|max:255',
            'ContactInfo'   => 'nullable|string|max:255',
        ]);

        $coach = Coach::create($data);
        return response()->json([
            'message' => 'Coach created successfully.',
            'coach'   => $coach
        ], 201);
    }

    /**
     * Retrieve a single Coach.
     */
    public function show($id)
    {
        $coach = Coach::findOrFail($id);
        return response()->json(['coach' => $coach]);
    }

    /**
     * Update an existing Coach.
     */
    public function update(Request $request, $id)
    {
        $coach = Coach::findOrFail($id);

        $data = $request->validate([
            'FullName'      => 'required|string|max:255',
            'Specialty'     => 'nullable|string|max:255',
            'Availability'  => 'nullable|string|max:255',
            'ContactInfo'   => 'nullable|string|max:255',
        ]);

        $coach->update($data);

        return response()->json([
            'message' => 'Coach updated successfully.',
            'coach'   => $coach
        ]);
    }

    /**
     * Delete a Coach.
     */
    public function destroy($id)
    {
        $coach = Coach::findOrFail($id);
        $coach->delete();

        return response()->json(['message' => 'Coach deleted successfully.']);
    }
}
