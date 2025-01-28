<?php

// database/migrations/2023_XX_XX_add_branch_to_coaching_sessions_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddBranchToCoachingSessionsTable extends Migration
{
    public function up()
    {
        Schema::table('coaching_sessions', function (Blueprint $table) {
            // Or if you have a separate branches table and want a foreign key:
            $table->unsignedBigInteger('BranchID')->nullable()->after('SessionType');
            $table->foreign('BranchID')->references('BranchID')->on('branches')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('coaching_sessions', function (Blueprint $table) {
            $table->dropForeign(['BranchID']); $table->dropColumn('BranchID');
        });
    }
}
