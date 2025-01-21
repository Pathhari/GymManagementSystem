<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Owner;  
use App\Models\Admin;  
use App\Models\Staff;  
use App\Models\Branch; 
use App\Models\MembershipPlan;
use App\Models\Member;
use App\Models\Facility;
use App\Models\Payment;

// Import the MemberStatusSeeder from the same namespace
use Database\Seeders\MemberStatusSeeder;

class TestDataSeeder extends Seeder
{
    public function run()
    {
        // 1) Call the MemberStatusSeeder 
        $this->call(MemberStatusSeeder::class);

        // 2) Then your branches, owners, admins, etc.
        $branch1 = Branch::create([
            'BranchName' => 'Contnental Main Branch',
            'Location'   => 'Main Street, City',
        ]);

        $branch2 = Branch::create([
            'BranchName' => 'Contnental Second Branch',
            'Location'   => 'Second Ave, City',
        ]);

        $owner1 = Owner::create([
            'name'     => 'Juan dela Cruz (Owner)',
            'email'    => 'owner@example.com',
            'password' => Hash::make('owner123'),
        ]);

        $admin1 = Admin::create([
            'name'     => 'Maria Admin',
            'email'    => 'admin@example.com',
            'password' => Hash::make('admin123'),
        ]);
        MembershipPlan::create([
            'PlanName'     => 'New Member 3-month Lock-In',
            'Price'        => 2000,          // total or monthly price
            'Duration'     => 90,            // or store a placeholder if you still use Duration
            'LockInMonths' => 3,
            'BillingMode'  => 'half-month',
        ]);

        MembershipPlan::create([
            'PlanName'     => 'Regular Plan (Post-LockIn)',
            'Price'        => 2000,    // monthly fee
            'Duration'     => 30,      // 30 days
            'LockInMonths' => null,    // no lock-in
            'BillingMode'  => null,
        ]);

        $this->command->info('Test data seeded: member statuses, owners, admins, branches, etc.');
    }
}
