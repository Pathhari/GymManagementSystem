<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Add your newly created seeders
        $this->call([
            OwnerSeeder::class,
            AdminSeeder::class,
            StaffSeeder::class,
        ]);
    }
}
