<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonthlyClientAttendance extends Model
{
    protected $table = 'monthly_client_attendances';
    protected $primaryKey = 'MonthlyClientAttendanceID';

    protected $fillable = [
        'MonthlyClientID',
        'VisitDateTime',
        'Notes',
    ];

    // Relationship back to MonthlyClient
    public function monthlyClient()
    {
        return $this->belongsTo(MonthlyClient::class, 'MonthlyClientID', 'MonthlyClientID');
    }
    
}
