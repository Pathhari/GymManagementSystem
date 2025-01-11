<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SessionAttendance extends Model
{
    protected $primaryKey = 'AttendanceID';

    protected $fillable = [
        'SessionID',
        'MemberID',
        'AttendanceDate',
    ];

    public function session()
    {
        return $this->belongsTo(CoachingSessions::class, 'SessionID', 'SessionID');
    }

    public function member()
    {
        return $this->belongsTo(Member::class, 'MemberID', 'MemberID');
    }
}
