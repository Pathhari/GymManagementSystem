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
use Carbon\Carbon;

class BookingController extends Controller
{
    /* ------------------------------------------------------------------
     *  N. BOOKING (Table #6)
     * ------------------------------------------------------------------ */

    /**
     * Return Bookings in JSON, including branch info
     */
    public function indexBooking(Request $request)
    {
        $staff = auth('staff')->user();
        $query = Booking::with(['member', 'facility.branch']);

        if ($staff) {
            $branchIDs = $staff->branches->pluck('BranchID')->toArray();
            $query->whereHas('facility', function($q) use ($branchIDs) {
                $q->whereIn('BranchID', $branchIDs);
            });
        }

        if ($request->filled('branch')) {
            $branchName = $request->get('branch');
            $query->whereHas('facility.branch', function($q) use ($branchName) {
                $q->where('BranchName', $branchName);
            });
        }

        $bookings = $query->orderBy('BookingDate', 'desc')->get();

        $data = $bookings->map(function($b) {
            return [
                'BookingID'    => $b->BookingID,
                'MemberName'   => optional($b->member)->FullName ?? '',
                'FacilityID'   => optional($b->facility)->FacilityID ?? null,
                'FacilityName' => optional($b->facility)->FacilityName ?? '', 
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
     * Store a new Booking (Facility + Payment).
     */
    public function storeBooking(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'MemberID'      => 'required|exists:members,MemberID',
            'FacilityID'    => 'required|exists:facilities,FacilityID',
            'BookingDate'   => 'required|date',
            'BookingTime'   => 'required|string|max:20',
            'Duration'      => 'nullable|integer|min:1',
            'Status'        => 'nullable|string|max:50',

            'PaymentMethod' => 'required|string|max:50', 
            'Amount'        => 'required|numeric|min:0',
        ]);

        // Check facility belongs to staff's branch if staff is logged in
        if ($staff) {
            $facility = Facility::findOrFail($data['FacilityID']);
            $branchIDs = $staff->branches->pluck('BranchID')->toArray();
            if (!in_array($facility->BranchID, $branchIDs)) {
                abort(403, 'You cannot create a booking for a facility outside your branch.');
            }
        } else {
            // For non-staff, just load facility for branch ID
            $facility = Facility::findOrFail($data['FacilityID']);
        }

        return DB::transaction(function () use ($data, $facility) {

            // 1) Create Payment
            $payment = \App\Models\Payment::create([
                'BranchID'      => $facility->BranchID,
                'MemberID'      => $data['MemberID'],
                'PaymentMethod' => $data['PaymentMethod'],
                'Amount'        => $data['Amount'],
                'PaymentDate'   => now(),
                'Status'        => 'Paid',
                'PaymentFor'    => ['Booking'], 
            ]);

            // 2) Create Booking referencing Payment
            $booking = Booking::create([
                'MemberID'   => $data['MemberID'],
                'FacilityID' => $data['FacilityID'],
                'PaymentID'  => $payment->PaymentID,
                'BookingDate'=> $data['BookingDate'],
                'BookingTime'=> $data['BookingTime'],
                'Duration'   => $data['Duration'] ?? 1,
                'Status'     => $data['Status']   ?? 'Confirmed',
            ]);

            return response()->json([
                'message' => 'Booking & Payment created successfully.',
                'booking' => $booking,
                'payment' => $payment
            ], 201);
        });
    }

    /* --------------------------------------------------------------
     *  Coaches & Facilities Index
     * -------------------------------------------------------------- */
    public function index()
    {
        $coaches = Coach::orderBy('FullName')->get();
        return response()->json(['coaches' => $coaches]);
    }

    public function indexFacilities()
    {
        $facilities = Facility::orderBy('FacilityName', 'asc')->get();
        return response()->json(['facilities' => $facilities]);
    }

    /* ------------------------------------------------------------------
     * O. COACHING SESSIONS
     * ------------------------------------------------------------------ */

    /**
     * Return coaching sessions in JSON, with branch filtering
     */
    public function indexSessions(Request $request)
    {
        $staff = auth('staff')->user();
        $query = CoachingSession::with(['coach', 'branch'])
            ->select([
                'SessionID', 
                'BranchID', 
                'SessionName', 
                'SessionType', 
                'CoachID', 
                'StartTime', 
                'EndTime', 
                'Capacity', 
                'Location', 
                'Fee', 
                'Participants', 
                'Status'
            ]);
    
        // If staff is authenticated, filter sessions by assigned branches
        if ($staff) {
            $branchIDs = $staff->branches->pluck('BranchID');
            $query->whereIn('BranchID', $branchIDs);
        }
    
        // Filter by branch name if provided
        if ($request->filled('branch')) {
            $branchParam = $request->get('branch');
            $query->whereHas('branch', function ($q) use ($branchParam) {
                $q->where('BranchName', $branchParam);
            });
        }
    
        // Order sessions by latest start time
        $sessions = $query->orderBy('StartTime', 'desc')->get();
    
        // Format response data
        $data = $sessions->map(function ($s) {
            return [
                'SessionID'    => $s->SessionID,
                'Branch'       => optional($s->branch)->BranchName ?? '',
                'SessionName'  => $s->SessionName,
                'SessionType'  => $s->SessionType ?? '',
                'CoachName'    => optional($s->coach)->FullName ?? '',
                'StartTime'    => $s->StartTime ?? '',
                'EndTime'      => $s->EndTime ?? '',
                'Capacity'     => $s->Capacity,
                'Location'     => $s->Location ?? '',
                'Fee'          => $s->Fee ? number_format($s->Fee, 2) : '0.00', // Format fee as decimal
                'Participants' => $s->Participants ?? 0,
                'Status'       => $s->Status ?? '',
            ];
        });
    
        return response()->json(['sessions' => $data]);
    }
    
    /**
     * Create a Coaching Session (no Payment creation here).
     */
    public function storeSession(Request $request)
{
    // Adjust your validation to accept "YYYY-MM-DD HH:mm:ss"
    $data = $request->validate([
        'BranchID'    => 'required|integer|exists:branches,BranchID',
        'SessionName' => 'required|string|max:255',
        'SessionType' => 'required|string|max:50',
        'CoachID'     => 'required|exists:coaches,CoachID',
        
        // IMPORTANT: now using 'Y-m-d H:i:s'
        'StartTime'   => 'required|date_format:Y-m-d H:i:s',
        'EndTime'     => 'required|date_format:Y-m-d H:i:s|after:StartTime',

        'Capacity'    => 'nullable|integer|min:1',
        'Location'    => 'nullable|string|max:255',
        'Fee'         => 'nullable|numeric|min:0',
    ]);

    // Create the session
    $session = CoachingSession::create([
        'BranchID'    => $data['BranchID'],
        'SessionName' => $data['SessionName'],
        'SessionType' => $data['SessionType'],
        'CoachID'     => $data['CoachID'],
        'StartTime'   => $data['StartTime'],  // "2025-03-10 13:00:00"
        'EndTime'     => $data['EndTime'],    // "2025-03-10 14:00:00"
        'Capacity'    => $data['Capacity'] ?? 10,
        'Location'    => $data['Location'] ?? null,
        'Fee'         => $data['Fee'] ?? 0,
        'Participants'=> 0,
        'Status'      => 'Scheduled',
    ]);

    return response()->json([
        'message' => 'Session created successfully.',
        'session' => $session,
    ], 201);
}

    
    
    /**
     * Update an existing Coaching Session
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
     * Cancel a Coaching Session
     */
    public function cancelSession($id)
    {
        $session = CoachingSession::findOrFail($id);
        $session->delete();  
    
        return response()->json(['message' => 'Session successfully deleted (cancelled).']);
    }
    

    /**
     * Store a Session Booking, now with Payment creation here.
     */
    public function storeSessionBooking(Request $request)
    {
        $data = $request->validate([
            'SessionID'     => 'required|exists:coaching_sessions,SessionID',
            'MemberID'      => 'required|exists:members,MemberID',
            'BookingDate'   => 'required|date',
            'Status'        => 'nullable|string|max:50',

            // Payment fields
            'PaymentMethod' => 'required|string|max:50',
            'Amount'        => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($data) {
            // 1) We might want to increment Participants for the session
            $session = CoachingSession::find($data['SessionID']);
            if ($session) {
                $session->Participants = ($session->Participants ?? 0) + 1;
                $session->save();
            }

            // 2) Create Payment record (DailyCashFlow observer)
            $payment = \App\Models\Payment::create([
                'BranchID'      => $session ? $session->BranchID : null,
                'MemberID'      => $data['MemberID'],
                'PaymentMethod' => $data['PaymentMethod'],
                'Amount'        => $data['Amount'],
                'PaymentDate'   => now(),
                'Status'        => 'Paid',
                'PaymentFor'    => ['CoachingSessionBooking'],
            ]);

            // 3) Create SessionBooking referencing Payment (if you want PaymentID stored too)
            $sb = SessionBooking::create([
                'SessionID'   => $data['SessionID'],
                'MemberID'    => $data['MemberID'],
                'BookingDate' => $data['BookingDate'],
                'PaymentID'   => $payment->PaymentID, // store it if you have a PaymentID column
                'Status'      => $data['Status'] ?? 'Confirmed',
            ]);

            return response()->json([
                'message' => 'Session booked successfully, payment recorded.',
                'session_booking' => $sb,
                'payment' => $payment
            ]);
        });
    }
    
    /**
     * NEW: listSessionBookings
     */
    public function listSessionBookings()
    {
        $entries = SessionBooking::with(['session','member'])->get();

        $data = $entries->map(function($sb) {
            return [
                'SessionBookingID' => $sb->SessionBookingID,
                'SessionID'        => $sb->SessionID,
                'SessionName'      => optional($sb->session)->SessionName ?? '',
                'MemberID'         => $sb->MemberID,
                'MemberName'       => optional($sb->member)->FullName ?? '',
                'BookingDate'      => $sb->BookingDate,
                'Status'           => $sb->Status,
            ];
        });

        return response()->json(['session_bookings' => $data]);
    }

    /**
     * Waitlist
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
     * Attendance
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
     * Popular Booking
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
                $mostPopular = $facility->FacilityName ?? $facility->Name;
            }
        }

        return response()->json([
            'most_popular_service' => $mostPopular,
            'booking_count'        => $popularBooking->count ?? 0,
        ], 200);
    }

    /**
     * Booking Trends
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

    /**
     * Today Bookings
     */
    public function getTodayBookings()
    {
        $staff = auth('staff')->user();
        $today = Carbon::now()->format('Y-m-d');
    
        $query = Booking::with(['member','facility'])
            ->whereDate('BookingDate', $today)
            ->orderBy('BookingTime', 'asc');
    
        // Restrict to staff’s branches
        if ($staff) {
            $branchIDs = $staff->branches->pluck('BranchID')->toArray();
            $query->whereHas('facility', function($q) use ($branchIDs) {
                $q->whereIn('BranchID', $branchIDs);
            });
        }
    
        $bookings = $query->get();
    
        $results = $bookings->map(function($b) {
            return [
                'BookingID'   => $b->BookingID,
                'MemberName'  => optional($b->member)->FullName,
                'BookingDate' => $b->BookingDate,
                'BookingTime' => $b->BookingTime,
                'FacilityName'=> optional($b->facility)->FacilityName,
            ];
        });
    
        return response()->json($results, 200);
    }
    
}