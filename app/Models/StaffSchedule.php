<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaffSchedule extends Model
{
    protected $primaryKey = 'ScheduleID';

    protected $fillable = [
        'StaffID',
        'ShiftDate',
        'ShiftStart',
        'ShiftEnd',
        'RoleOverride',
    ];

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'StaffID', 'StaffID');
    }
}
