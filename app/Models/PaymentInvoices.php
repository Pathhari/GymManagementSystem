<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentInvoices extends Model
{
    protected $table = 'PaymentInvoices';
    
    protected $primaryKey = 'PaymentInvoiceID';

    protected $fillable = [
        'PaymentID',
        'InvoiceID',
        'AmountAllocated',
    ];

    // Typically, you won't define big relationships here, 
    // since you handle many-to-many via belongsToMany in Payment or Invoice.
    
    public function payment()
    {
        return $this->belongsTo(Payment::class, 'PaymentID', 'PaymentID');
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'InvoiceID', 'InvoiceID');
    }
}
