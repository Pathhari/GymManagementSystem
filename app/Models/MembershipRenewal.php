<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MembershipRenewal extends Model
{
    protected $primaryKey = 'RenewalID';

    protected $fillable = [
        'MemberID',
        'RenewalDate',
        'PlanID',
        'RenewalAmount',
    ];

    // Relationship: belongs to a member
    public function member()
    {
        return $this->belongsTo(Member::class, 'MemberID', 'MemberID');
    }

    // Relationship: belongs to a plan
    public function plan()
    {
        return $this->belongsTo(MembershipPlan::class, 'PlanID', 'PlanID');
    }
}
