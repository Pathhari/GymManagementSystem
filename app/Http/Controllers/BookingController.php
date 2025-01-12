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
        // Identify current user, check role/branch
        $staff = auth('staff')->user(); // If staff is logged in
        $admin = auth('admin')->user(); // If admin is logged in
        $owner = auth('owner')->user(); // If owner is logged in
        
        // We won't filter members, because a member can come from any branch
        $members = Member::orderBy('FullName','asc')->get();
        
        // Filter facilities if staff is branch-limited
        if ($staff) {
            $facilities = Facility::where('BranchID', $staff->BranchID)
                                  ->orderBy('Name','asc')
                                  ->get();
        } else {
            // Admin or Owner sees all facilities
            $facilities = Facility::orderBy('Name','asc')->get();
        }

        return Inertia::render('Booking/Facility/Create', compact('members','facilities'));
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
        ]);

        // Check facility belongs to the staff’s branch if user is staff
        if ($staff) {
            $facility = Facility::findOrFail($data['FacilityID']);
            if ($facility->BranchID != $staff->BranchID) {
                abort(403, 'You cannot create a booking for a facility outside your branch.');
            }
        }
        
        Booking::create($data);

        return redirect()->route('booking.index')
            ->with('success','Booking created successfully.');
    }

    /**
     * 38. Read/Update => route:All
     * Show all Bookings.
     */
    public function indexBooking()
    {
        $staff = auth('staff')->user(); 
        $admin = auth('admin')->user(); 
        $owner = auth('owner')->user();

        // Filter if staff-based
        if ($staff) {
            // We’ll filter by facility->BranchID
            $bookings = Booking::with(['member','facility'])
                ->whereHas('facility', function($q) use ($staff) {
                    $q->where('BranchID', $staff->BranchID);
                })
                ->orderBy('BookingDate','desc')
                ->get();
        } else {
            // Admin/Owner => view all
            $bookings = Booking::with(['member','facility'])
                ->orderBy('BookingDate','desc')
                ->get();
        }

        return Inertia::render('Booking/Facility/Index', compact('bookings'));
    }

    /**
     * Show an edit form for a single booking.
     */
    public function editBooking($id)
    {
        $staff = auth('staff')->user(); 
        $admin = auth('admin')->user(); 
        $owner = auth('owner')->user();

        $booking = Booking::findOrFail($id);

        // Staff can't edit if booking's facility doesn't match their branch
        if ($staff && $booking->facility->BranchID != $staff->BranchID) {
            abort(403, 'You cannot edit a booking from another branch.');
        }

        $members = Member::orderBy('FullName','asc')->get();

        // If staff, filter facilities by staff->BranchID
        if ($staff) {
            $facilities = Facility::where('BranchID', $staff->BranchID)
                                  ->orderBy('Name','asc')
                                  ->get();
        } else {
            $facilities = Facility::orderBy('Name','asc')->get();
        }

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
        ]);

        // Staff must remain in their branch
        if ($staff) {
            $facility = Facility::findOrFail($data['FacilityID']);
            if ($facility->BranchID != $staff->BranchID) {
                abort(403, 'You cannot update a booking for a facility outside your branch.');
            }
        }

        $booking->update($data);

        return redirect()->route('booking.index')
            ->with('success','Booking updated successfully.');
    }

    /**
     * 39. Cancel => route:All
     */
    public function cancelBooking($id)
    {
        $staff = auth('staff')->user(); 

        $booking = Booking::with('facility')->findOrFail($id);

        // If staff, check branch
        if ($staff && $booking->facility->BranchID != $staff->BranchID) {
            abort(403, 'You cannot cancel a booking from another branch.');
        }

        // If you store a 'Status' field in the booking table:
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
        $staff = auth('staff')->user(); 
        $admin = auth('admin')->user(); 
        $owner = auth('owner')->user();

        if ($staff) {
            $facilities = Facility::where('BranchID', $staff->BranchID)
                                  ->orderBy('Name','asc')
                                  ->get();
        } else {
            $facilities = Facility::orderBy('Name','asc')->get();
        }

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
        // If each CoachingSessions row belongs to a single branch,
        // you’d filter by the user’s BranchID as well.
        // But if your design doesn't store BranchID in coaching_sessions,
        // and coaches can float, we won't filter them.
        // Add a branch check if needed.
        
        $sessions = CoachingSessions::with('coach')
            ->orderBy('StartTime','desc')
            ->get();

        return Inertia::render('Booking/Coaching/Index', compact('sessions'));
    }

    public function createSession()
    {
        // If coaches are also pinned to a branch, filter them. Otherwise, all coaches.
        $coaches = Coach::orderBy('FullName','asc')->get();
        return Inertia::render('Booking/Coaching/Create', compact('coaches'));
    }

    /**
     * Store a new Coaching Session.
     */
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

        // If each coaching session should reference a branch, you can:
        // 1. Add a BranchID in the coaching_sessions table
        // 2. Filter or auto-assign it based on staff user
        // We'll skip that for now.

        CoachingSessions::create($data);

        return redirect()->route('booking.sessions.index')
            ->with('success','Session created successfully.');
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
        $staff = auth('staff')->user();

        $data = $request->validate([
            'SessionID'    => 'required|exists:coaching_sessions,SessionID',
            'MemberID'     => 'required|exists:members,MemberID',
            'BookingDate'  => 'required|date',
            'PaymentID'    => 'nullable|exists:payments,PaymentID',
            'Status'       => 'nullable|string|max:50',
        ]);

        // Optionally, if staff is pinned to a branch, you could ensure the
        // session belongs to that branch (if CoachingSessions had BranchID).
        // We'll omit that logic here for brevity.

        SessionBooking::create($data);

        return redirect()->back()
            ->with('success','Session booked successfully.');
    }


    /* ------------------------------------------------------------------
     * 42. SessionWaitlist => route:All (Table #24)
     * ------------------------------------------------------------------ */

    public function addToWaitlist(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'SessionID'     => 'required|exists:coaching_sessions,SessionID',
            'MemberID'      => 'required|exists:members,MemberID',
            'WaitlistDate'  => 'nullable|date',
            'Status'        => 'nullable|string|max:50',
        ]);

        // Similar branch logic can be added if needed

        SessionWaitlist::create($data);

        return redirect()->back()
            ->with('success','Added to waitlist.');
    }


    /* ------------------------------------------------------------------
     * 43. SessionAttendance => route:All (Table #18)
     * ------------------------------------------------------------------ */

    /**
     * Mark attendance for a session
     */
    public function markAttendance(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'SessionID'       => 'required|exists:coaching_sessions,SessionID',
            'MemberID'        => 'required|exists:members,MemberID',
            'AttendanceDate'  => 'required|date',
        ]);

        // If sessions belong to a branch, check staff->branchID. 
        // We'll skip that for now.

        SessionAttendance::create($data);

        return redirect()->back()
            ->with('success','Attendance marked successfully.');
    }
}
