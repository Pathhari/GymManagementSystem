<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\SystemLog;

class SystemController extends Controller
{
    /**
     * Display a list of system logs with optional filtering and pagination.
     */
    public function indexLogs(Request $request)
    {
        $query = SystemLog::with('user')->orderBy('Timestamp', 'desc');

        if ($request->filled('user')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->user . '%');
            });
        }

        if ($request->filled('date')) {
            $query->whereDate('Timestamp', $request->date);
        }

        $logs = $query->paginate(15);

        return Inertia::render('System/Logs/Index', compact('logs'));
    }

    /**
     * Delete a single log entry.
     */
    public function destroyLog($id)
    {
        $this->authorize('delete-logs');

        $log = SystemLog::findOrFail($id);
        $log->delete();

        return redirect()->route('system.logs.index')->with('success', 'Log entry removed.');
    }

    /**
     * Bulk delete logs.
     */
    public function destroyLogs(Request $request)
    {
        $this->authorize('delete-logs');

        $request->validate([
            'logIds' => 'required|array|min:1',
            'logIds.*' => 'exists:system_logs,id',
        ]);

        SystemLog::whereIn('id', $request->logIds)->delete();

        return redirect()->route('system.logs.index')->with('success', 'Selected logs have been removed.');
    }

    /**
     * Display the reports page with data for analytics.
     */
    public function generateReports()
    {
        // Example: Gather data for membership stats, finances, attendance, etc.
        $membershipCount = \App\Models\Member::count();
        $attendanceStats = \App\Models\Attendance::selectRaw('date(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->limit(30)
            ->get();

        return Inertia::render('System/Reports/Index', [
            'membershipCount' => $membershipCount,
            'attendanceStats' => $attendanceStats,
        ]);
    }
}
