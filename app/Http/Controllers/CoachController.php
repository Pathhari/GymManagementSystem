<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use App\Models\CoachAvailability;
use Illuminate\Http\Request;

class CoachController extends Controller
{
    /**
     * List all Coaches.
     * (Optionally eager-load availabilities if you want them in the same JSON.)
     */
    public function index()
    {
        // If you want to return their availability in the same response:
        $coaches = Coach::with('availabilities')->orderBy('FullName')->get();
        return response()->json(['coaches' => $coaches]);
    }

    /**
     * Create a new Coach (basic fields only).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'FullName'     => 'required|string|max:255',
            'Specialty'    => 'nullable|string|max:255',
            'ContactInfo'  => 'nullable|string|max:255',
            // We no longer store availability ranges here
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
        // Optionally load availabilities here too
        $coach = Coach::with('availabilities')->findOrFail($id);
        return response()->json(['coach' => $coach]);
    }

    /**
     * Update an existing Coach (basic fields only).
     */
    public function update(Request $request, $id)
    {
        $coach = Coach::findOrFail($id);

        $data = $request->validate([
            'FullName'     => 'required|string|max:255',
            'Specialty'    => 'nullable|string|max:255',
            'ContactInfo'  => 'nullable|string|max:255',
            // No availability in main table
        ]);

        // Fix: Update the existing coach instead of creating a new one
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

    /* ===================================================================
     *   AVAILABILITY SLOTS CRUD  (CoachAvailability table)
     * =================================================================== */

    /**
     * Create a new availability timeslot for a specific coach.
     * POST /coaches/{coachId}/availabilities
     */
    public function storeAvailability(Request $request, $coachId)
    {
        $coach = Coach::findOrFail($coachId);

        $data = $request->validate([
            'Start' => 'required|date_format:Y-m-d H:i:s',
            'End'   => 'required|date_format:Y-m-d H:i:s|after:Start',
        ]);

        // Create the availability slot
        $availability = $coach->availabilities()->create($data);

        return response()->json([
            'message'       => 'Availability range created successfully.',
            'availability'  => $availability
        ], 201);
    }

    /**
     * Update an existing availability timeslot.
     * PUT /coaches/{coachId}/availabilities/{availabilityId}
     */
    public function updateAvailability(Request $request, $coachId, $availabilityId)
    {
        // First, make sure the coach exists (optional if you just want to find availability by ID)
        Coach::findOrFail($coachId);

        $availability = CoachAvailability::where('CoachID', $coachId)
            ->where('id', $availabilityId)
            ->firstOrFail();

        $data = $request->validate([
            'Start' => 'required|date_format:Y-m-d H:i:s',
            'End'   => 'required|date_format:Y-m-d H:i:s|after:Start',
        ]);

        $availability->update($data);

        return response()->json([
            'message'      => 'Availability updated successfully.',
            'availability' => $availability
        ]);
    }

    /**
     * Delete an availability timeslot.
     * DELETE /coaches/{coachId}/availabilities/{availabilityId}
     */
    public function destroyAvailability($coachId, $availabilityId)
    {
        // Ensure Coach exists
        Coach::findOrFail($coachId);

        // Ensure that this availability belongs to that Coach
        $availability = CoachAvailability::where('CoachID', $coachId)
            ->where('id', $availabilityId)
            ->firstOrFail();

        $availability->delete();

        return response()->json(['message' => 'Availability deleted successfully.']);
    }
}
