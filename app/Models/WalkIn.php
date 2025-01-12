<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WalkIn extends Model
{
    protected $table = 'walk_in';  // Or "walk_ins" if that's your name
    protected $primaryKey = 'WalkInID';

    protected $fillable = [
        'FullName',
        'VisitDate',
        'PaymentMethod',
        'AmountPaid',
        'PaymentStatus',
        'Notes',
        'BranchID', // <--- new column
    ];

    // Relationship: This walk-in record belongs to a branch
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'BranchID', 'BranchID');
    }
}
