<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1) Staff user
        DB::table('users')->insert([
            'name' => 'Staff User',
            'email' => 'staff@example.com',
            'role' => 'staff',                  // or 'staff'
            'password' => Hash::make('staff@123'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2) Admin user
        DB::table('users')->insert([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role' => 'admin',                  // or 'admin'
            'password' => Hash::make('admin@123'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3) Super Admin (Owner)
        DB::table('users')->insert([
            'name' => 'Super Admin',
            'email' => 'superadmin@example.com',
            'role' => 'Owner',                  // or 'Super Admin' if you prefer
            'password' => Hash::make('superadmin@123'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
