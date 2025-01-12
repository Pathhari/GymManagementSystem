<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $table = 'payments';
    protected $primaryKey = 'PaymentID';

    protected $fillable = [
        'MemberID',
        'PaymentFor',
        'PaymentMethod',
        'Amount',
        'PaymentDate',
        'Status',
        'FailureReason',
        'BranchID', // <--- new column
    ];

    // Relationship: Payment belongs to a branch (which processed it)
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'BranchID', 'BranchID');
    }

    // If you want a relationship to the Member who paid:
    public function member()
    {
        return $this->belongsTo(Member::class, 'MemberID', 'MemberID');
    }
    // If using bridging table PaymentInvoice
    public function invoices()
    {
        return $this->belongsToMany(Invoice::class, 'payment_invoice', 'PaymentID', 'InvoiceID')
                    ->withPivot('AmountAllocated')
                    ->withTimestamps();
    }
}
