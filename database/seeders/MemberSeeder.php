<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use League\Csv\Reader;
use Carbon\Carbon;
// Models
use App\Models\Member;
use App\Models\MembershipPlan;

class MemberSeeder extends Seeder
{
    public function run()
    {
        // 1. Load CSV
        $csvPath = storage_path('app/private/members.csv');
        $csv = Reader::createFromPath($csvPath, 'r');
        $csv->setHeaderOffset(0); // First row = header

        // 2. Loop through each CSV row
        foreach ($csv as $record) {
            // Extract fields from CSV
            $membershipCardNumber = $record['NO'];
            $fullName            = $record['NAME'];
            $rawRate             = $record['RATE']; // "1599", "1799", "FREE", etc.
            $signUpDate          = Carbon::parse($record['SIGN UP DATE'])->format('Y-m-d');
            $phone               = $record['PHONE NUMBER'];
            $email               = $record['EMAIL'];

            // Determine plan price & plan name
            if ($rawRate === 'FREE') {
                $price = 0;
                $planName = 'Free Plan';
            } else {
                $price = (float)$rawRate;
                $planName = 'Imported Plan '.$rawRate;
            }

            // 3. Create or fetch the plan (always 30 days duration)
            $plan = MembershipPlan::firstOrCreate(
                ['Price' => $price],
                [
                    'PlanName' => $planName,
                    'Duration' => 30, // fixed 30 days
                ]
            );

            // 4. Create the member (MembershipEndDate = null)
            Member::create([
                'StartedBranchID'       => 1, // default branch
                'FullName'              => $fullName,
                'Email'                 => $email,
                'Phone'                 => $phone,
                'PlanID'                => $plan->PlanID,
                'MembershipCardNumber'  => $membershipCardNumber,
                'MembershipCardIssued'  => false,
                'MemberStatusID'        => 1,  // Active by default
                'MembershipStartDate'   => $signUpDate,
                'MembershipEndDate'     => null, // employees will set later
                'FreeSessions'          => 0,
                'Notes'                 => "Imported rate: {$rawRate}",
            ]);
        }
    }
}
