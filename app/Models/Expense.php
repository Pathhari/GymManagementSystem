<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $primaryKey = 'ExpenseID';

    protected $fillable = [
        'ExpenseDate',
        'ExpenseCategory',
        'Amount',
        'PaymentMethod',
        'StaffID',
        'Notes',
    ];

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'StaffID', 'StaffID');
    }
}
