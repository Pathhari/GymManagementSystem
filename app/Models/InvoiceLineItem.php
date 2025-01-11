<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceLineItem extends Model
{
    protected $primaryKey = 'LineItemID';

    protected $fillable = [
        'InvoiceID',
        'ItemType',
        'ItemID',
        'Description',
        'Quantity',
        'UnitPrice',
        'Subtotal',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'InvoiceID', 'InvoiceID');
    }
}
