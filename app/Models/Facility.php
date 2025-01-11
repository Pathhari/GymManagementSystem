<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facility extends Model
{
    protected $primaryKey = 'FacilityID';

    protected $fillable = [
        'Name',
        'FacilityType',
        'Status',
        'Capacity',
        'Location',
        'Notes',
    ];

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'FacilityID', 'FacilityID');
    }
}
