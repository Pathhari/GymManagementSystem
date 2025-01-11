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
        Schema::create('facilities', function (Blueprint $table) {
            $table->id('FacilityID');
            $table->string('Name');
            $table->string('FacilityType')->nullable(); // "Room", "Court", "Equipment"
            $table->string('Status')->default('Available'); // "Available", "UnderMaintenance"
            $table->unsignedInteger('Capacity')->nullable();
            $table->string('Location')->nullable();
            $table->text('Notes')->nullable();
        
            $table->timestamps();
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facilities');
    }
};
