<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMembersTable extends Migration
{
    public function up()
    {
        Schema::create('members', function (Blueprint $table) {
            $table->bigIncrements('MemberID');
            $table->string('FullName');
            $table->string('Email')->nullable();
            $table->string('Phone')->nullable();
            $table->unsignedBigInteger('PlanID')->nullable();
            $table->string('MembershipCardNumber')->nullable();
            $table->boolean('MembershipCardIssued')->default(false);
            $table->date('MembershipStartDate')->nullable();
            $table->date('MembershipEndDate')->nullable();
            $table->string('Biometrics')->nullable();
            $table->string('PhotoPath')->nullable();
            $table->integer('FreeSessions')->default(0);
            $table->text('Notes')->nullable();
            // Keep the existing StartedBranchID that references the branch
            $table->unsignedBigInteger('StartedBranchID');
            // Optional: include BranchID if you wish to store a separate or updated branch value
            $table->unsignedBigInteger('BranchID')->nullable();
            $table->unsignedBigInteger('MemberStatusID')->nullable();
            $table->timestamps();

            // Foreign key: StartedBranchID references Branches table (BranchID)
            $table->foreign('StartedBranchID')
                  ->references('BranchID')
                  ->on('branches')
                  ->onDelete('cascade');

            // Optional foreign key: BranchID references Branches table (BranchID)
            $table->foreign('BranchID')
                  ->references('BranchID')
                  ->on('branches')
                  ->onDelete('set null');

            // Optionally, add foreign keys for PlanID and MemberStatusID if your tables exist:
            // $table->foreign('PlanID')->references('PlanID')->on('membership_plans')->onDelete('set null');
            // $table->foreign('MemberStatusID')->references('MemberStatusID')->on('member_statuses')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('members');
    }
}
