<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MembershipFreeze extends Model
{
    protected $primaryKey = 'FreezeID';

    protected $fillable = [
        'MemberID',
        'FreezeStartDate',
        'FreezeEndDate',
        'Reason',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class, 'MemberID', 'MemberID');
    }
}
