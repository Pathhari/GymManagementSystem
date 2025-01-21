<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $table = 'invoices';
    protected $primaryKey = 'InvoiceID';

    protected $fillable = [
        'MemberID',
        'PromotionID',
        'InvoiceDate',
        'InvoiceTotal',
        'BranchID', // <--- new column
    ];
    
    public function member()
    {
        return $this->belongsTo(Member::class, 'MemberID', 'MemberID');
    }

    public function promotion()
    {
        return $this->belongsTo(Promotions::class, 'PromotionID', 'PromotionID');
    }

    public function lineItems()
    {
        return $this->hasMany(InvoiceLineItem::class, 'InvoiceID', 'InvoiceID');
    }

    public function payments()
    {
        // Many-to-many bridging table PaymentInvoice
        return $this->belongsToMany(Payment::class, 'payment_invoice', 'InvoiceID', 'PaymentID')
                    ->withPivot('AmountAllocated')
                    ->withTimestamps();
    }

    public function branch()
{
    return $this->belongsTo(Branch::class, 'BranchID', 'BranchID');
}

public function invoice_line_items()
{
    return $this->hasMany(InvoiceLineItem::class, 'InvoiceID', 'InvoiceID');
}

}
