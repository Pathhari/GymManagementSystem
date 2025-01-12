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
        Schema::create('staff', function (Blueprint $table) {
            $table->id('StaffID');
            $table->string('FullName');
            $table->string('Role')->default('Staff'); 
            $table->string('Email')->unique()->nullable();
            $table->string('password')->nullable();
            $table->rememberToken()->nullable();
            $table->string('Phone')->nullable();
            $table->decimal('DailyRate', 10, 2)->nullable();
            $table->decimal('HourlyRate', 10, 2)->nullable();
            $table->decimal('OvertimeRate', 10, 2)->nullable();
            $table->date('DateHired')->nullable();
            $table->text('Notes')->nullable();
        
            $table->timestamps();
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};
