<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MembershipRenewal extends Model
{
    protected $table = 'membership_renewals';
    protected $primaryKey = 'RenewalID';
    public $timestamps = false; // If no created_at/updated_at columns

    protected $fillable = [
        'MemberID',
        'PlanID',
        'RenewalAmount',
        'RenewalDate', // Must match the DB column name
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
