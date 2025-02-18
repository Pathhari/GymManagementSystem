<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\CoachingSession;

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
        return $this->hasMany(CoachingSession::class, 'CoachID', 'CoachID');
    }
    
}
