<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Booking;
use App\Models\Facility;
use App\Models\Member;
use App\Models\CoachingSessions;
use App\Models\SessionBooking;
use App\Models\SessionWaitlist;
use App\Models\SessionAttendance;
use App\Models\Coach;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    /* ------------------------------------------------------------------
     * N. BOOKING (Table #6 in your ERD)
     * ------------------------------------------------------------------ */

    /**
     * 37. Create => route:All
     * Show a form to create a new booking record.
     */
    public function createBooking()
    {
        // Load members and facilities for dropdowns
        $members    = Member::orderBy('FullName','asc')->get();
        $facilities = Facility::orderBy('Name','asc')->get();

        return Inertia::render('Booking/Facility/Create', compact('members','facilities'));
    }

    /**
     * Store a new Booking.
     */
    public function storeBooking(Request $request)
    {
        // From ERD:
        // Booking table => (BookingID, MemberID, FacilityID, PaymentID?, BookingDate, BookingTime, Duration)
        $data = $request->validate([
            'MemberID'    => 'required|exists:members,MemberID',
            'FacilityID'  => 'required|exists:facilities,FacilityID',
            'PaymentID'   => 'nullable|exists:payments,PaymentID',
            'BookingDate' => 'required|date',
            'BookingTime' => 'required|string|max:20',  // e.g. "14:00", or "2 PM", etc.
            'Duration'    => 'nullable|integer|min:1',  // in minutes or hours, up to you
        ]);

        Booking::create($data);

        return redirect()->route('booking.index')->with('success','Booking created successfully.');
    }

    /**
     * 38. Read/Update => route:All
     * Show all Bookings.
     */
    public function indexBooking()
    {
        // Eager-load Member and Facility
        $bookings = Booking::with(['member','facility'])
            ->orderBy('BookingDate','desc')
            ->get();

        return Inertia::render('Booking/Facility/Index', compact('bookings'));
    }

    /**
     * Show an edit form for a single booking.
     */
    public function editBooking($id)
    {
        $booking    = Booking::findOrFail($id);
        $members    = Member::orderBy('FullName','asc')->get();
        $facilities = Facility::orderBy('Name','asc')->get();

        return Inertia::render('Booking/Facility/Edit', [
            'booking'    => $booking,
            'members'    => $members,
            'facilities' => $facilities
        ]);
    }

    /**
     * Update an existing Booking record.
     */
    public function updateBooking(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);

        $data = $request->validate([
            'MemberID'    => 'required|exists:members,MemberID',
            'FacilityID'  => 'required|exists:facilities,FacilityID',
            'PaymentID'   => 'nullable|exists:payments,PaymentID',
            'BookingDate' => 'required|date',
            'BookingTime' => 'required|string|max:20',
            'Duration'    => 'nullable|integer|min:1',
        ]);

        $booking->update($data);

        return redirect()->route('booking.index')->with('success','Booking updated successfully.');
    }

    /**
     * 39. Cancel => route:All
     */
    public function cancelBooking($id)
    {
        $booking = Booking::findOrFail($id);

        // If you store a 'Status' field in the booking table, e.g.:
        // $booking->update(['Status' => 'Cancelled']);
        // Or you want to just delete:
        // $booking->delete();
        // We'll do a simple 'Status' example:

        if (!isset($booking->Status) || $booking->Status !== 'Cancelled') {
            $booking->Status = 'Cancelled';
            $booking->save();
        }

        return redirect()->back()->with('success','Booking cancelled.');
    }

    /**
     * Display all Facilities.
     */
    public function indexFacilities()
    {
        $facilities = Facility::orderBy('Name','asc')->get();

        return Inertia::render('Booking/Facility/All', compact('facilities'));
    }


    /* ------------------------------------------------------------------
     * O. COACHING SESSIONS (Table #15 in your ERD)
     * ------------------------------------------------------------------ */

    /**
     * 40. Create/Edit => route:All
     * Show all coaching sessions.
     */
    public function indexSessions()
    {
        // Eager-load the coach
        $sessions = CoachingSessions::with('coach')
            ->orderBy('StartTime','desc')
            ->get();

        return Inertia::render('Booking/Coaching/Index', compact('sessions'));
    }

    public function createSession()
    {
        $coaches = Coach::orderBy('FullName','asc')->get();
        return Inertia::render('Booking/Coaching/Create', compact('coaches'));
    }

    /**
     * Store a new Coaching Session.
     */
    public function storeSession(Request $request)
    {
        // Table fields from ERD #15: SessionName, SessionType, CoachID,
        // StartTime, EndTime, Capacity, Location, Fee
        $data = $request->validate([
            'SessionName'  => 'required|string|max:255',
            'SessionType'  => 'required|string|max:50',  // e.g. "group", "personal"
            'CoachID'      => 'required|exists:coaches,CoachID',
            'StartTime'    => 'required|date_format:Y-m-d\TH:i',  // or adapt format
            'EndTime'      => 'nullable|date_format:Y-m-d\TH:i|after:StartTime',
            'Capacity'     => 'nullable|integer|min:1',
            'Location'     => 'nullable|string|max:255',
            'Fee'          => 'nullable|numeric|min:0',
        ]);

        CoachingSessions::create($data);

        return redirect()->route('booking.sessions.index')->with('success','Session created successfully.');
    }


    /* ------------------------------------------------------------------
     * 41. SessionBooking => route:All
     * Table #16 in your ERD
     * ------------------------------------------------------------------ */

    /**
     * Create a new session booking record for a member.
     */
    public function storeSessionBooking(Request $request)
    {
        // SessionBooking => (BookingID PK, SessionID, MemberID, BookingDate, PaymentID optional, Status)
        $data = $request->validate([
            'SessionID'    => 'required|exists:coaching_sessions,SessionID',
            'MemberID'     => 'required|exists:members,MemberID',
            'BookingDate'  => 'required|date',
            'PaymentID'    => 'nullable|exists:payments,PaymentID',
            'Status'       => 'nullable|string|max:50', // e.g. "Confirmed","Cancelled"
        ]);

        SessionBooking::create($data);

        return redirect()->back()->with('success','Session booked successfully.');
    }


    /* ------------------------------------------------------------------
     * 42. SessionWaitlist => route:All (Table #24)
     * ------------------------------------------------------------------ */

    public function addToWaitlist(Request $request)
    {
        // Waitlist => (WaitlistID, SessionID, MemberID, WaitlistDate, Status)
        $data = $request->validate([
            'SessionID'     => 'required|exists:coaching_sessions,SessionID',
            'MemberID'      => 'required|exists:members,MemberID',
            'WaitlistDate'  => 'nullable|date',
            'Status'        => 'nullable|string|max:50', // e.g. "Waiting","Confirmed","Cancelled"
        ]);

        SessionWaitlist::create($data);

        return redirect()->back()->with('success','Added to waitlist.');
    }


    /* ------------------------------------------------------------------
     * 43. SessionAttendance => route:All (Table #18)
     * ------------------------------------------------------------------ */

    /**
     * Mark attendance for a session
     */
    public function markAttendance(Request $request)
    {
        // SessionAttendance => (AttendanceID PK, SessionID FK, MemberID FK, AttendanceDate)
        $data = $request->validate([
            'SessionID'       => 'required|exists:coaching_sessions,SessionID',
            'MemberID'        => 'required|exists:members,MemberID',
            'AttendanceDate'  => 'required|date',
        ]);

        // We create a new attendance log:
        SessionAttendance::create($data);

        return redirect()->back()->with('success','Attendance marked successfully.');
    }
}
