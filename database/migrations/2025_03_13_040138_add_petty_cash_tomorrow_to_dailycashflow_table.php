<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPettyCashTomorrowToDailycashflowTable extends Migration
{
    public function up()
    {
        Schema::table('dailycashflow', function (Blueprint $table) {
            $table->decimal('PettyCashTomorrow', 10, 2)->default(0)->after('PettyCash');
        });
    }

    public function down()
    {
        Schema::table('dailycashflow', function (Blueprint $table) {
            $table->dropColumn('PettyCashTomorrow');
        });
    }
}
