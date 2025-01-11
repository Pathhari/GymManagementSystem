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
        Schema::create('walk_ins', function (Blueprint $table) {
            $table->id('WalkInID');
            $table->string('FullName')->nullable();
            $table->dateTime('VisitDate')->nullable();
            $table->string('PaymentMethod')->nullable();
            $table->decimal('AmountPaid', 10, 2)->default(0);
            $table->string('PaymentStatus')->default('Pending'); // "Completed", "Pending", "Failed"
            $table->text('Notes')->nullable();
        
            $table->timestamps();
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('walk_ins');
    }
};
