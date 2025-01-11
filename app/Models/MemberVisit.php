<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MemberVisit extends Model
{
    protected $primaryKey = 'VisitID';

    protected $fillable = [
        'MemberID',
        'VisitDate',
        'VisitTime',
        'CheckInMethod',
        'Remarks',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class, 'MemberID', 'MemberID');
    }
}
