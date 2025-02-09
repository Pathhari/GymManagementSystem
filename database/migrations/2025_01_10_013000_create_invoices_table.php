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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id('InvoiceID');
            $table->unsignedBigInteger('BranchID')->nullable(); 
            $table->foreign('BranchID')->references('BranchID')->on('branches');
            $table->unsignedBigInteger('MemberID')->nullable();
            $table->unsignedBigInteger('PromotionID')->nullable();
            $table->dateTime('InvoiceDate')->nullable();
            $table->date('DueDate')->nullable();
            $table->decimal('InvoiceTotal', 10, 2)->default(0);
        
            $table->timestamps();
        
            $table->foreign('MemberID')->references('MemberID')->on('members')->onDelete('set null');
            $table->foreign('PromotionID')->references('PromotionID')->on('Promotions')->onDelete('set null');
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
