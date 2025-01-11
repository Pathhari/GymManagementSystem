<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SessionBooking extends Model
{
    protected $primaryKey = 'BookingID';

    protected $fillable = [
        'SessionID',
        'MemberID',
        'BookingDate',
        'PaymentID',
        'Status',
    ];

    public function session()
    {
        return $this->belongsTo(CoachingSessions::class, 'SessionID', 'SessionID');
    }

    public function member()
    {
        return $this->belongsTo(Member::class, 'MemberID', 'MemberID');
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class, 'PaymentID', 'PaymentID');
    }
}
