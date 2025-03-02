<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $table = 'payments';
    protected $primaryKey = 'PaymentID';

    protected $fillable = [
        'BranchID',
        'MemberID',
        'WalkInName',
        'BookingRef',
        'SessionRef',
        'MonthlyClientID',
        'PaymentFor',      
        'PaymentMethod',
        'Amount',
        'PaymentDate',
        'Status',
        'FailureReason',
    ];

    protected $casts = [
        'PaymentFor' => 'array', // Eloquent auto-converts JSON <-> array
    ];
    
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'BranchID', 'BranchID');
    }

    public function member()
    {
        return $this->belongsTo(Member::class, 'MemberID', 'MemberID');
    }

    // many-to-many with invoices
    public function invoices()
    {
        return $this->belongsToMany(Invoice::class, 'PaymentInvoices', 'PaymentID', 'InvoiceID')
                    ->withPivot('AmountAllocated')
                    ->withTimestamps();
    }

    public function monthlyClient()
    {
        return $this->belongsTo(MonthlyClient::class, 'MonthlyClientID');
    }

}
