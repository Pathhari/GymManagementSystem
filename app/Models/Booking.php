<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Booking extends Model
{   
    use LogsActivity;
    protected $primaryKey = 'BookingID';

    protected $fillable = [
        'MemberID',
        'FacilityID',
        'PaymentID',
        'BookingDate',
        'BookingTime',
        'Duration',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('booking')
            ->setDescriptionForEvent(fn($eventName) => "Booking {$eventName}")
            ->logFillable()
            ->logOnlyDirty();
    }

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
