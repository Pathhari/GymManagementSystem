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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id('BookingID');
            $table->unsignedBigInteger('BranchID')->nullable(); 
            $table->foreign('BranchID')->references('BranchID')->on('branches');
            $table->unsignedBigInteger('MemberID')->nullable()->change();
            $table->foreign('MemberID')
                  ->references('MemberID')->on('members')
                  ->onDelete('cascade');
            $table->string('GuestName')->nullable();
            $table->string('GuestEmail')->nullable();           
            $table->unsignedBigInteger('FacilityID');
            $table->unsignedBigInteger('PaymentID')->nullable();
            $table->date('BookingDate');
            $table->time('BookingTime');
            $table->integer('Duration')->nullable();
        
            $table->timestamps();
        
            $table->foreign('MemberID')->references('MemberID')->on('members')->onDelete('cascade');
            $table->foreign('FacilityID')->references('FacilityID')->on('facilities')->onDelete('cascade');
            $table->foreign('PaymentID')->references('PaymentID')->on('payments')->onDelete('set null');
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
