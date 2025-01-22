<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Staff;
use App\Models\StaffTask;
use App\Models\StaffSchedule;
use App\Models\Attendance;
use App\Models\Payroll;
use App\Models\Bonus;
use App\Models\Branch;
use Illuminate\Support\Arr;


class StaffController extends Controller
{
    /**
     * Return a JSON list of all staff members,
     * including single 'branch' and pivot 'branches'.
     */
    public function indexStaff()
    {
        $staff = Staff::with(['branch', 'branches'])->orderBy('StaffID','desc')->get();
        return response()->json($staff);
    }

    public function indexStaffJson()
    {
        // Eager-load any relationships you need
        $staff = Staff::with('branches')->orderBy('StaffID', 'desc')->get();
        return response()->json($staff);
    }
    /**
     * (Optional) Return JSON with necessary data for creating staff,
     * like the list of branches.
     */
    public function createStaff()
    {
        $branches = Branch::orderBy('BranchName')->get();
        return response()->json(['branches' => $branches]);
    }

    /**
     * Store new staff in the DB (POST /staff), return JSON.
     */
    public function storeStaff(Request $request)
    {
        $data = $request->validate([
            'FullName'     => 'required|string|max:255',
            'Role'         => 'required|string|max:50',
            'Email'        => 'required|email|unique:staff,Email',
            'Phone'        => 'nullable|string|max:50',
            'BranchID'     => 'required|exists:branches,BranchID',
            'DateHired'    => 'nullable|date',
            'DailyRate'    => 'nullable|numeric|min:0',
            'HourlyRate'   => 'nullable|numeric|min:0',
            'OvertimeRate' => 'nullable|numeric|min:0',
            'Notes'        => 'nullable|string',
            'password'     => 'sometimes|nullable|min:8|confirmed',
            'BranchIDs'    => 'nullable|array',
            'BranchIDs.*'  => 'exists:branches,BranchID',
        ]);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $branchIDs = $data['BranchIDs'] ?? [];
        unset($data['BranchIDs']);

        $staff = Staff::create($data);

        // Attach single BranchID to pivot
        $staff->branches()->attach($data['BranchID']);

        // If multiple branches, attach them
        if (!empty($branchIDs)) {
            $staff->branches()->attach($branchIDs);
        }

        return response()->json($staff, 201);
    }

    /**
     * Return JSON data needed for editing a staff member,
     * e.g. staff record + all branches.
     */
    public function editStaff($id)
    {
        $staff = Staff::with('branches')->findOrFail($id);
        $allBranches = Branch::orderBy('BranchName')->get();

        return response()->json([
            'staff'    => $staff,
            'branches' => $allBranches,
        ]);
    }

    /**
     * Update staff => PUT /staff/{id}, return JSON.
     */
    public function updateStaff(Request $request, $id)
    {
        $staff = Staff::findOrFail($id);
    
        $data = $request->validate([
            'FullName'     => 'required|string|max:255',
            'Role'         => 'required|string|max:50',
            'Email'        => 'required|email',
            'Phone'        => 'nullable|string|max:50',
            'DateHired'    => 'nullable|date',
            'DailyRate'    => 'nullable|numeric|min:0',
            'HourlyRate'   => 'nullable|numeric|min:0',
            'OvertimeRate' => 'nullable|numeric|min:0',
            'Notes'        => 'nullable|string',
            'BranchIDs'    => 'nullable|array',
            'BranchIDs.*'  => 'exists:branches,BranchID',
        ]);
    
            // Update staff's own columns
            $staff->update(Arr::except($data, ['BranchIDs']));

            // Sync pivot if BranchIDs present
            if (isset($data['BranchIDs'])) {
                $staff->branches()->sync($data['BranchIDs']);
            }

            // Optionally reload the branches relationship
            $staff->load('branches');

            return response()->json(['message' => 'Staff updated', 'staff' => $staff]);
        }

    /**
     * Deactivate staff => sets role to 'Inactive', returns JSON.
     */
    public function deactivateStaff($id)
    {
        $staff = Staff::findOrFail($id);
        $staff->update(['Role' => 'Inactive']);

        return response()->json([
            'message' => 'Staff deactivated.',
            'staff'   => $staff,
        ]);
    }

    /**
     * Delete staff record, return JSON.
     */
    public function destroyStaff($id)
    {
        $staff = Staff::findOrFail($id);
        $staff->delete();

        return response()->json(['message' => 'Staff record removed.']);
    }

    /* ------------------------------------------------------------------
     * V. ATTENDANCE (Attendance)
     * ------------------------------------------------------------------ */

    /**
     * Clock in/out or update an attendance record, return JSON.
     */
    public function clockInOut(Request $request)
    {
        $data = $request->validate([
            'StaffID' => 'required|exists:staff,StaffID',
            'Date'    => 'required|date',
            'TimeIn'  => 'nullable|date_format:H:i',
            'TimeOut' => 'nullable|date_format:H:i|after:TimeIn',
        ]);

        $attendance = Attendance::firstOrNew([
            'StaffID' => $data['StaffID'],
            'Date'    => $data['Date'],
        ]);

        if (isset($data['TimeIn'])) {
            $attendance->TimeIn = $data['TimeIn'];
        }
        if (isset($data['TimeOut'])) {
            $attendance->TimeOut = $data['TimeOut'];
        }

        // Calculate hours if both TimeIn & TimeOut exist
        if ($attendance->TimeIn && $attendance->TimeOut) {
            $in  = strtotime($attendance->Date . ' ' . $attendance->TimeIn);
            $out = strtotime($attendance->Date . ' ' . $attendance->TimeOut);
            $attendance->HoursWorked = max(($out - $in) / 3600, 0);
        }

        $attendance->save();

        return response()->json([
            'message'    => 'Attendance updated.',
            'attendance' => $attendance,
        ]);
    }

    /**
     * Return a JSON list of attendance records, including the staff relationship.
     */
    public function indexAttendance()
    {
        $attendance = Attendance::with('staff')
            ->orderBy('Date','desc')
            ->get();

        return response()->json($attendance);
    }

    /**
     * Update attendance and return JSON.
     */
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

        return response()->json([
            'message'    => 'Attendance updated.',
            'attendance' => $attendance,
        ]);
    }

    /* ------------------------------------------------------------------
     * R. STAFF TASKS
     * ------------------------------------------------------------------ */

    /**
     * Return a JSON list of tasks, including staff relationship.
     */
    public function indexTasks()
    {
        $tasks = StaffTask::with('staff')->orderBy('TaskDate','desc')->get();
        return response()->json($tasks);
    }

    /**
     * Store a new task (POST /staff/tasks), return JSON.
     */
    public function storeTask(Request $request)
    {
        $data = $request->validate([
            'StaffID'         => 'required|exists:staff,StaffID',
            'TaskDescription' => 'required|string|max:255',
            'TaskDate'        => 'nullable|date',
            'Status'          => 'nullable|string|max:50',
        ]);

        $task = StaffTask::create($data);

        return response()->json([
            'message' => 'Staff task created.',
            'task'    => $task,
        ], 201);
    }

    /**
     * Update an existing task, return JSON.
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

        return response()->json([
            'message' => 'Staff task updated.',
            'task'    => $task,
        ]);
    }

    /**
     * Mark a task completed, return JSON.
     */
    public function markTaskCompleted($id)
    {
        $task = StaffTask::findOrFail($id);
        $task->update(['Status' => 'Completed']);

        return response()->json([
            'message' => 'Task completed.',
            'task'    => $task,
        ]);
    }

    /* ------------------------------------------------------------------
     * AB. STAFF SCHEDULE
     * ------------------------------------------------------------------ */

    /**
     * Return a JSON list of schedules, including staff relationship.
     */
    public function indexSchedules()
    {
        $schedules = StaffSchedule::with('staff')->orderBy('ShiftDate','desc')->get();
        return response()->json($schedules);
    }

    /**
     * (Optional) Return any needed data for creating a schedule.
     */
    public function createSchedule()
    {
        $staff = Staff::orderBy('FullName','asc')->get();
        return response()->json(['staff' => $staff]);
    }

    /**
     * Store a new schedule, return JSON.
     */
    public function storeSchedule(Request $request)
    {
        $data = $request->validate([
            'StaffID'     => 'required|exists:staff,StaffID',
            'ShiftDate'   => 'required|date',
            'ShiftStart'  => 'required|date_format:H:i',
            'ShiftEnd'    => 'nullable|date_format:H:i|after:ShiftStart',
            'RoleOverride'=> 'nullable|string|max:50',
        ]);

        $schedule = StaffSchedule::create($data);

        return response()->json([
            'message'  => 'Schedule created.',
            'schedule' => $schedule
        ], 201);
    }

    /**
     * Delete a schedule, return JSON.
     */
    public function destroySchedule($id)
    {
        $schedule = StaffSchedule::findOrFail($id);
        $schedule->delete();
        return response()->json(['message' => 'Schedule deleted.']);
    }

    /* ------------------------------------------------------------------
     * W. PAYROLL & BONUS
     * ------------------------------------------------------------------ */

    /**
     * (Optional) Return data for payroll creation, e.g. staff list.
     */
    public function createPayroll()
    {
        $staff = Staff::orderBy('FullName','asc')->get();
        return response()->json(['staff' => $staff]);
    }

    /**
     * Store a new payroll, return JSON.
     */
    public function storePayroll(Request $request)
    {
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

        $payroll = Payroll::create($data);

        return response()->json([
            'message' => 'Payroll created successfully.',
            'payroll' => $payroll,
        ], 201);
    }

    /**
     * Return JSON list of payrolls, including staff relationship.
     */
    public function indexPayroll()
    {
        $payrolls = Payroll::with('staff')
            ->orderBy('StartDate','desc')
            ->get();

        return response()->json($payrolls);
    }

    /**
     * Update payroll, return JSON.
     */
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

        return response()->json([
            'message' => 'Payroll updated.',
            'payroll' => $payroll,
        ]);
    }

    /**
     * Return data for bonus creation, e.g. staff list.
     */
    public function createBonus()
    {
        $staff = Staff::orderBy('FullName','asc')->get();
        return response()->json(['staff' => $staff]);
    }

    /**
     * Store a new bonus, return JSON.
     */
    public function storeBonus(Request $request)
    {
        $data = $request->validate([
            'StaffID'     => 'required|exists:staff,StaffID',
            'BonusAmount' => 'required|numeric|min:0',
            'BonusDate'   => 'required|date',
            'Reason'      => 'nullable|string|max:255',
        ]);

        $bonus = Bonus::create($data);

        return response()->json([
            'message' => 'Bonus awarded successfully.',
            'bonus'   => $bonus,
        ], 201);
    }


    public function destroyAttendance($id)
{
    $attendance = Attendance::findOrFail($id);
    $attendance->delete();

    return response()->json(['message' => 'Attendance record deleted.']);
}

public function destroyPayroll($id)
{
    $payroll = Payroll::findOrFail($id);
    $payroll->delete();

    return response()->json(['message' => 'Payroll deleted.']);
}

public function destroyTask($id)
{
    $task = StaffTask::findOrFail($id);
    $task->delete();

    return response()->json(['message' => 'Task deleted.']);
}

// For schedules
public function updateSchedule(Request $request, $id)
{
    $schedule = StaffSchedule::findOrFail($id);
    $data = $request->validate([
        'StaffID' => 'required|exists:staff,StaffID',
        'ShiftDate' => 'required|date',
        'ShiftStart' => 'required|date_format:H:i',
        'ShiftEnd' => 'nullable|date_format:H:i|after:ShiftStart',
        'RoleOverride' => 'nullable|string|max:50',
    ]);
    $schedule->update($data);
    return response()->json([
        'message' => 'Schedule updated.',
        'schedule' => $schedule,
    ]);
}




}
