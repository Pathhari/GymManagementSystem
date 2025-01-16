<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\Staff;
use App\Models\StaffTask;
use App\Models\StaffSchedule;
use App\Models\Attendance;
use App\Models\Payroll;
use App\Models\Bonus;
use App\Models\Branch;

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
        // Load all branches so user can pick the staff's branch
        $branches = Branch::orderBy('BranchName','asc')->get();

        return Inertia::render('Staff/Management/Create', [
            'branches' => $branches
        ]);
    }

    /**
     * Store a newly created Staff in DB.
     */
    public function storeStaff(Request $request)
    {
        // The Staff table has columns:
        // StaffID, FullName, Role, Email, Phone, DailyRate, HourlyRate,
        // OvertimeRate, DateHired, Notes, BranchID, password, etc.
        $data = $request->validate([
            'BranchID'     => 'required|exists:branches,BranchID',
            'FullName'     => 'required|string|max:255',
            'Role'         => 'required|string|max:50',  // e.g. 'Trainer', 'Admin', etc.
            'Email'        => 'required|email|unique:staff,Email',
            'Phone'        => 'nullable|string|max:50',
            'DailyRate'    => 'nullable|numeric|min:0',
            'HourlyRate'   => 'nullable|numeric|min:0',
            'OvertimeRate' => 'nullable|numeric|min:0',
            'DateHired'    => 'nullable|date',
            'Notes'        => 'nullable|string',
            // If you want staff to have a login password:
             'password' => 'sometimes|required|min:8|confirmed',
        ]);

        // Insert staff record
        Staff::create($data);

        return redirect()
            ->route('staff.index')
            ->with('success','Staff created successfully.');
    }

    /**
     * 70. View Staff => route:All (but staff partial)
     * Display a list of staff. Possibly partial data for staff role.
     */
    public function indexStaff()
    {
        // If staff sees partial data, do a role check here:
        $user = auth()->user(); 
        // For demonstration, we load all data:
        $staff = Staff::with('branch')
            ->orderBy('StaffID','desc')
            ->get();

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
        $staff    = Staff::findOrFail($id);
        $branches = Branch::orderBy('BranchName','asc')->get();

        return Inertia::render('Staff/Management/Edit', [
            'staff'    => $staff,
            'branches' => $branches
        ]);
    }

    /**
     * Update an existing Staff record.
     */
    public function updateStaff(Request $request, $id)
    {
        $staff = Staff::findOrFail($id);

        $data = $request->validate([
            'BranchID'     => 'required|exists:branches,BranchID',
            'FullName'     => 'required|string|max:255',
            'Role'         => 'required|string|max:50',
            'Email'        => 'required|email|unique:staff,Email,'.$staff->StaffID.',StaffID',
            'Phone'        => 'nullable|string|max:50',
            'DailyRate'    => 'nullable|numeric|min:0',
            'HourlyRate'   => 'nullable|numeric|min:0',
            'OvertimeRate' => 'nullable|numeric|min:0',
            'DateHired'    => 'nullable|date',
            'Notes'        => 'nullable|string',

            // If staff can have a password changed here, you'd add it:
            // 'password' => 'sometimes|nullable|min:8|confirmed',
        ]);

        $staff->update($data);

        return redirect()
            ->route('staff.index')
            ->with('success','Staff updated successfully.');
    }

    /**
     * 69. Deactivate Staff => route:Owner,Admin
     * Optionally just set a 'Status' column or something if you don't want to fully delete.
     */
    public function deactivateStaff($id)
    {
        $staff = Staff::findOrFail($id);

        // Example: set a 'Role' to 'Inactive' or set an 'Active' boolean = false:
        $staff->update(['Role' => 'Inactive']);

        return redirect()
            ->back()
            ->with('success','Staff deactivated.');
    }

    /**
     * Delete a staff record entirely.
     */
    public function destroyStaff($id)
    {
        $staff = Staff::findOrFail($id);
        $staff->delete();

        return redirect()
            ->back()
            ->with('success','Staff record removed.');
    }


    /* ------------------------------------------------------------------
     * V. ATTENDANCE (Attendance Table)
     * ------------------------------------------------------------------ */

    /**
     * 56. Clock In/Out => route:Admin,Staff
     */
    public function clockInOut(Request $request)
    {
        // e.g. staff ID from request or from auth
        $data = $request->validate([
            'StaffID' => 'required|exists:staff,StaffID',
            'Date'    => 'required|date',
            'TimeIn'  => 'nullable|date_format:H:i',
            'TimeOut' => 'nullable|date_format:H:i|after:TimeIn',
        ]);

        // Find existing or create new
        $attendance = Attendance::firstOrNew([
            'StaffID' => $data['StaffID'],
            'Date'    => $data['Date']
        ]);

        if (!empty($data['TimeIn'])) {
            $attendance->TimeIn = $data['TimeIn'];
        }
        if (!empty($data['TimeOut'])) {
            $attendance->TimeOut = $data['TimeOut'];
        }

        // Compute HoursWorked if both TimeIn & TimeOut are present
        if ($attendance->TimeIn && $attendance->TimeOut) {
            $in  = strtotime($attendance->Date . ' ' . $attendance->TimeIn);
            $out = strtotime($attendance->Date . ' ' . $attendance->TimeOut);

            $diffSeconds = $out - $in;
            $hours = max($diffSeconds / 3600.0, 0);
            $attendance->HoursWorked = $hours;
        }

        $attendance->save();

        return redirect()
            ->back()
            ->with('success','Attendance updated.');
    }

    /**
     * 57. View/Edit Staff Attendance => route:Owner,Admin
     */
    public function indexAttendance()
    {
        $attendance = Attendance::with('staff')
            ->orderBy('Date','desc')
            ->get();

        return Inertia::render('Staff/Attendance/Index', [
            'attendance' => $attendance
        ]);
    }

    public function updateAttendance(Request $request, $id)
    {
        $attendance = Attendance::findOrFail($id);

        $data = $request->validate([
            'Date'          => 'required|date',
            'TimeIn'        => 'nullable|date_format:H:i',
            'TimeOut'       => 'nullable|date_format:H:i|after:TimeIn',
            'HoursWorked'   => 'nullable|numeric|min:0',
            'OvertimeHours' => 'nullable|numeric|min:0',
        ]);

        $attendance->update($data);

        return redirect()
            ->back()
            ->with('success','Attendance updated.');
    }


    /* ------------------------------------------------------------------
     * R. STAFF TASKS (StaffTask Table)
     * ------------------------------------------------------------------ */

    /**
     * 48. Create/Update => route:Owner,Admin
     * Also listing tasks. Staff see tasks via separate logic or same method.
     */
    public function indexTasks()
    {
        $tasks = StaffTask::with('staff')
            ->orderBy('TaskDate','desc')
            ->get();

        return Inertia::render('Staff/Tasks/Index', [
            'tasks' => $tasks
        ]);
    }

    public function storeTask(Request $request)
    {
        $data = $request->validate([
            'StaffID'         => 'required|exists:staff,StaffID',
            'TaskDescription' => 'required|string|max:255',
            'TaskDate'        => 'nullable|date',
            'Status'          => 'nullable|string|max:50',
        ]);

        StaffTask::create($data);

        return redirect()
            ->back()
            ->with('success','Staff task created.');
    }

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

        return redirect()
            ->back()
            ->with('success','Staff task updated.');
    }

    /**
     * 49. Mark Completed => route:All
     */
    public function markTaskCompleted($id)
    {
        $task = StaffTask::findOrFail($id);

        // If staff can only mark their own tasks, do a check here
        // e.g. if (auth()->user()->StaffID != $task->StaffID) { abort(403); }

        $task->update(['Status' => 'Completed']);

        return redirect()
            ->back()
            ->with('success','Task completed.');
    }


    /* ------------------------------------------------------------------
     * AB. STAFF SCHEDULE (StaffSchedule Table)
     * ------------------------------------------------------------------ */

    /**
     * 71. Create/Edit => route:Owner,Admin
     * Also lists all schedules (73 => view).
     */
    public function indexSchedules()
    {
        $schedules = StaffSchedule::with('staff')
            ->orderBy('ShiftDate','desc')
            ->get();

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

        return redirect()
            ->route('staff.schedules.index')
            ->with('success','Schedule created.');
    }

    public function destroySchedule($id)
    {
        $schedule = StaffSchedule::findOrFail($id);
        $schedule->delete();

        return redirect()
            ->route('staff.schedules.index')
            ->with('success','Schedule deleted.');
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
        // PayrollID (PK), StaffID, StartDate, EndDate, GrossPay, Deductions,
        // NetPay, GeneratedDate, Status
        $data = $request->validate([
            'StaffID'       => 'required|exists:staff,StaffID',
            'StartDate'     => 'required|date',
            'EndDate'       => 'required|date|after_or_equal:StartDate',
            'GrossPay'      => 'required|numeric|min:0',
            'Deductions'    => 'nullable|numeric|min:0',
            'NetPay'        => 'required|numeric|min:0',
            'GeneratedDate' => 'nullable|date',
            'Status'        => 'nullable|string|max:50',
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
        $payrolls = Payroll::with('staff')
            ->orderBy('StartDate','desc')
            ->get();

        return Inertia::render('Staff/Payroll/Index', [
            'payrolls' => $payrolls
        ]);
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

        return redirect()
            ->route('staff.payroll.index')
            ->with('success','Payroll updated.');
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

        return redirect()
            ->route('staff.index')
            ->with('success','Bonus awarded successfully.');
    }
}
