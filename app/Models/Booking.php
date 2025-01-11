<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $primaryKey = 'BookingID';

    protected $fillable = [
        'MemberID',
        'FacilityID',
        'PaymentID',
        'BookingDate',
        'BookingTime',
        'Duration',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class, 'MemberID', 'MemberID');
    }

    public function facility()
    {
        return $this->belongsTo(Facility::class, 'FacilityID', 'FacilityID');
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class, 'PaymentID', 'PaymentID');
    }
}
