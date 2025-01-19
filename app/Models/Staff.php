<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;  // <— instead of Model
use Illuminate\Notifications\Notifiable;

class Staff extends Authenticatable
{
    use Notifiable;

    protected $table = 'staff';
    protected $primaryKey = 'StaffID';

    /**
     * The attributes that are mass assignable.
     */
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
        'BranchID', // <--- new column
        'password',    // <— add this if you want to do Eloquent-based inserts
    ];

        // Relationship: A staff belongs to one branch
        public function branch()
        {
            return $this->belongsTo(Branch::class, 'BranchID', 'BranchID');
        }

    /**
     * The attributes that should be hidden for arrays.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Now your relationships remain exactly the same
    // (Attendances, Payrolls, Tasks, Schedules, etc.)

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'StaffID', 'StaffID');
    }

    public function payrolls()
    {
        return $this->hasMany(Payroll::class, 'StaffID', 'StaffID');
    }

    public function tasks()
    {
        return $this->hasMany(StaffTask::class, 'StaffID', 'StaffID');
    }

    public function schedules()
    {
        return $this->hasMany(StaffSchedule::class, 'StaffID', 'StaffID');
    }

    public function bonuses()
    {
        return $this->hasMany(Bonus::class, 'StaffID', 'StaffID');
    }

    public function maintenanceLogs()
    {
        return $this->hasMany(MaintenanceLog::class, 'MaintainedBy', 'StaffID');
    }

    public function systemLogs()
    {
        return $this->hasMany(SystemLog::class, 'UserID', 'StaffID');
    }

    public function productInventoryLogs()
    {
        return $this->hasMany(ProductInventoryLog::class, 'StaffID', 'StaffID');
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'StaffID', 'StaffID');
    }

    public function branches()
{
    return $this->belongsToMany(
        Branch::class, 
        'branch_staff', 
        'StaffID', 
        'BranchID', 
        'StaffID', 
        'BranchID'
    );
}
}
