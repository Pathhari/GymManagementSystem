<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Member extends Model
{   
    use LogsActivity;
    protected $table = 'members';         // If your table name is "members"
    protected $primaryKey = 'MemberID';   // If the PK is "MemberID"

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
        // Add the new status foreign key
        'MemberStatusID',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('member')                    // or "Membership"
            ->setDescriptionForEvent(function(string $eventName) {
                return "Member record has been {$eventName}";
            })
            ->logFillable()                           // logs changes to fillable attributes
            ->logOnlyDirty();                         // only store changed attributes
    }


    // Relationship: A member started at one branch
    public function startedBranch()
    {
        // references: 'StartedBranchID' on this model => 'BranchID' on branches table
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

    // Relationship: A member can have many changes (Plan upgrade/downgrade logs)
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

    public function status()
{
    return $this->belongsTo(MemberStatus::class, 'MemberStatusID', 'MemberStatusID');
}


}
