<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notifications';
    protected $primaryKey = 'NotificationID';

    protected $fillable = [
        'MemberID',
        'EventTrigger',
        'Message',
        'NotificationMethod',
        'SentDate',
        'Status',
    ];

    public $timestamps = false; // if you're not using created_at/updated_at

    public function member()
    {
        return $this->belongsTo(Member::class, 'MemberID', 'MemberID');
    }
}
