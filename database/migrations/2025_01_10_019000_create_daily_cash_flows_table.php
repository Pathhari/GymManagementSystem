<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('daily_cash_flows', function (Blueprint $table) {
            $table->id('CashFlowID');
            $table->unsignedBigInteger('BranchID')->nullable(); 
            $table->foreign('BranchID')->references('BranchID')->on('branches');
            $table->date('Date');
            $table->string('BusinessType')->default('Gym'); // or "Cafe", "Yogurt Cafe"
            $table->decimal('CashSales', 10, 2)->default(0);
            $table->decimal('GCashSales', 10, 2)->default(0);
            $table->decimal('BPISales', 10, 2)->default(0);
            $table->decimal('WalkInCashSales', 10, 2)->default(0);
            $table->decimal('WalkInGCashSales', 10, 2)->default(0);
            $table->decimal('WalkInBPISales', 10, 2)->default(0);
            $table->decimal('TotalSales', 10, 2)->default(0);
        
            $table->timestamps();
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_cash_flows');
    }
};
