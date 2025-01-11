<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $primaryKey = 'PaymentID';

    protected $fillable = [
        'MemberID',
        'PaymentFor',
        'PaymentMethod',
        'Amount',
        'PaymentDate',
        'Status',
        'FailureReason',
    ];

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
