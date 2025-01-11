<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $primaryKey = 'ProductID';

    protected $fillable = [
        'ProductName',
        'Category',
        'StockLevel',
        'ReorderLevel',
        'UnitOfMeasure',
        'Cost',
        'Price',
        'Notes',
    ];

    public function inventoryLogs()
    {
        return $this->hasMany(ProductInventoryLog::class, 'ProductID', 'ProductID');
    }
}
