<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coach extends Model
{
    protected $primaryKey = 'CoachID';

    protected $fillable = [
        'FullName',
        'Specialty',
        'Availability',
        'ContactInfo',
    ];

    // A coach can have many sessions
    public function coachingSessions()
    {
        return $this->hasMany(CoachingSessions::class, 'CoachID', 'CoachID');
    }
    
}
