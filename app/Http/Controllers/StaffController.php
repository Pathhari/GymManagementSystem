<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Staff;
use App\Models\StaffTask;
use App\Models\StaffSchedule;
use App\Models\Attendance;
use App\Models\Payroll;
use App\Models\Bonus;
use Illuminate\Support\Facades\DB;

class StaffController extends Controller
{
    /* ------------------------------------------------------------------
     * AA. STAFF MANAGEMENT (Staff Table)
     * ------------------------------------------------------------------ */

    /**
     * 67. Create Staff => route:Owner,Admin
     * Show form to create a new Staff record.
     */
    public function createStaff()
    {
        return Inertia::render('Staff/Management/Create');
    }

    /**
     * Store a newly created Staff in DB.
     */
    public function storeStaff(Request $request)
    {
        // The Staff table from the ERD has columns:
        // StaffID (PK), FullName, Role, Email, Phone, DailyRate, HourlyRate,
        // OvertimeRate, DateHired, Notes
        $data = $request->validate([
            'FullName'      => 'required|string|max:255',
            'Role'          => 'required|string|max:50',  // e.g. 'Trainer', 'Admin', etc.
            'Email'         => 'required|email|unique:staff,Email',
            'Phone'         => 'nullable|string|max:50',
            'DailyRate'     => 'nullable|numeric|min:0',
            'HourlyRate'    => 'nullable|numeric|min:0',
            'OvertimeRate'  => 'nullable|numeric|min:0',
            'DateHired'     => 'nullable|date',
            'Notes'         => 'nullable|string',
        ]);

        // Insert staff record
        Staff::create($data);

        return redirect()->route('staff.index')->with('success','Staff created successfully.');
    }

    /**
     * 70. View Staff => route:All but staff partial
     * Display a list of staff. Possibly partial data for staff role.
     */
    public function indexStaff()
    {
        // If staff is only allowed partial data, do a role check here:
        $user = auth()->user(); // if your "users" table references staff or you have role-based logic

        // For simplicity, load all data
        $staff = Staff::orderBy('StaffID','desc')->get();

        return Inertia::render('Staff/Management/Index', [
            'staff' => $staff
        ]);
    }

    /**
     * 68. Edit/Update => route:Owner,Admin
     * Show form to edit an existing Staff record.
     */
    public function editStaff($id)
    {
        $staff = Staff::findOrFail($id);

        return Inertia::render('Staff/Management/Edit', [
            'staff' => $staff
        ]);
    }

    /**
     * Update an existing Staff record.
     */
    public function updateStaff(Request $request, $id)
    {
        $staff = Staff::findOrFail($id);

        $data = $request->validate([
            'FullName'      => 'required|string|max:255',
            'Role'          => 'required|string|max:50',
            'Email'         => 'required|email|unique:staff,Email,'.$staff->StaffID.',StaffID',
            'Phone'         => 'nullable|string|max:50',
            'DailyRate'     => 'nullable|numeric|min:0',
            'HourlyRate'    => 'nullable|numeric|min:0',
            'OvertimeRate'  => 'nullable|numeric|min:0',
            'DateHired'     => 'nullable|date',
            'Notes'         => 'nullable|string',
        ]);

        $staff->update($data);

        return redirect()->route('staff.index')->with('success','Staff updated successfully.');
    }

    /**
     * 69. Deactivate Staff => route:Owner,Admin
     * Optionally just set a 'Status' column or something if you don't want to fully delete.
     */
    public function deactivateStaff($id)
    {
        $staff = Staff::findOrFail($id);

        // If you track a 'Status' or 'Active' boolean:
        // $staff->update(['Active' => false]);
        // or if you do partial business logic...
        // For demonstration, we’ll just set a 'Role' to 'Inactive' or so:
        $staff->update(['Role' => 'Inactive']);

        return redirect()->back()->with('success','Staff deactivated.');
    }

    /**
     * Delete a staff record entirely.
     */
    public function destroyStaff($id)
    {
        $staff = Staff::findOrFail($id);
        $staff->delete();

        return redirect()->back()->with('success','Staff record removed.');
    }


    /* ------------------------------------------------------------------
     * V. ATTENDANCE (Attendance Table)
     * ------------------------------------------------------------------ */

    /**
     * 56. Clock In/Out => route:Admin,Staff
     * Example: staff can clock themselves in/out. Admin might clock someone else.
     */
    public function clockInOut(Request $request)
    {
        // For a staff user, you might do:
        // $staffId = auth()->user()->StaffID ?? $request->StaffID
        // Or if an admin is clocking in for staff, your logic might differ

        $data = $request->validate([
            'StaffID'     => 'required|exists:staff,StaffID',
            'Date'        => 'required|date',
            'TimeIn'      => 'nullable|date_format:H:i',
            'TimeOut'     => 'nullable|date_format:H:i|after:TimeIn',
            // If you want to automatically compute HoursWorked, you do so in code
        ]);

        // Check if an Attendance record exists for this staff + date
        $attendance = Attendance::firstOrNew([
            'StaffID' => $data['StaffID'],
            'Date'    => $data['Date']
        ]);

        // If TimeIn or TimeOut is provided, set them
        if (!empty($data['TimeIn']))  $attendance->TimeIn  = $data['TimeIn'];
        if (!empty($data['TimeOut'])) $attendance->TimeOut = $data['TimeOut'];

        // Possibly calculate HoursWorked
        if ($attendance->TimeIn && $attendance->TimeOut) {
            // Example logic: difference in hours
            $in  = strtotime($attendance->Date . ' ' . $attendance->TimeIn);
            $out = strtotime($attendance->Date . ' ' . $attendance->TimeOut);
            $diffInSeconds = $out - $in;
            $hours = $diffInSeconds / 3600.0;
            $attendance->HoursWorked = max($hours, 0);
        }

        $attendance->save();

        return redirect()->back()->with('success','Attendance updated.');
    }

    /**
     * 57. View/Edit Staff Attendance => route:Owner,Admin
     */
    public function indexAttendance()
    {
        // Eager-load staff
        $attendance = Attendance::with('staff')->orderBy('Date','desc')->get();

        return Inertia::render('Staff/Attendance/Index', compact('attendance'));
    }

    public function updateAttendance(Request $request, $id)
    {
        $attendance = Attendance::findOrFail($id);

        $data = $request->validate([
            'Date'         => 'required|date',
            'TimeIn'       => 'nullable|date_format:H:i',
            'TimeOut'      => 'nullable|date_format:H:i|after:TimeIn',
            'HoursWorked'  => 'nullable|numeric|min:0',
            'OvertimeHours'=> 'nullable|numeric|min:0',
        ]);

        $attendance->update($data);

        return redirect()->back()->with('success','Attendance updated.');
    }


    /* ------------------------------------------------------------------
     * R. STAFF TASKS (StaffTask Table)
     * ------------------------------------------------------------------ */

    /**
     * 48. Create/Update => route:Owner,Admin
     * Lists tasks, or can show a form for adding tasks.
     */
    public function indexTasks()
    {
        // e.g. list all tasks, or just incomplete
        $tasks = StaffTask::with('staff')->orderBy('TaskDate','desc')->get();

        return Inertia::render('Staff/Tasks/Index', [
            'tasks' => $tasks
        ]);
    }

    /**
     * Store a new StaffTask
     */
    public function storeTask(Request $request)
    {
        $data = $request->validate([
            'StaffID'         => 'required|exists:staff,StaffID',
            'TaskDescription' => 'required|string|max:255',
            'TaskDate'        => 'nullable|date',
            'Status'          => 'nullable|string|max:50', // e.g. 'Pending','Completed'
        ]);

        StaffTask::create($data);

        return redirect()->back()->with('success','Staff task created.');
    }

    /**
     * Update an existing StaffTask
     */
    public function updateTask(Request $request, $id)
    {
        $task = StaffTask::findOrFail($id);

        $data = $request->validate([
            'StaffID'         => 'required|exists:staff,StaffID',
            'TaskDescription' => 'required|string|max:255',
            'TaskDate'        => 'nullable|date',
            'Status'          => 'nullable|string|max:50',
        ]);

        $task->update($data);

        return redirect()->back()->with('success','Staff task updated.');
    }

    /**
     * 49. Mark Completed => route:All
     * Possibly staff can only mark their own tasks completed.
     */
    public function markTaskCompleted($id)
    {
        $task = StaffTask::findOrFail($id);

        // If staff can only mark own tasks, do a check:
        // if (auth()->user()->StaffID != $task->StaffID) { abort(403); }

        $task->update(['Status' => 'Completed']);

        return redirect()->back()->with('success','Task completed.');
    }


    /* ------------------------------------------------------------------
     * AB. STAFF SCHEDULE (StaffSchedule Table)
     * ------------------------------------------------------------------ */

    /**
     * 71. Create/Edit => route:Owner,Admin
     * Show a list of schedules or create form.
     */
    public function indexSchedules()
    {
        $schedules = StaffSchedule::with('staff')->orderBy('ShiftDate','desc')->get();

        return Inertia::render('Staff/Schedule/Index', [
            'schedules' => $schedules
        ]);
    }

    public function createSchedule()
    {
        $staff = Staff::orderBy('FullName','asc')->get();
        return Inertia::render('Staff/Schedule/Create', compact('staff'));
    }

    public function storeSchedule(Request $request)
    {
        $data = $request->validate([
            'StaffID'     => 'required|exists:staff,StaffID',
            'ShiftDate'   => 'required|date',
            'ShiftStart'  => 'required|date_format:H:i',
            'ShiftEnd'    => 'nullable|date_format:H:i|after:ShiftStart',
            'RoleOverride'=> 'nullable|string|max:50',
        ]);

        StaffSchedule::create($data);

        return redirect()->route('staff.schedules.index')->with('success','Schedule created.');
    }

    public function destroySchedule($id)
    {
        $schedule = StaffSchedule::findOrFail($id);
        $schedule->delete();

        return redirect()->route('staff.schedules.index')->with('success','Schedule deleted.');
    }


    /* ------------------------------------------------------------------
     * W. PAYROLL & BONUS
     * ------------------------------------------------------------------ */

    /**
     * 58. Create payroll => route:Owner,Admin
     */
    public function createPayroll()
    {
        $staff = Staff::orderBy('FullName','asc')->get();
        return Inertia::render('Staff/Payroll/Create', compact('staff'));
    }

    public function storePayroll(Request $request)
    {
        // The Payroll table:
        // PayrollID (PK), StaffID (FK), StartDate, EndDate, GrossPay, Deductions, NetPay, GeneratedDate, Status
        $data = $request->validate([
            'StaffID'       => 'required|exists:staff,StaffID',
            'StartDate'     => 'required|date',
            'EndDate'       => 'required|date|after_or_equal:StartDate',
            'GrossPay'      => 'required|numeric|min:0',
            'Deductions'    => 'nullable|numeric|min:0',
            'NetPay'        => 'required|numeric|min:0',
            'GeneratedDate' => 'nullable|date',
            'Status'        => 'nullable|string|max:50', // e.g. 'Pending', 'Paid'
        ]);

        Payroll::create($data);

        return redirect()
            ->route('staff.payroll.index')
            ->with('success','Payroll created successfully.');
    }

    /**
     * 59. View/Update => route:Owner,Admin
     */
    public function indexPayroll()
    {
        // Eager-load staff
        $payrolls = Payroll::with('staff')
                    ->orderBy('StartDate','desc')
                    ->get();

        return Inertia::render('Staff/Payroll/Index', compact('payrolls'));
    }

    public function updatePayroll(Request $request, $id)
    {
        $payroll = Payroll::findOrFail($id);

        $data = $request->validate([
            'StartDate'     => 'required|date',
            'EndDate'       => 'required|date|after_or_equal:StartDate',
            'GrossPay'      => 'required|numeric|min:0',
            'Deductions'    => 'nullable|numeric|min:0',
            'NetPay'        => 'required|numeric|min:0',
            'GeneratedDate' => 'nullable|date',
            'Status'        => 'nullable|string|max:50',
        ]);

        $payroll->update($data);

        return redirect()->route('staff.payroll.index')->with('success','Payroll updated.');
    }

    /**
     * 60. Bonus => route:Owner,Admin
     */
    public function createBonus()
    {
        $staff = Staff::orderBy('FullName','asc')->get();
        return Inertia::render('Staff/Bonus/Create', compact('staff'));
    }

    public function storeBonus(Request $request)
    {
        // Bonus table:
        // BonusID, StaffID, BonusAmount, BonusDate, Reason
        $data = $request->validate([
            'StaffID'     => 'required|exists:staff,StaffID',
            'BonusAmount' => 'required|numeric|min:0',
            'BonusDate'   => 'required|date',
            'Reason'      => 'nullable|string|max:255',
        ]);

        Bonus::create($data);

        return redirect()->route('staff.index')->with('success','Bonus awarded.');
    }
}
