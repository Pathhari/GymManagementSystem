<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promotions extends Model
{
    protected $primaryKey = 'PromotionID';

    protected $fillable = [
        'Name',
        'DiscountType',
        'DiscountValue',
        'StartDate',
        'EndDate',
        'TermsAndConditions',
        'Status',
    ];

    // If an invoice references a single promotion
    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'PromotionID', 'PromotionID');
    }
}
