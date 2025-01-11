<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    protected $primaryKey = 'PayrollID';

    protected $fillable = [
        'StaffID',
        'StartDate',
        'EndDate',
        'GrossPay',
        'Deductions',
        'NetPay',
        'GeneratedDate',
        'Status',
    ];

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'StaffID', 'StaffID');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'PayrollID', 'PayrollID');
    }
}
