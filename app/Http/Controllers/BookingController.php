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

    public function createBooking()
    {
        $staff = auth('staff')->user(); 
        $admin = auth('admin')->user(); 
        $owner = auth('owner')->user();
        
        $members = Member::orderBy('FullName','asc')->get();
        
        if ($staff) {
            $facilities = Facility::where('BranchID', $staff->BranchID)
                                  ->orderBy('Name','asc')
                                  ->get();
        } else {
            $facilities = Facility::orderBy('Name','asc')->get();
        }

        return Inertia::render('Booking/Facility/Create', compact('members','facilities'));
    }

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

    public function indexBooking()
    {
        $staff = auth('staff')->user(); 
        $admin = auth('admin')->user(); 
        $owner = auth('owner')->user();

        if ($staff) {
            $bookings = Booking::with(['member','facility'])
                ->whereHas('facility', function($q) use ($staff) {
                    $q->where('BranchID', $staff->BranchID);
                })
                ->orderBy('BookingDate','desc')
                ->get();
        } else {
            $bookings = Booking::with(['member','facility'])
                ->orderBy('BookingDate','desc')
                ->get();
        }

        return Inertia::render('Booking/Facility/Index', compact('bookings'));
    }

    public function editBooking($id)
    {
        $staff = auth('staff')->user(); 
        $admin = auth('admin')->user(); 
        $owner = auth('owner')->user();

        $booking = Booking::findOrFail($id);

        if ($staff && $booking->facility->BranchID != $staff->BranchID) {
            abort(403, 'You cannot edit a booking from another branch.');
        }

        $members = Member::orderBy('FullName','asc')->get();

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

    public function cancelBooking($id)
    {
        $staff = auth('staff')->user();

        $booking = Booking::with('facility')->findOrFail($id);

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
     * O. COACHING SESSIONS (Table #15)
     * ------------------------------------------------------------------ */

    public function indexSessions()
    {
        // If needed, filter by staff->BranchID if sessions are branch-specific.
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

        CoachingSessions::create($data);

        return redirect()->route('booking.sessions.index')
            ->with('success','Session created successfully.');
    }

    /**
     * NEW: Update an existing session
     */
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
        ]);

        $session = CoachingSessions::findOrFail($id);
        $session->update($data);

        return redirect()->route('booking.sessions.index')
            ->with('success','Session updated successfully.');
    }

    /**
     * NEW: Cancel an existing session
     */
    public function cancelSession($id)
    {
        $session = CoachingSessions::findOrFail($id);
        // Suppose there's a "Status" column, you can mark it as "Cancelled"
        if (!isset($session->Status) || $session->Status !== 'Cancelled') {
            $session->Status = 'Cancelled';
            $session->save();
        }

        return redirect()->back()->with('success','Session cancelled.');
    }

    /* ------------------------------------------------------------------
     * 41. SessionBooking
     * ------------------------------------------------------------------ */

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

        SessionBooking::create($data);

        return redirect()->back()
            ->with('success','Session booked successfully.');
    }

    /* ------------------------------------------------------------------
     * 42. SessionWaitlist
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

        SessionWaitlist::create($data);

        return redirect()->back()
            ->with('success','Added to waitlist.');
    }

    /* ------------------------------------------------------------------
     * 43. SessionAttendance
     * ------------------------------------------------------------------ */

    public function markAttendance(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'SessionID'       => 'required|exists:coaching_sessions,SessionID',
            'MemberID'        => 'required|exists:members,MemberID',
            'AttendanceDate'  => 'required|date',
        ]);

        SessionAttendance::create($data);

        return redirect()->back()
            ->with('success','Attendance marked successfully.');
    }
}
