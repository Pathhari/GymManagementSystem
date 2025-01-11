<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Locker extends Model
{
    protected $primaryKey = 'LockerID';

    protected $fillable = [
        'LockerNumber',
        'Status',
        'Notes',
    ];

    public function lockerUsages()
    {
        return $this->hasMany(LockerUsage::class, 'LockerID', 'LockerID');
    }
}
