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
        Schema::create('members', function (Blueprint $table) {
            $table->id('MemberID');                 // PK
            $table->string('FullName');
            $table->string('Email')->unique();
            $table->string('Phone')->nullable();
            $table->unsignedBigInteger('PlanID')->nullable(); 
            $table->string('MembershipCardNumber')->unique()->nullable();
            $table->boolean('MembershipCardIssued')->default(false);
            $table->string('MembershipStatus')->default('active'); // or enum
            $table->date('MembershipStartDate')->nullable();
            $table->date('MembershipEndDate')->nullable();
            $table->string('Biometrics')->nullable();             // or text if large
            $table->unsignedInteger('FreeSessions')->default(0);
            $table->text('Notes')->nullable();
        
            $table->timestamps();
        
            // Foreign key to membership plans
            $table->foreign('PlanID')->references('PlanID')->on('membership_plans')->onDelete('set null');
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
