<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Models\Activity as SpatieActivity;

class Member extends Model
{
    use LogsActivity;
    
    protected $table = 'members';
    protected $primaryKey = 'MemberID';

    protected $fillable = [
        'FullName',
        'Email',
        'Phone',
        'PlanID',
        'MembershipCardNumber',
        'MembershipCardIssued',
        'MembershipStartDate',
        'MembershipEndDate',
        'Biometrics',
        'PhotoPath',
        'FreeSessions',
        'Notes',
        'StartedBranchID',
        'BranchID',
        'MemberStatusID',
    ];

    // Relationship: A member started at one branch
    public function startedBranch()
    {
        return $this->belongsTo(Branch::class, 'StartedBranchID', 'BranchID');
    }

    // Relationship: A member belongs to a membership plan
    public function plan()
    {
        return $this->belongsTo(MembershipPlan::class, 'PlanID', 'PlanID');
    }

    // Relationship: A member can have many renewals
    public function renewals()
    {
        return $this->hasMany(MembershipRenewal::class, 'MemberID', 'MemberID');
    }

    // Relationship: A member can have many freezes
    public function freezes()
    {
        return $this->hasMany(MembershipFreeze::class, 'MemberID', 'MemberID');
    }

    // Relationship: A member can have many change logs
    public function changeLogs()
    {
        return $this->hasMany(MembershipChangeLog::class, 'MemberID', 'MemberID');
    }

    // Relationship: A member can have many payments
    public function payments()
    {
        return $this->hasMany(Payment::class, 'MemberID', 'MemberID');
    }

    // Relationship: A member can book facilities
    public function bookings()
    {
        return $this->hasMany(Booking::class, 'MemberID', 'MemberID');
    }

    // Relationship: A member can receive notifications
    public function notifications()
    {
        return $this->hasMany(Notification::class, 'MemberID', 'MemberID');
    }

    // Relationship: A member can have multiple locker usages
    public function lockerUsages()
    {
        return $this->hasMany(LockerUsage::class, 'MemberID', 'MemberID');
    }

    // Relationship: A member has many session bookings
    public function sessionBookings()
    {
        return $this->hasMany(SessionBooking::class, 'MemberID', 'MemberID');
    }

    // Relationship: A member can appear in session attendance
    public function sessionAttendances()
    {
        return $this->hasMany(SessionAttendance::class, 'MemberID', 'MemberID');
    }

    // Relationship: A member can be in a session waitlist
    public function sessionWaitlists()
    {
        return $this->hasMany(SessionWaitlist::class, 'MemberID', 'MemberID');
    }

    // Relationship: A member can have multiple visits
    public function visits()
    {
        return $this->hasMany(MemberVisit::class, 'MemberID', 'MemberID');
    }

    // Relationship: A member belongs to a status
    public function status()
    {
        return $this->belongsTo(MemberStatus::class, 'MemberStatusID', 'MemberStatusID');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('member')
            ->setDescriptionForEvent(fn ($eventName) => "Member record has been {$eventName}")
            ->logFillable()
            ->logOnlyDirty();
    }

    /**
     * This is called right before the activity record is saved.
     * We add 'branch_id' into properties from $this->StartedBranchID.
     */
    public function tapActivity(SpatieActivity $activity, string $eventName)
    {
        $branchId = $this->StartedBranchID ?? null;
        $activity->properties = $activity->properties->put('branch_id', $branchId);
    }
}
