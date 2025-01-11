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
        Schema::create('coaching_sessions', function (Blueprint $table) {
            $table->id('SessionID');
            $table->string('SessionName');
            $table->string('SessionType')->nullable(); // "group class" or "personal training"
            $table->unsignedBigInteger('CoachID');
            $table->time('StartTime')->nullable();
            $table->time('EndTime')->nullable();
            $table->unsignedInteger('Capacity')->default(1);
            $table->string('Location')->nullable();
            $table->decimal('Fee', 10, 2)->nullable();
        
            $table->timestamps();
        
            $table->foreign('CoachID')->references('CoachID')->on('coaches')->onDelete('cascade');
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coaching_sessions');
    }
};
