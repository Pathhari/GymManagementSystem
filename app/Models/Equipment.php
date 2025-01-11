<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    protected $primaryKey = 'EquipmentID';

    protected $fillable = [
        'Name',
        'SerialNumber',
        'Status',
        'LastMaintenanceDate',
        'Notes',
    ];

    public function maintenanceLogs()
    {
        return $this->hasMany(MaintenanceLog::class, 'EquipmentID', 'EquipmentID');
    }
}
