<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MemberStatus;

class MemberStatusSeeder extends Seeder
{
    public function run()
    {
        // Example statuses with their primary keys
        MemberStatus::create([
            'MemberStatusID' => 1,
            'StatusName'     => 'Active'
        ]);

        MemberStatus::create([
            'MemberStatusID' => 2,
            'StatusName'     => 'Frozen'
        ]);

        MemberStatus::create([
            'MemberStatusID' => 3,
            'StatusName'     => 'Banned'
        ]);

        MemberStatus::create([
            'MemberStatusID' => 4,
            'StatusName'     => 'Expired'
        ]);

        // Most important for your lock-in code:
        MemberStatus::create([
            'MemberStatusID' => 5,
            'StatusName'     => 'Lock-In'
        ]);
    }
}
