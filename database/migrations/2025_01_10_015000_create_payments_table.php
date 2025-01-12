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
        Schema::create('payments', function (Blueprint $table) {
            $table->id('PaymentID');
            $table->unsignedBigInteger('BranchID')->nullable(); 
            $table->foreign('BranchID')->references('BranchID')->on('branches');
            $table->unsignedBigInteger('MemberID')->nullable();  // if walk-ins, might be null
            $table->string('PaymentFor')->nullable();            // "Membership", "Session", "Facility", etc.
            $table->string('PaymentMethod')->nullable();         // "Cash", "GCash", "BPI"
            $table->decimal('Amount', 10, 2);
            $table->dateTime('PaymentDate')->nullable();
            $table->string('Status')->default('Pending');        // "Completed", "Pending", "Failed"
            $table->string('FailureReason')->nullable();
        
            $table->timestamps();
        
            $table->foreign('MemberID')->references('MemberID')->on('members')->onDelete('set null');
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
