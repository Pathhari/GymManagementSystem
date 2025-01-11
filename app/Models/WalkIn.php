<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WalkIn extends Model
{
    protected $primaryKey = 'WalkInID';

    protected $fillable = [
        'FullName',
        'VisitDate',
        'PaymentMethod',
        'AmountPaid',
        'PaymentStatus',
        'Notes',
    ];
}
