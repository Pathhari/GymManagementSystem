<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Facility;
use App\Models\Member;
use App\Models\CoachingSession;
use App\Models\SessionBooking;
use App\Models\SessionWaitlist;
use App\Models\SessionAttendance;
use App\Models\Coach;
use Inertia\Inertia;

class BookingController extends Controller
{
    /* ------------------------------------------------------------------
     *  N. BOOKING (Table #6)
     * ------------------------------------------------------------------ */

    /**
     * Returns all Bookings in JSON form, including Branch info.
     * Also supports staff branch-check and optional server-side ?branch= filtering.
     */
    public function indexBooking(Request $request)
    {
        $staff = auth('staff')->user(); 
        $admin = auth('admin')->user(); 
        $owner = auth('owner')->user();

        // Start a query that eager-loads facility->branch
        $query = Booking::with(['member', 'facility.branch']);

        // If staff, limit to staff's branch only
        if ($staff) {
            $query->whereHas('facility', function($q) use ($staff) {
                $q->where('BranchID', $staff->BranchID);
            });
        }

        // (Optional) server-side filter: e.g. GET /booking?branch=Branch2
        if ($request->filled('branch')) {
            $branchName = $request->get('branch');
            $query->whereHas('facility.branch', function($q) use ($branchName) {
                $q->where('BranchName', $branchName);
            });
        }

        $bookings = $query->orderBy('BookingDate', 'desc')->get();

        // Transform each booking into an array that includes "Branch"
        $data = $bookings->map(function($b) {
            return [
                'BookingID'    => $b->BookingID,
                'MemberName'   => optional($b->member)->FullName ?? '',
                'FacilityName' => optional($b->facility)->Name ?? '',
                'BookingDate'  => $b->BookingDate,
                'BookingTime'  => $b->BookingTime,
                'Duration'     => $b->Duration,
                'Status'       => $b->Status ?? '',
                // Pull the branch name from $b->facility->branch->BranchName
                'Branch'       => optional(optional($b->facility)->branch)->BranchName ?? '',
            ];
        });

        // Return JSON for your React front end
        return response()->json(['bookings' => $data]);
    }

    /**
     * Store a new Booking.
     */
    public function storeBooking(Request $request)
    {
        $staff = auth('staff')->user(); 
        $admin = auth('admin')->user(); 
        $owner = auth('owner')->user();

        $data = $request->validate([
            'MemberID'    => 'required|exists:members,MemberID',
            'FacilityID'  => 'required|exists:facilities,FacilityID',
            'PaymentID'   => 'nullable|exists:payments,PaymentID',
            'BookingDate' => 'required|date',
            'BookingTime' => 'required|string|max:20', 
            'Duration'    => 'nullable|integer|min:1',
            'Status'      => 'nullable|string|max:50'
        ]);

        if ($staff) {
            $facility = Facility::findOrFail($data['FacilityID']);
            if ($facility->BranchID != $staff->BranchID) {
                abort(403, 'You cannot create a booking for a facility outside your branch.');
            }
        }

        Booking::create($data);

        return response()->json(['message' => 'Booking created successfully.'], 201);
    }

    /**
     * Update an existing Booking record.
     */
    public function updateBooking(Request $request, $id)
    {
        $staff = auth('staff')->user(); 
        $admin = auth('admin')->user(); 
        $owner = auth('owner')->user();

        $booking = Booking::findOrFail($id);

        $data = $request->validate([
            'MemberID'    => 'required|exists:members,MemberID',
            'FacilityID'  => 'required|exists:facilities,FacilityID',
            'PaymentID'   => 'nullable|exists:payments,PaymentID',
            'BookingDate' => 'required|date',
            'BookingTime' => 'required|string|max:20',
            'Duration'    => 'nullable|integer|min:1',
            'Status'      => 'nullable|string|max:50'
        ]);

        if ($staff) {
            $facility = Facility::findOrFail($data['FacilityID']);
            if ($facility->BranchID != $staff->BranchID) {
                abort(403, 'You cannot update a booking for a facility outside your branch.');
            }
        }

        $booking->update($data);

        return response()->json(['message' => 'Booking updated successfully.']);
    }

    /**
     * Cancel a booking.
     */
    public function cancelBooking($id)
    {
        $staff = auth('staff')->user();
        $booking = Booking::with('facility')->findOrFail($id);

        if ($staff && $booking->facility->BranchID != $staff->BranchID) {
            abort(403, 'You cannot cancel a booking from another branch.');
        }

        if (empty($booking->Status) || $booking->Status !== 'Cancelled') {
            $booking->Status = 'Cancelled';
            $booking->save();
        }

        return response()->json(['message' => 'Booking cancelled.']);
    }

    /* ------------------------------------------------------------------
     * O. COACHING SESSIONS (Table #15)
     * ------------------------------------------------------------------ */

    /**
     * Index Coaching Sessions in JSON form, with optional branch filtering if relevant.
     */
    public function indexSessions(Request $request)
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        // If your sessions have a direct branch reference, you can do with('branch') or something similar.
        // We'll just do with('coach') for now:
        $query = CoachingSession::with('coach');

        // If there's a branch param: ?branch=Branch2
        if ($request->filled('branch')) {
            $branchParam = $request->get('branch');
            // If your coaching_sessions table has a 'BranchName' or 'BranchID' column:
            // $query->where('BranchName', $branchParam);
        }

        $sessions = $query->orderBy('StartTime','desc')->get();

        // Transform for JSON
        $data = $sessions->map(function($s) {
            return [
                'SessionID'    => $s->SessionID,
                'SessionName'  => $s->SessionName,
                'CoachName'    => optional($s->coach)->FullName ?? '',
                'StartTime'    => $s->StartTime,
                'EndTime'      => $s->EndTime,
                'Capacity'     => $s->Capacity,
                'Participants' => $s->Participants ?? 0,
                'Status'       => $s->Status ?? '',
                // If you store BranchName or have a relationship, do:
                'Branch'       => $s->BranchName ?? '',
            ];
        });

        return response()->json(['sessions' => $data]);
    }

    public function storeSession(Request $request)
    {
        $data = $request->validate([
            'SessionName'  => 'required|string|max:255',
            'SessionType'  => 'required|string|max:50', 
            'CoachID'      => 'required|exists:coaches,CoachID',
            'StartTime'    => 'required|date_format:Y-m-d\TH:i',
            'EndTime'      => 'nullable|date_format:Y-m-d\TH:i|after:StartTime',
            'Capacity'     => 'nullable|integer|min:1',
            'Location'     => 'nullable|string|max:255',
            'Fee'          => 'nullable|numeric|min:0',
        ]);

        $session = CoachingSession::create($data);

        return response()->json([
            'message' => 'Session created successfully.',
            'session' => $session
        ], 201);
    }

    public function updateSession(Request $request, $id)
    {
        $data = $request->validate([
            'SessionName'  => 'required|string|max:255',
            'SessionType'  => 'required|string|max:50',
            'CoachID'      => 'required|exists:coaches,CoachID',
            'StartTime'    => 'required|date_format:Y-m-d\TH:i',
            'EndTime'      => 'nullable|date_format:Y-m-d\TH:i|after:StartTime',
            'Capacity'     => 'nullable|integer|min:1',
            'Location'     => 'nullable|string|max:255',
            'Fee'          => 'nullable|numeric|min:0',
            'Status'       => 'nullable|string|max:50',
        ]);

        $session = CoachingSession::findOrFail($id);
        $session->update($data);

        return response()->json(['message' => 'Session updated successfully.']);
    }

    public function cancelSession($id)
    {
        $session = CoachingSession::findOrFail($id);

        if (empty($session->Status) || $session->Status !== 'Cancelled') {
            $session->Status = 'Cancelled';
            $session->save();
        }

        return response()->json(['message' => 'Session cancelled.']);
    }

    /* ------------------------------------------------------------------
     * 41. SessionBooking
     * ------------------------------------------------------------------ */
    public function storeSessionBooking(Request $request)
    {
        $data = $request->validate([
            'SessionID'    => 'required|exists:coaching_sessions,SessionID',
            'MemberID'     => 'required|exists:members,MemberID',
            'BookingDate'  => 'required|date',
            'PaymentID'    => 'nullable|exists:payments,PaymentID',
            'Status'       => 'nullable|string|max:50',
        ]);

        SessionBooking::create($data);

        return response()->json(['message' => 'Session booked successfully.']);
    }

    /* ------------------------------------------------------------------
     * 42. SessionWaitlist
     * ------------------------------------------------------------------ */
    public function addToWaitlist(Request $request)
    {
        $data = $request->validate([
            'SessionID'     => 'required|exists:coaching_sessions,SessionID',
            'MemberID'      => 'required|exists:members,MemberID',
            'WaitlistDate'  => 'nullable|date',
            'Status'        => 'nullable|string|max:50',
        ]);

        SessionWaitlist::create($data);

        return response()->json(['message' => 'Added to waitlist.']);
    }

    /* ------------------------------------------------------------------
     * 43. SessionAttendance
     * ------------------------------------------------------------------ */
    public function markAttendance(Request $request)
    {
        $data = $request->validate([
            'SessionID'       => 'required|exists:coaching_sessions,SessionID',
            'MemberID'        => 'required|exists:members,MemberID',
            'AttendanceDate'  => 'required|date',
        ]);

        SessionAttendance::create($data);

        return response()->json(['message' => 'Attendance marked successfully.']);
    }
}
