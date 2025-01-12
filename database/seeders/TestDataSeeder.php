<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Owner;           // "owners" table
use App\Models\Admin;           // "admins" table
use App\Models\Staff;           // "staff" table
use App\Models\Branch;          // "branches" table
use App\Models\MembershipPlan;
use App\Models\Member;
use App\Models\Facility;
use App\Models\Payment;

class TestDataSeeder extends Seeder
{
    public function run()
    {
        // 1) Create 2 branches
        $branch1 = Branch::create([
            'BranchName' => 'Contnental Main Branch',
            'Location'   => 'Main Street, City',
        ]);
        $branch2 = Branch::create([
            'BranchName' => 'Contnental Second Branch',
            'Location'   => 'Second Ave, City',
        ]);

        // 2) Create owners in "owners" table
        $owner1 = Owner::create([
            'name'     => 'Juan dela Cruz (Owner)',
            'email'    => 'owner@example.com',
            'password' => Hash::make('owner123'),
        ]);

        // 3) Create admins in "admins" table
        $admin1 = Admin::create([
            'name'     => 'Maria Admin',
            'email'    => 'admin@example.com',
            'password' => Hash::make('admin123'),
        ]);

        // 4) Create staff in "staff" table (three examples)
        //    Adjust "Role" if you want to label them differently.
        $staff1 = Staff::create([
            'FullName'     => 'Pedro Staff (Branch1)',
            'Role'         => 'Staff', 
            'Email'        => 'staff.branch1@example.com',
            'password'     => Hash::make('staff123'),
            'BranchID'     => $branch1->BranchID,
            'Phone'        => '0917-111-1111',
            'DailyRate'    => 800,
            'HourlyRate'   => 100,
            'OvertimeRate' => 150,
            'DateHired'    => now()->subMonths(2),
            'Notes'        => 'Staff assigned to main branch',
        ]);

        $staff2 = Staff::create([
            'FullName'     => 'Juanita Staff (Branch2)',
            'Role'         => 'Staff',
            'Email'        => 'staff.branch2@example.com',
            'password'     => Hash::make('staff123'),
            'BranchID'     => $branch2->BranchID,
            'Phone'        => '0917-222-2222',
            'DailyRate'    => 700,
            'HourlyRate'   => 90,
            'OvertimeRate' => 120,
            'DateHired'    => now()->subMonths(3),
            'Notes'        => 'Staff assigned to second branch',
        ]);

        $staff3 = Staff::create([
            'FullName'     => 'Carlos Staff (Branch2)',
            'Role'         => 'Staff',
            'Email'        => 'staff2.branch2@example.com',
            'password'     => Hash::make('staff123'),
            'BranchID'     => $branch2->BranchID,
            'Phone'        => '0917-333-3333',
            'DailyRate'    => 1000,
            'HourlyRate'   => 120,
            'OvertimeRate' => 150,
            'DateHired'    => now()->subMonth(),
            'Notes'        => 'Another staff at second branch',
        ]);

        // 5) Create membership plans
        $planA = MembershipPlan::create([
            'PlanName' => 'Basic Monthly',
            'Price'    => 1000.00,
            'Duration' => '1 month',
            'Features' => 'Gym Access',
        ]);
        $planB = MembershipPlan::create([
            'PlanName' => 'Premium Annual',
            'Price'    => 10000.00,
            'Duration' => '12 months',
            'Features' => 'Gym + Yoga + 2 PT sessions',
        ]);
        $planC = MembershipPlan::create([
            'PlanName' => 'Quarterly Plan',
            'Price'    => 2500.00,
            'Duration' => '3 months',
            'Features' => 'Gym + 1 free PT session',
        ]);

        // 6) Create members
        $member1 = Member::create([
            'FullName'             => 'John Active',
            'Email'                => 'john.active@example.com',
            'Phone'                => '0917-444-4444',
            'PlanID'               => $planA->PlanID,
            'MembershipCardNumber' => 'CARD-1001',
            'MembershipCardIssued' => true,
            'MembershipStatus'     => 'active',
            'MembershipStartDate'  => now()->subDays(10),
            'MembershipEndDate'    => now()->addDays(20),
            'Biometrics'           => null,
            'FreeSessions'         => 2,
            'Notes'                => 'Joined main branch originally',
            'StartedBranchID'      => $branch1->BranchID,
        ]);

        $member2 = Member::create([
            'FullName'             => 'Jane Expired',
            'Email'                => 'jane.expired@example.com',
            'Phone'                => '0917-555-5555',
            'PlanID'               => $planB->PlanID,
            'MembershipCardNumber' => 'CARD-2002',
            'MembershipCardIssued' => true,
            'MembershipStatus'     => 'expired',
            'MembershipStartDate'  => now()->subMonths(2),
            'MembershipEndDate'    => now()->subDays(1),
            'Biometrics'           => null,
            'FreeSessions'         => 0,
            'Notes'                => 'Expired membership after first month',
            'StartedBranchID'      => $branch2->BranchID,
        ]);

        // 7) Create some facilities for each branch
        $facility1 = Facility::create([
            'Name'         => 'Main Gym Floor',
            'FacilityType' => 'Room',
            'Status'       => 'Available',
            'Capacity'     => 50,
            'Location'     => 'Main Branch, 2nd Floor',
            'Notes'        => 'Open workout space',
            'BranchID'     => $branch1->BranchID,
        ]);

        $facility2 = Facility::create([
            'Name'         => 'Yoga Studio',
            'FacilityType' => 'Room',
            'Status'       => 'Available',
            'Capacity'     => 20,
            'Location'     => 'Main Branch, 3rd Floor',
            'Notes'        => 'Heated yoga studio for classes',
            'BranchID'     => $branch1->BranchID,
        ]);

        $facility3 = Facility::create([
            'Name'         => 'Boxing Ring',
            'FacilityType' => 'Equipment',
            'Status'       => 'Available',
            'Capacity'     => 4,
            'Location'     => '2nd Branch, Ground Floor',
            'Notes'        => 'Boxing ring for training',
            'BranchID'     => $branch2->BranchID,
        ]);

        // 8) Create some Payment records
        Payment::create([
            'MemberID'      => $member1->MemberID,
            'PaymentFor'    => 'Membership',
            'PaymentMethod' => 'Cash',
            'Amount'        => 1000.00,
            'PaymentDate'   => now()->subDays(2),
            'Status'        => 'Completed',
            'BranchID'      => $branch1->BranchID,
        ]);

        Payment::create([
            'MemberID'      => $member1->MemberID,
            'PaymentFor'    => 'Facility',
            'PaymentMethod' => 'GCash',
            'Amount'        => 150.00,
            'PaymentDate'   => now()->subDays(1),
            'Status'        => 'Completed',
            'BranchID'      => $branch1->BranchID,
        ]);

        Payment::create([
            'MemberID'      => $member2->MemberID,
            'PaymentFor'    => 'Membership',
            'PaymentMethod' => 'BPI',
            'Amount'        => 10000.00,
            'PaymentDate'   => now()->subDays(10),
            'Status'        => 'Completed',
            'BranchID'      => $branch2->BranchID,
        ]);

        // Output to console
        $this->command->info('Test data seeded: owners, admins, staff, branches, membership plans, members, facilities, payments.');
    }
}
