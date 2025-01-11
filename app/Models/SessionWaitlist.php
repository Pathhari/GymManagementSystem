<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SessionWaitlist extends Model
{
    protected $primaryKey = 'WaitlistID';

    protected $fillable = [
        'SessionID',
        'MemberID',
        'WaitlistDate',
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
}
