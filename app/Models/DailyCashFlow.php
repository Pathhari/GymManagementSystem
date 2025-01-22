<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyCashFlow extends Model
{
    protected $table = 'dailycashflow'; // Or 'dailycashflow' if that's your name
    protected $primaryKey = 'CashFlowID'; // If that's your PK

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
        'PettyCash',
        'DepositedAmount',
        'Remarks',
        'BranchID', // <--- new column
    ];

    // Relationship: This daily cash flow record belongs to one branch
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'BranchID', 'BranchID');
    }
}
