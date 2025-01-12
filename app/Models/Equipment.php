<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    protected $table = 'equipment';
    protected $primaryKey = 'EquipmentID';

    protected $fillable = [
        'Name',
        'SerialNumber',
        'Status',
        'LastMaintenanceDate',
        'Notes',
        'BranchID', // <--- new column
    ];
    
    public function maintenanceLogs()
    {
        return $this->hasMany(MaintenanceLog::class, 'EquipmentID', 'EquipmentID');
    }

    public function branch()
{
    return $this->belongsTo(Branch::class, 'BranchID', 'BranchID');
}

}
