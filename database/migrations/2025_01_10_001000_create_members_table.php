<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id('MemberID'); // PK
            
            // Branch reference
            $table->unsignedBigInteger('StartedBranchID')->nullable();
            $table->foreign('StartedBranchID')->references('BranchID')->on('branches');       
            $table->string('FullName');
            $table->string('Email')->unique();
            $table->string('Phone')->nullable();
            $table->unsignedBigInteger('PlanID')->nullable(); 
            $table->foreign('PlanID')->references('PlanID')
                  ->on('membership_plans')
                  ->onDelete('set null');
            $table->string('MembershipCardNumber')->unique()->nullable();
            $table->boolean('MembershipCardIssued')->default(false);
            $table->unsignedBigInteger('MemberStatusID')->default(1);
            $table->foreign('MemberStatusID')
                  ->references('MemberStatusID')
                  ->on('member_statuses');            
            $table->date('MembershipStartDate')->nullable();
            $table->date('MembershipEndDate')->nullable();
            $table->string('Biometrics')->nullable();  
            $table->string('PhotoPath')->nullable();
            $table->unsignedInteger('FreeSessions')->default(0);
            $table->text('Notes')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
