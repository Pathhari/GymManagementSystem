<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemLog;
use Spatie\Activitylog\Models\Activity;

class SystemController extends Controller
{
    /**
     * Return system logs in JSON (supports optional filtering).
     */
    public function indexLogs(Request $request)
    {
        $query = Activity::orderBy('created_at','desc');
    
        if ($request->filled('log_name')) {
            $query->where('log_name', $request->log_name);
        }
        // If you want to filter by date or user:
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }
    
        $logs = $query->get();
    
        // Convert each activity to the shape your React table wants
        $logsArray = $logs->map(function($activity) {
            return [
                'logId' => 'LOG-'.$activity->id,
                'timestamp' => $activity->created_at->format('Y-m-d H:i:s'),
                'user' => optional($activity->causer)->FullName ?? 'System',
                'actionDesc' => $activity->description,
                'module' => $activity->log_name,
                'logType' => $activity->event ?? 'informational', // or parse from your description
                'details' => json_encode($activity->properties),
                'ipAddress' => $activity->properties['ip'] ?? 'N/A',
                'branch' => 'N/A', // if your properties store branch
            ];
        });
    
        return response()->json(['logs' => $logsArray]);
    }

    /**
     * Delete a single log entry (return JSON instead of redirect).
     */
    public function destroyLog($id)
    {
        $this->authorize('delete-logs');  // Only owners or specific roles

        $log = SystemLog::findOrFail($id);
        $log->delete();

        return response()->json([
            'success' => true,
            'message' => 'Log entry removed.'
        ]);
    }

    /**
     * Bulk delete logs (still returning JSON).
     */
    public function destroyLogs(Request $request)
    {
        $this->authorize('delete-logs');

        $request->validate([
            'logIds'   => 'required|array|min:1',
            'logIds.*' => 'exists:system_logs,id',
        ]);

        SystemLog::whereIn('id', $request->logIds)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Selected logs have been removed.'
        ]);
    }

    /**
     * Display the reports page with data for analytics (if you still want Inertia).
     */
    public function generateReports()
    {
        // Example data
        $membershipCount = \App\Models\Member::count();
        $attendanceStats = \App\Models\Attendance::selectRaw('date(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->limit(30)
            ->get();

        // If you want this as JSON for React, return response()->json([...])
        // Otherwise, if you still use Inertia:
        return Inertia::render('System/Reports/Index', [
            'membershipCount' => $membershipCount,
            'attendanceStats' => $attendanceStats,
        ]);
    }
}
