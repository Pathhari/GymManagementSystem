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
        Schema::create('dailycashflow', function (Blueprint $table) {
            $table->id('CashFlowID');
            $table->unsignedBigInteger('BranchID')->nullable(); 
            $table->foreign('BranchID')->references('BranchID')->on('branches');
            $table->date('Date');
            $table->string('BusinessType')->default('Gym'); // or "Cafe", "Yogurt Cafe"
        
            // Existing columns
            $table->decimal('CashSales', 10, 2)->default(0);
            $table->decimal('GCashSales', 10, 2)->default(0);
            $table->decimal('BPISales', 10, 2)->default(0);
            $table->decimal('WalkInCashSales', 10, 2)->default(0);
            $table->decimal('WalkInGCashSales', 10, 2)->default(0);
            $table->decimal('WalkInBPISales', 10, 2)->default(0);
        
            // NEW: BDO columns
            $table->decimal('BDOSales', 10, 2)->default(0);
            $table->decimal('WalkInBDOSales', 10, 2)->default(0);
        
            $table->decimal('TotalSales', 10, 2)->default(0);
        
            // If you have petty cash / deposited columns, keep them here:
            $table->decimal('PettyCash', 10, 2)->default(0);
            $table->decimal('DepositedAmount', 10, 2)->default(0);
        
            $table->text('Remarks')->nullable();
        
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
