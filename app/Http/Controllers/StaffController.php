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
use App\Models\MaintenanceLog;
use Illuminate\Support\Arr;


class StaffController extends Controller
{   

    // In StaffController:
    public function staffDashboardInfo()
    {
        $admin = auth('admin')->user();
        $assignedBranchIDs = $admin->branches()->pluck('branches.BranchID')->toArray();
        $staffUser = auth('staff')->user();
        if (!$staffUser) {
            return response()->json(['error' => 'Not logged in'], 401);
        }

        // Double check if the staff user’s BranchID is in the $assignedBranchIDs
        if (! in_array($staffUser->BranchID, $assignedBranchIDs)) {
            return response()->json(['error' => 'Unauthorized branch'], 403);
        }

        // Now fetch tasks for this single staff
        $tasks = StaffTask::with('staff')
            ->where('StaffID', $staffUser->StaffID)
            ->orderBy('TaskID','desc')
            ->get();

        // Similarly for attendance
        $attendance = Attendance::with('staff')
            ->where('StaffID', $staffUser->StaffID)
            ->orderBy('Date','desc')
            ->get();

        $schedules = StaffSchedule::with('staff')
            ->where('StaffID', $staffUser->StaffID)
            ->orderBy('ShiftDate','desc')
            ->get();

        return response()->json([
            'staffId'    => $staffUser->StaffID,
            'tasks'      => $tasks,
            'attendance' => $attendance,
            'schedule'   => $schedules,
        ]);
    }

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
        $staff = Staff::with(['branches' => function($query) {
            $query->select('branches.BranchID', 'BranchName');       
        }])->orderBy('FullName')->get();
    
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

    public function getStaffMetrics()
{
    // 1) Get the logged-in staff user
    $staff = auth('staff')->user();
    if (!$staff) {
        return response()->json(['error' => 'Not authenticated as staff'], 401);
    }

    // 2) Gather the staff’s branch IDs from the pivot
    $branchIDs = $staff->branches->pluck('BranchID');

    // 3) Lockers in use for these branches
    $lockersInUse = \DB::table('lockers')
        ->whereIn('BranchID', $branchIDs)
        ->where('Status', 'Occupied')
        ->count();

    // 4) Check-ins today, also branch filtered if needed
    $today = now()->format('Y-m-d');
    $checkInsToday = \DB::table('member_visits')
        ->whereDate('VisitDate', $today)
        ->whereIn('BranchID', $branchIDs)
        ->count();

    // 5) Possibly pending issues
    $pendingIssues = MaintenanceLog::where('Resolution', 'pending')
        ->whereHas('equipment', function ($query) use ($branchIDs) {
        $query->whereIn('BranchID', $branchIDs);
    })
    ->count();

    return response()->json([
        'checkInsToday' => $checkInsToday,
        'lockersInUse'  => $lockersInUse,
        'pendingIssues' => $pendingIssues,
    ]);
}

    /* ------------------------------------------------------------------
     * V. ATTENDANCE (Attendance)
     * ------------------------------------------------------------------ */
        /**
     * Return a JSON list of attendance records, including the staff relationship.
     */
    public function indexAttendance()
    {
        $staff = auth('staff')->user();
        
        if ($staff) {
            $attendance = Attendance::with('staff')
                ->where('StaffID', $staff->StaffID)
                ->orderBy('Date','desc')
                ->get();
        } else {
            // If needed, handle admin or non-staff scenario
            $attendance = Attendance::with('staff')
                ->orderBy('Date','desc')
                ->get();
        }
    
        return response()->json($attendance);
    }
    

    public function storeAttendance(Request $request)
    {
        $data = $request->validate([
            'StaffID'       => 'required|exists:staff,StaffID',
            'Date'          => 'required|date',
            'TimeIn'        => 'nullable|date_format:H:i:s',
            'TimeOut'       => 'nullable|date_format:H:i:s|after:TimeIn',
            'HoursWorked'   => 'nullable|numeric|min:0',
            'OvertimeHours' => 'nullable|numeric|min:0',
        ]);
    
        $attendance = new Attendance();
        $attendance->StaffID       = $data['StaffID'];
        $attendance->Date          = $data['Date'];
        $attendance->TimeIn        = $data['TimeIn'] ?? null;
        $attendance->TimeOut       = $data['TimeOut'] ?? null;
        $attendance->HoursWorked   = 0; // Default 0
        $attendance->OvertimeHours = $data['OvertimeHours'] ?? 0;
    
        // If both TimeIn & TimeOut are present, compute raw hours
        if (!empty($attendance->TimeIn) && !empty($attendance->TimeOut)) {
            $in  = strtotime($attendance->Date.' '.$attendance->TimeIn);
            $out = strtotime($attendance->Date.' '.$attendance->TimeOut);
            $rawHours = max(($out - $in) / 3600, 0);
    
            // 1) Subtract break if the scheduled shift is >= 9 hrs
            $schedule = StaffSchedule::where('StaffID', $attendance->StaffID)
                ->where('ShiftDate', $attendance->Date)
                ->first();
            if ($schedule) {
                if (in_array($schedule->shiftType, ['morning','mid','evening'])) {
                    // Always subtract 1 hour
                    $rawHours = max($rawHours - 1, 0);
                }
                else if ($schedule->shiftType === 'dynamic') {
                    // Check if dynamic shift is ≥ 9 hours
                    $shiftStart = strtotime($schedule->ShiftDate.' '.$schedule->ShiftStart);
                    $shiftEnd   = strtotime($schedule->ShiftDate.' '.$schedule->ShiftEnd);
                    $scheduledHrs = ($shiftEnd - $shiftStart) / 3600;
                    if ($scheduledHrs >= 9) {
                        $rawHours = max($rawHours - 1, 0);
                    }
                }
            }
    
            // 2) Cap HoursWorked at 8 (no automatic OT)
            $attendance->HoursWorked = min($rawHours, 8);
        }
    
        $attendance->save();
        $attendance->load('staff');
    
        return response()->json([
            'message'    => 'Attendance created successfully.',
            'attendance' => $attendance,
        ], 201);
    }

     /**
     * Clock in/out or update an attendance record, return JSON.
     */
    public function clockInOut(Request $request)
    {
        $data = $request->validate([
            'StaffID' => 'required|exists:staff,StaffID',
            'Date'    => 'required|date',
            'TimeIn'  => 'nullable|date_format:H:i',
            'TimeOut' => 'nullable|date_format:H:i|after:TimeIn'
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
    
        // If we have both times, compute raw hours
        if ($attendance->TimeIn && $attendance->TimeOut) {
            $in  = strtotime($attendance->Date.' '.$attendance->TimeIn);
            $out = strtotime($attendance->Date.' '.$attendance->TimeOut);
            $rawHours = max(($out - $in) / 3600, 0);
    
            // Subtract break if scheduled shift ≥ 9 hrs
            $schedule = StaffSchedule::where('StaffID', $attendance->StaffID)
                ->where('ShiftDate', $attendance->Date)
                ->first();
    
            if ($schedule) {
                if (in_array($schedule->shiftType, ['morning','mid','evening'])) {
                    $rawHours = max($rawHours - 1, 0);
                } 
                else if ($schedule->shiftType === 'dynamic') {
                    $shiftStart = strtotime($schedule->ShiftDate.' '.$schedule->ShiftStart);
                    $shiftEnd   = strtotime($schedule->ShiftDate.' '.$schedule->ShiftEnd);
                    $scheduledHrs = ($shiftEnd - $shiftStart) / 3600;
                    if ($scheduledHrs >= 9) {
                        $rawHours = max($rawHours - 1, 0);
                    }
                }
            }
    
            // Cap HoursWorked at 8 by default
            $attendance->HoursWorked = min($rawHours, 8);
        }
    
        $attendance->save();
    
        return response()->json([
            'message'    => 'Attendance updated (capped at 8 paid hours).',
            'attendance' => $attendance,
        ]);
    }
    

    /**
     * Update attendance and return JSON.
     */
    public function updateAttendance(Request $request, $id)
    {
        $attendance = Attendance::findOrFail($id);

        $data = $request->validate([
            'Date'          => 'required|date',
            'TimeIn' => 'nullable|date_format:H:i:s',
            'TimeOut' => 'nullable|date_format:H:i:s|after:TimeIn',
            'HoursWorked'   => 'nullable|numeric|min:0',
            'OvertimeHours' => 'nullable|numeric|min:0',
        ]);

        $attendance->update($data);

        return response()->json([
            'message'    => 'Attendance updated.',
            'attendance' => $attendance,
        ]);
    }

    public function attendanceAnalytics(Request $request)
    {
        $from = $request->query('dateFrom');
        $to   = $request->query('dateTo');
        $branch = $request->query('branchID');
        $timePeriod = $request->query('timePeriod'); // daily, weekly, monthly, yearly?
    
        $query = \DB::table('attendances');
    
        // If there's a BranchID in the attendances table, you can filter:
        if ($branch && $branch !== 'All Branches') {
            $query->where('BranchID', $branch);
        }
    
        if ($from && $to) {
            $query->whereBetween('Date', [$from, $to]);
        }
    
        // For weekly grouping
        if ($timePeriod === 'weekly') {
            $query->select(
                \DB::raw("YEAR(Date) as year"),
                \DB::raw("WEEK(Date, 1) as week"),
                \DB::raw("COUNT(*) as totalAttendance")
            )
            ->groupBy('year', 'week')
            ->orderBy('year')
            ->orderBy('week');
        }
        // For monthly grouping
        else if ($timePeriod === 'monthly') {
            $query->select(
                \DB::raw("YEAR(Date) as year"),
                \DB::raw("MONTH(Date) as monthNum"),
                \DB::raw("DATE_FORMAT(Date, '%b %Y') as monthText"),
                \DB::raw("COUNT(*) as totalAttendance")
            )
            ->groupBy('year', 'monthNum')
            ->orderBy('year')
            ->orderBy('monthNum');
        }
        // etc. (Add daily, yearly, etc.)
    
        $analytics = $query->get();
        return response()->json($analytics, 200);
    }
    

    /* ------------------------------------------------------------------
     * R. STAFF TASKS
     * ------------------------------------------------------------------ */

    /**
     * Return a JSON list of tasks, including staff relationship.
     */
    // Existing in StaffController:
    public function indexTasks()
    {
        // If you're using Laravel’s 'auth:staff' guard, you can get the logged-in staff:
        $staff = auth('staff')->user();
        
        // If staff is authenticated, filter tasks by staff->StaffID
        // Or handle the case when $staff is null (like if admin is viewing all?)
        if ($staff) {
            $tasks = StaffTask::with('staff')
                ->where('StaffID', $staff->StaffID)
                ->orderBy('TaskDate','desc')
                ->get();
        } else {
            // If no staff user, or if you allow admin, you can either return all or handle differently
            $tasks = StaffTask::with('staff')->orderBy('TaskDate','desc')->get();
        }

        return response()->json($tasks);
    }

    /**
     * Store a new task (POST /staff/tasks), return JSON.
     */
        // In your TaskController.php
        public function storeTask(Request $request)
        {
            $data = $request->validate([
                'StaffID'         => 'required|exists:staff,StaffID',
                'TaskDescription' => 'required|string|max:255',
                'TaskDate'        => 'nullable|date',
                'Status'          => 'nullable|string|max:50',
            ]);

            $task = StaffTask::create($data);
            
            // Reload with relationships
            $taskWithStaff = StaffTask::with(['staff' => function($query) {
                $query->select('StaffID', 'FullName');
            }])->find($task->TaskID);

            return response()->json([
                'message' => 'Staff task created.',
                'task'    => $taskWithStaff
            ], 201);
        }

    public function updateTask(Request $request, $id)
        {
            $task = StaffTask::findOrFail($id);
            
            $data = $request->validate([        
                'TaskDescription' => 'sometimes|string|max:255',
                'TaskDate'        => 'sometimes|date',
                'Status'          => 'required|string|in:Pending,InProgress,Completed',]);
                 $task->update($data);

            // Reload with relationships
            $updatedTask = StaffTask::with(['staff' => function($query) {
                $query->select('StaffID', 'FullName');
            }])->find($task->TaskID);

            return response()->json([
                'message' => 'Staff task updated.',
                'task'    => $updatedTask
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

    public function performance()
    {
        $performance = \DB::table('staff_tasks')
            ->select(
                'staff.StaffID',
                'staff.FullName',
                \DB::raw('COUNT(*) as tasksCompleted')
            )
            ->join('staff', 'staff_tasks.StaffID', '=', 'staff.StaffID')
            ->where('staff_tasks.Status', 'Completed')
            ->groupBy('staff.StaffID', 'staff.FullName')
            ->get();
        
        return response()->json($performance, 200);
    }

    /* ------------------------------------------------------------------
     * AB. STAFF SCHEDULE
     * ------------------------------------------------------------------ */

    /**
     * Return a JSON list of schedules, including staff relationship.
     */
    public function indexSchedules()
    {
        $staff = auth('staff')->user();
    
        if ($staff) {
            $schedules = StaffSchedule::with(['staff' => function($query) {
                    $query->select('StaffID', 'FullName');
                }])
                ->where('StaffID', $staff->StaffID)
                ->orderBy('ShiftDate', 'desc')
                ->get();
        } else {
            $schedules = StaffSchedule::with(['staff' => function($query) {
                    $query->select('StaffID', 'FullName');
                }])
                ->orderBy('ShiftDate', 'desc')
                ->get();
        }
    
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
        // We'll grab today's date in 'Y-m-d' format
        $today = now()->format('Y-m-d');
    
        $data = $request->validate([
            'StaffID'   => 'required|exists:staff,StaffID',
            // date must be "today or after" => so we do after_or_equal:$today
            'dateFrom'  => "required|date|after_or_equal:$today",
            'dateTo'    => 'required|date|after_or_equal:dateFrom',
            'shiftType' => 'required|string|in:morning,mid,evening,dynamic',
            'startTime' => 'nullable|date_format:H:i', // used if dynamic
            'endTime'   => 'nullable|date_format:H:i|after:startTime'
        ]);
    
        // map shiftType -> default times, if not dynamic
        $shiftStart = null;
        $shiftEnd   = null;
        switch ($data['shiftType']) {
            case 'morning':
                $shiftStart = '05:30';
                $shiftEnd   = '14:30';
                break;
            case 'mid':
                $shiftStart = '10:00';
                $shiftEnd   = '19:00';
                break;
            case 'evening':
                $shiftStart = '15:00';
                $shiftEnd   = '23:59';  // or '00:00' if you want the shift to cross midnight
                break;
            case 'dynamic':
                $shiftStart = $data['startTime'];
                $shiftEnd   = $data['endTime'];
                break;
        }
    
        // Loop from dateFrom to dateTo
        $period = \Carbon\CarbonPeriod::create($data['dateFrom'], $data['dateTo']);
        $records = [];
        foreach ($period as $date) {
            // For extra safety, skip if somehow it's before 'today'
            if ($date->isBefore(now()->startOfDay())) {
                continue; // or throw an exception if you want
            }
    
            $records[] = [
                'StaffID'    => $data['StaffID'],
                'ShiftDate'  => $date->format('Y-m-d'),
                'ShiftStart' => $shiftStart,
                'ShiftEnd'   => $shiftEnd,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
    
        // Bulk insert
        StaffSchedule::insert($records);
        $created = StaffSchedule::with('staff')
        ->where('StaffID', $data['StaffID'])
        ->whereBetween('ShiftDate', [$data['dateFrom'], $data['dateTo']])
        ->orderBy('ShiftDate','asc')
        ->get();
  
      return response()->json([
          'message'   => 'Schedules created',
          'schedules' => $created,
      ], 201);
    }
    
    
    public function scheduleRange($staffID, Request $request)
    {
        $start = $request->query('start');
        $end   = $request->query('end');

        $request->validate([
            'start' => 'required|date',
            'end'   => 'required|date|after_or_equal:start'
        ]);

        $schedules = StaffSchedule::where('StaffID', $staffID)
            ->whereBetween('ShiftDate', [$start, $end])
            ->orderBy('ShiftDate')
            ->get();

        return response()->json($schedules);
    }

    public function bulkStoreSchedules(Request $request)
    {
        $today = now()->format('Y-m-d');
    
        $data = $request->validate([
            'StaffID'   => 'required|exists:staff,StaffID',
            'dateFrom'  => "required|date|after_or_equal:$today",
            'dateTo'    => 'required|date|after_or_equal:dateFrom',
            'shiftType' => 'required|string|in:morning,mid,evening,dynamic',
            'startTime' => 'nullable|date_format:H:i',
            'endTime'   => 'nullable|date_format:H:i|after:startTime',
        ]);

        // convert shiftType -> start/end times if not dynamic
        $shiftStart = null;
        $shiftEnd   = null;
        switch ($data['shiftType']) {
            case 'morning':
                $shiftStart = '05:30';
                $shiftEnd   = '14:30';
                break;
            case 'mid':
                $shiftStart = '10:00';
                $shiftEnd   = '19:00';
                break;
            case 'evening':
                $shiftStart = '15:00';
                $shiftEnd   = '23:59'; 
                break;
            case 'dynamic':
                $shiftStart = $data['startTime'];
                $shiftEnd   = $data['endTime'];
                break;
        }

        $period = \Carbon\CarbonPeriod::create($data['dateFrom'], $data['dateTo']);
        $records = [];
        foreach ($period as $date) {
            $records[] = [
                'StaffID'    => $data['StaffID'],
                'ShiftDate'  => $date->format('Y-m-d'),
                'ShiftStart' => $shiftStart,
                'ShiftEnd'   => $shiftEnd,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        StaffSchedule::insert($records);

        // If you want to load them again from the DB
        $created = StaffSchedule::with('staff')
            ->where('StaffID', $data['StaffID'])
            ->whereBetween('ShiftDate', [$data['dateFrom'], $data['dateTo']])
            ->orderBy('ShiftDate','asc')
            ->get();

        return response()->json([
            'message'   => 'Schedules created',
            'schedules' => $created,
        ]);
    }

    public function bulkStoreCustom(Request $request)
    {
        // 1) Validate the incoming data
        $data = $request->validate([
            'StaffID'       => 'required|exists:staff,StaffID',
            'shiftType'     => 'required|string|in:morning,mid,evening,dynamic',
            'startTime'     => 'nullable|date_format:H:i',
            'endTime'       => 'nullable|date_format:H:i|after:startTime',
            'selectedDates' => 'required|array|min:1',
            'selectedDates.*' => 'date_format:Y-m-d',
        ]);
    
        // 2) Convert shiftType => $shiftStart/$shiftEnd
        $shiftStart = null;
        $shiftEnd   = null;
        switch ($data['shiftType']) {
            case 'morning':
                $shiftStart = '05:30';
                $shiftEnd   = '14:30';
                break;
            case 'mid':
                $shiftStart = '10:00';
                $shiftEnd   = '19:00';
                break;
            case 'evening':
                $shiftStart = '15:00';
                $shiftEnd   = '23:59';
                break;
            case 'dynamic':
                $shiftStart = $data['startTime'];
                $shiftEnd   = $data['endTime'];
                break;
        }
    
        // 3) Create each schedule individually
        $createdRecords = [];
        foreach ($data['selectedDates'] as $date) {
            // Use Eloquent create() so we can get the auto-increment ID:
            $sched = \App\Models\StaffSchedule::create([
                'StaffID'    => $data['StaffID'],
                'ShiftDate'  => $date,
                'ShiftStart' => $shiftStart,
                'ShiftEnd'   => $shiftEnd,
            ]);
    
            // Optionally load the 'staff' relationship if you want
            // $sched->load('staff');
    
            $createdRecords[] = $sched;
        }
    
        // 4) Return the newly created schedules (each has ScheduleID)
        return response()->json([
            'message'   => 'Custom schedules created successfully.',
            'schedules' => $createdRecords,
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
            'Deductions'    => 'nullable|numeric|min:0',  // user typed
            'GeneratedDate' => 'nullable|date',
            'Status'        => 'nullable|string|max:50',
        ]);
    
        // 1) Basic staff/rate info
        $staff = Staff::findOrFail($data['StaffID']);
        $hourlyRate   = $staff->HourlyRate ?? 0;
        $overtimeRate = $staff->OvertimeRate ?? 0;
    
        // 2) Fetch Attendance for date range
        $attendances = Attendance::where('StaffID', $staff->StaffID)
            ->whereBetween('Date', [$data['StartDate'], $data['EndDate']])
            ->get();
    
        if ($attendances->isEmpty()) {
            return response()->json([
                'message' => 'No attendance found in the specified date range.',
            ], 422);
        }
    
        // 3) Fetch Schedules for date range (to check lateness)
        //    If you only store 1 schedule per day, a simple match on date can work.
        $schedules = StaffSchedule::where('StaffID', $staff->StaffID)
            ->whereBetween('ShiftDate', [$data['StartDate'], $data['EndDate']])
            ->get()
            ->keyBy('ShiftDate'); // so we can quickly do $schedules[$attendance->Date]
    
        $totalRegularHours  = 0;
        $totalOvertimeHours = 0;
        $totalLateDeductions = 0; // We'll accumulate the tardiness penalty here
    
        foreach ($attendances as $att) {
            $hrs   = $att->HoursWorked ?: 0;
            // 1) Regular hours is min(HoursWorked, 8)
            $regular = min($hrs, 8);
        
            // 2) Overtime is attendance->OvertimeHours, which manager sets
            //    But we also clamp it so it can’t exceed the total hours minus 8
            //    in case the manager puts something off by mistake.
            $approvedOT = $att->OvertimeHours ?: 0;
            // If HoursWorked is only 7, the staff can’t have 3 OT hours
            // so we clamp it to the portion beyond 8
            $possibleOT = max($hrs - 8, 0);
            $ot = min($approvedOT, $possibleOT);
        
            $totalRegularHours  += $regular;
            $totalOvertimeHours += $ot;
        
            // 3) Check for lateness (10-min grace, 1 peso per min beyond that)
            $schedule = $schedules->get($att->Date);
            if ($schedule && $att->TimeIn) {
                $shiftStartStr = $schedule->ShiftDate . ' ' . $schedule->ShiftStart;
                $shiftStart    = strtotime($shiftStartStr);
        
                $timeInStr = $att->Date . ' ' . $att->TimeIn;
                $timeIn    = strtotime($timeInStr);
        
                // Grace period => shiftStart + 10 min
                $graceEnd = $shiftStart + (10 * 60);
                if ($timeIn > $graceEnd) {
                    $diffSec     = $timeIn - $graceEnd;
                    $lateMinutes = (int) floor($diffSec / 60);
                    $penalty     = $lateMinutes * 1; // 1 peso per minute
                    $totalLateDeductions += $penalty;
                }
            }
        }    
        // c) Now we have total hours + totalLateDeductions
        $grossPay = ($totalRegularHours * $hourlyRate)
                  + ($totalOvertimeHours * $overtimeRate);
    
        // 4) Combine user’s typed "Deductions" + computed late penalty
        $userDeductions   = $request->input('Deductions', 0);
        $combinedDeductions = $userDeductions + $totalLateDeductions;
    
        $netPay = $grossPay - $combinedDeductions;
    
        // 5) Create the payroll record
        $payroll = Payroll::create([
            'StaffID'       => $staff->StaffID,
            'StartDate'     => $data['StartDate'],
            'EndDate'       => $data['EndDate'],
            'GrossPay'      => $grossPay,
            'Deductions'    => $combinedDeductions, // store total in DB
            'NetPay'        => $netPay,
            'GeneratedDate' => $request->input('GeneratedDate') ?: now(),
            'Status'        => $request->input('Status', 'Pending'),
        ]);
    
        // Return with staff
        $payroll->load('staff');
        return response()->json([
            'message' => 'Payroll created successfully (with late deductions).',
            'payroll' => $payroll
        ], 201);
    }
    
        /**
     * Return JSON list of payrolls, including staff relationship.
     */
    // In StaffController.php (or wherever indexPayroll is defined)
    public function indexPayroll()
    {
        $payrolls = Payroll::with(['staff' => function ($query) {
            $query->select('StaffID', 'FullName'); // Only fetch needed fields
        }])->orderBy('StartDate', 'desc')->get();

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

public function attendanceRange($staffID, Request $request)
{
    $start = $request->query('start');
    $end   = $request->query('end');

    // Validate date inputs
    $request->validate([
        'start' => 'required|date',
        'end'   => 'required|date|after_or_equal:start'
    ]);

    // Fetch attendances for the staff in the date range
    $attendances = Attendance::where('StaffID', $staffID)
        ->whereBetween('Date', [$start, $end])
        ->orderBy('Date', 'asc')
        ->get();

    return response()->json($attendances);
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
