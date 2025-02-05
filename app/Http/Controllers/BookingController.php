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
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BookingController extends Controller
{
    /* ------------------------------------------------------------------
     *  N. BOOKING (Table #6)
     * ------------------------------------------------------------------ */

    /**
     * Returns all Bookings in JSON form, including Branch info.
     * Supports staff branch-check and an optional server-side ?branch= filter.
     */
    public function indexBooking(Request $request)
    {
        $staff = auth('staff')->user();
        // Start a query that eager-loads facility->branch
        $query = Booking::with(['member', 'facility.branch']);

        // If a staff user is logged in, filter bookings by the staff’s branch(es)
        if ($staff) {
            // Get the branch IDs associated with the staff from the pivot table
            $branchIDs = $staff->branches->pluck('BranchID')->toArray();
            $query->whereHas('facility', function($q) use ($branchIDs) {
                $q->whereIn('BranchID', $branchIDs);
            });
        }

        // Optional server-side filter: e.g. GET /booking?branch=Branch2
        if ($request->filled('branch')) {
            $branchName = $request->get('branch');
            $query->whereHas('facility.branch', function($q) use ($branchName) {
                $q->where('BranchName', $branchName);
            });
        }

        $bookings = $query->orderBy('BookingDate', 'desc')->get();

        // Transform each booking into an array that includes Branch info
        $data = $bookings->map(function($b) {
            return [
                'BookingID'    => $b->BookingID,
                'MemberName'   => optional($b->member)->FullName ?? '',
                'FacilityID'   => optional($b->facility)->FacilityID ?? null,
                'FacilityName' => optional($b->facility)->Name ?? '',
                'BookingDate'  => $b->BookingDate,
                'BookingTime'  => $b->BookingTime,
                'Duration'     => $b->Duration,
                'Status'       => $b->Status ?? '',
                'Branch'       => optional(optional($b->facility)->branch)->BranchName ?? '',
                'BranchID'     => optional(optional($b->facility)->branch)->BranchID ?? null,
            ];
        });

        return response()->json(['bookings' => $data]);
    }

    /**
     * Store a new Booking.
     */
    public function storeBooking(Request $request)
    {
        $staff = auth('staff')->user();
        // Validate incoming data
        $data = $request->validate([
            'MemberID'    => 'required|exists:members,MemberID',
            'FacilityID'  => 'required|exists:facilities,FacilityID',
            'PaymentID'   => 'nullable|exists:payments,PaymentID',
            'BookingDate' => 'required|date',
            'BookingTime' => 'required|string|max:20',
            'Duration'    => 'nullable|integer|min:1',
            'Status'      => 'nullable|string|max:50'
        ]);

        // If a staff user is logged in, ensure that the facility belongs to one of their branches
        if ($staff) {
            $facility = Facility::findOrFail($data['FacilityID']);
            $branchIDs = $staff->branches->pluck('BranchID')->toArray();
            if (!in_array($facility->BranchID, $branchIDs)) {
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
            $branchIDs = $staff->branches->pluck('BranchID')->toArray();
            if (!in_array($facility->BranchID, $branchIDs)) {
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

        if ($staff) {
            $branchIDs = $staff->branches->pluck('BranchID')->toArray();
            if (!in_array(optional($booking->facility)->BranchID, $branchIDs)) {
                abort(403, 'You cannot cancel a booking from another branch.');
            }
        }

        if (empty($booking->Status) || $booking->Status !== 'Cancelled') {
            $booking->Status = 'Cancelled';
            $booking->save();
        }

        return response()->json(['message' => 'Booking cancelled.']);
    }

    /**
     * Returns a list of coaches.
     */
    public function index()
    {
        $coaches = Coach::orderBy('FullName')->get();
        return response()->json(['coaches' => $coaches]);
    }

    /**
     * Returns a list of facilities.
     */
    public function indexFacilities()
    {
        $facilities = Facility::orderBy('Name', 'asc')->get();
        return response()->json(['facilities' => $facilities]);
    }

    /* ------------------------------------------------------------------
     * O. COACHING SESSIONS (Table #15)
     * ------------------------------------------------------------------ */

    /**
     * Returns coaching sessions in JSON form, with branch filtering for staff.
     */
    public function indexSessions(Request $request)
    {
        $staff = auth('staff')->user();
        $query = CoachingSession::with(['coach', 'branch']);

        if ($staff) {
            $branchIDs = $staff->branches->pluck('BranchID');
            $query->whereHas('branch', function($q) use ($branchIDs) {
                $q->whereIn('BranchID', $branchIDs);
            });
        }

        if ($request->filled('branch')) {
            $branchParam = $request->get('branch');
            $query->whereHas('branch', function($q) use ($branchParam) {
                $q->where('BranchName', $branchParam);
            });
        }

        $sessions = $query->orderBy('StartTime', 'desc')->get();

        $data = $sessions->map(function($s) {
            return [
                'SessionID'    => $s->SessionID,
                'Branch'       => optional($s->branch)->BranchName ?? '',
                'SessionName'  => $s->SessionName,
                'CoachName'    => optional($s->coach)->FullName ?? '',
                'StartTime'    => $s->StartTime,
                'EndTime'      => $s->EndTime,
                'Capacity'     => $s->Capacity,
                'Participants' => $s->Participants ?? 0,
                'Status'       => $s->Status ?? '',
            ];
        });

        return response()->json(['sessions' => $data]);
    }

    /**
     * Store a new Coaching Session.
     */
    public function storeSession(Request $request)
    {
        $data = $request->validate([
            'BranchID'     => 'required|integer|exists:branches,BranchID',
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

    /**
     * Update an existing Coaching Session.
     */
    public function updateSession(Request $request, $id)
    {
        $data = $request->validate([
            'SessionName'  => 'required|string|max:255',
            'BranchID'     => 'required|integer|exists:branches,BranchID',
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

    /**
     * Cancel a Coaching Session.
     */
    public function cancelSession($id)
    {
        $session = CoachingSession::findOrFail($id);

        if (empty($session->Status) || $session->Status !== 'Cancelled') {
            $session->Status = 'Cancelled';
            $session->save();
        }

        return response()->json(['message' => 'Session cancelled.']);
    }

    /**
     * Store a Session Booking.
     */
    public function storeSessionBooking(Request $request)
    {
        $data = $request->validate([
            'SessionID'   => 'required|exists:coaching_sessions,SessionID',
            'MemberID'    => 'required|exists:members,MemberID',
            'BookingDate' => 'required|date',
            'PaymentID'   => 'nullable|exists:payments,PaymentID',
            'Status'      => 'nullable|string|max:50',
        ]);

        SessionBooking::create($data);

        return response()->json(['message' => 'Session booked successfully.']);
    }

    /**
     * Add a Member to the Session Waitlist.
     */
    public function addToWaitlist(Request $request)
    {
        $data = $request->validate([
            'SessionID'    => 'required|exists:coaching_sessions,SessionID',
            'MemberID'     => 'required|exists:members,MemberID',
            'WaitlistDate' => 'nullable|date',
            'Status'       => 'nullable|string|max:50',
        ]);

        SessionWaitlist::create($data);

        return response()->json(['message' => 'Added to waitlist.']);
    }

    /**
     * Mark Session Attendance.
     */
    public function markAttendance(Request $request)
    {
        $data = $request->validate([
            'SessionID'      => 'required|exists:coaching_sessions,SessionID',
            'MemberID'       => 'required|exists:members,MemberID',
            'AttendanceDate' => 'required|date',
        ]);

        SessionAttendance::create($data);

        return response()->json(['message' => 'Attendance marked successfully.']);
    }

    /**
     * Returns the most popular booking (facility) this month.
     */
    public function mostPopular()
    {
        $popularBooking = DB::table('bookings')
            ->select('FacilityID', DB::raw("COUNT(*) as count"))
            ->whereYear('BookingDate', date('Y'))
            ->whereMonth('BookingDate', date('m'))
            ->groupBy('FacilityID')
            ->orderByDesc('count')
            ->first();

        $mostPopular = 'N/A';
        if ($popularBooking) {
            $facility = DB::table('facilities')->where('FacilityID', $popularBooking->FacilityID)->first();
            if ($facility) {
                $mostPopular = $facility->Name;
            }
        }

        return response()->json([
            'most_popular_service' => $mostPopular,
            'booking_count'        => $popularBooking->count ?? 0,
        ], 200);
    }

    /**
     * Returns booking trends grouped by month.
     */
    public function bookingTrends()
    {
        $trends = DB::table('bookings')
            ->select(DB::raw("DATE_FORMAT(BookingDate, '%b %Y') as month"), DB::raw("COUNT(*) as totalBookings"))
            ->groupBy('month')
            ->orderByRaw("MIN(BookingDate)")
            ->get();

        return response()->json($trends, 200);
    }
}
