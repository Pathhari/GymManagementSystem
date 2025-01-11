<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaintenanceLog extends Model
{
    protected $primaryKey = 'MaintenanceID';

    protected $fillable = [
        'EquipmentID',
        'MaintenanceDate',
        'IssueDescription',
        'Resolution',
        'MaintainedBy',
        'NextMaintenanceDate',
        'Notes',
    ];

    public function equipment()
    {
        return $this->belongsTo(Equipment::class, 'EquipmentID', 'EquipmentID');
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'MaintainedBy', 'StaffID');
    }
}
