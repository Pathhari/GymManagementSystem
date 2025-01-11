<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoachingSessions extends Model
{
    protected $primaryKey = 'SessionID';

    protected $fillable = [
        'SessionName',
        'SessionType',
        'CoachID',
        'StartTime',
        'EndTime',
        'Capacity',
        'Location',
        'Fee',
    ];

    public function coach()
    {
        return $this->belongsTo(Coach::class, 'CoachID', 'CoachID');
    }

    // A session can have many bookings
    public function sessionBookings()
    {
        return $this->hasMany(SessionBooking::class, 'SessionID', 'SessionID');
    }

    // A session can have many attendances
    public function sessionAttendances()
    {
        return $this->hasMany(SessionAttendance::class, 'SessionID', 'SessionID');
    }

    // A session can have a waitlist
    public function sessionWaitlist()
    {
        return $this->hasMany(SessionWaitlist::class, 'SessionID', 'SessionID');
    }
}
