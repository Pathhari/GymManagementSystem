<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    protected $primaryKey = 'StaffID';

    protected $fillable = [
        'FullName',
        'Role',
        'Email',
        'Phone',
        'DailyRate',
        'HourlyRate',
        'OvertimeRate',
        'DateHired',
        'Notes',
    ];

    // Relationship: A staff can have many attendance records
    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'StaffID', 'StaffID');
    }

    // Relationship: A staff can have many payrolls
    public function payrolls()
    {
        return $this->hasMany(Payroll::class, 'StaffID', 'StaffID');
    }

    // Relationship: A staff can have many tasks
    public function tasks()
    {
        return $this->hasMany(StaffTask::class, 'StaffID', 'StaffID');
    }

    // Relationship: A staff can have many schedules
    public function schedules()
    {
        return $this->hasMany(StaffSchedule::class, 'StaffID', 'StaffID');
    }

    // Relationship: A staff can have many bonuses
    public function bonuses()
    {
        return $this->hasMany(Bonus::class, 'StaffID', 'StaffID');
    }

    // Relationship: A staff can maintain equipment logs
    public function maintenanceLogs()
    {
        return $this->hasMany(MaintenanceLog::class, 'MaintainedBy', 'StaffID');
    }

    // Relationship: A staff can appear in system logs
    public function systemLogs()
    {
        return $this->hasMany(SystemLog::class, 'UserID', 'StaffID');
    }

    // Relationship: If staff is recorded in inventory log
    public function productInventoryLogs()
    {
        return $this->hasMany(ProductInventoryLog::class, 'StaffID', 'StaffID');
    }

    // Relationship: If staff is recorded in expenses
    public function expenses()
    {
        return $this->hasMany(Expense::class, 'StaffID', 'StaffID');
    }
}
