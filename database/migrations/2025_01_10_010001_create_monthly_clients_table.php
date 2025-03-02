<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMonthlyClientsTable extends Migration
{
    public function up()
    {
        Schema::create('monthly_clients', function (Blueprint $table) {
            $table->bigIncrements('MonthlyClientID');
            $table->unsignedBigInteger('BranchID')->nullable(); 
            $table->string('FullName');
            $table->string('Email')->unique();
            $table->string('Phone')->nullable();
            $table->date('StartDate')->nullable(); // The start of their monthly subscription
            $table->date('EndDate')->nullable();   // The end of their monthly subscription
            $table->boolean('IsActive')->default(true); 
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('monthly_clients');
    }
}
