<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyCashFlow extends Model
{
    protected $primaryKey = 'CashFlowID';

    protected $fillable = [
        'Date',
        'BusinessType',
        'CashSales',
        'GCashSales',
        'BPISales',
        'WalkInCashSales',
        'WalkInGCashSales',
        'WalkInBPISales',
        'TotalSales',
    ];
}
