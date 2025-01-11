<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\SystemLog;

class SystemController extends Controller
{
    // T. SystemLog
    // 52. View => route:Owner,Admin
    public function indexLogs()
    {
        $logs = SystemLog::with('user')->orderBy('Timestamp','desc')->get();
        return Inertia::render('System/Logs/Index', compact('logs'));
    }

    // 53. Delete => route:Owner
    public function destroyLog($id)
    {
        $log = SystemLog::findOrFail($id);
        $log->delete();
        return redirect()->route('system.logs.index')->with('success','Log entry removed.');
    }

    // Y. Reports & Analytics
    // 63. Generate => route:Owner,Admin
    public function generateReports()
    {
        // gather membership stats, finances, attendance, etc.
        return Inertia::render('System/Reports/Index', [
            // 'reportData' => ...
        ]);
    }
}
