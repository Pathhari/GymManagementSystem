<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use League\Csv\Reader;
use Carbon\Carbon;
// Models
use App\Models\Member;
use App\Models\MembershipPlan;
use App\Models\MemberStatus;

class MemberSeeder extends Seeder
{
    public function run()
    {
        // Path to your CSV file
        $csvPath = storage_path('app/private/members.csv');

        // Create CSV reader
        $csv = Reader::createFromPath($csvPath, 'r');
        $csv->setHeaderOffset(0); // first row as header

        foreach ($csv as $record) {
            // Extract fields (match exact CSV header names)
            $membershipCardNumber = $record['NO'] ?? null;
            $fullName             = $record['NAME'] ?? null;
            $rawRate              = $record['RATE'] ?? null;
            $membershipStart      = $record['MEMBERSHIP START'] ?? '';
            $phone                = $record['PHONE NUMBER'] ?? null;
            $email                = $record['EMAIL'] ?? null;
            $membershipEnd        = $record['MEMBERSHIP END'] ?? '';
            $paymentStatus        = $record['PAYMENT STATUS'] ?? '';
            $lastPaymentDate      = $record['LAST PAYMENT DATE'] ?? '';
            $lockInEndDate        = $record['LOCK-IN END DATE'] ?? '';
            $membershipStatusRaw = trim($record['MEMBERSHIP STATUS ']) ?? 'ACTIVE';
            $memberStatusID = $this->getOrCreateMemberStatus($membershipStatusRaw);           
            $cardsValue           = $record['CARDS'] ?? '';
            $freeSessionRaw       = $record['2 FREE SESSION'] ?? '0';
            $notesCsv             = $record['NOTES'] ?? '';

            // Parse dates
            $startDate = $this->parseDate($membershipStart);
            $endDate   = $this->parseDate($membershipEnd);

            // Parse CARDS column → boolean
            $membershipCardIssued = $this->parseCardIssued($cardsValue);

            // Convert free session column → integer
            $freeSessions = $this->parseFreeSessions($freeSessionRaw);

            // Combine payment info into the final Notes
            // (You can add Lock-In End Date or any other fields as needed)
            $notes = "Payment Status: {$paymentStatus}, Last Payment Date: {$lastPaymentDate}, "
                   . "Lock-In End Date: {$lockInEndDate}, Additional Notes: {$notesCsv}";

            // Determine or create plan based on RATE
            $plan = $this->getOrCreatePlan($rawRate);

            // Find/create membership status
            $memberStatusID = $this->getOrCreateMemberStatus($membershipStatusRaw);

            // Insert into members table
            Member::create([
                'StartedBranchID'       => 1,
                'FullName'              => $fullName,
                'Email'                 => $email,
                'Phone'                 => $phone,
                'PlanID'                => $plan->PlanID,
                'MembershipCardNumber'  => $membershipCardNumber,
                'MembershipCardIssued'  => $membershipCardIssued,
                'MemberStatusID'        => $memberStatusID,
                'MembershipStartDate'   => $startDate,
                'MembershipEndDate'     => $endDate ?: null,
                'FreeSessions'          => $freeSessions,
                'Notes'                 => $notes,
            ]);
        }
    }

    private function parseDate($dateString)
    {
        if (empty($dateString)) {
            return null;
        }
        try {
            return Carbon::parse($dateString)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    private function parseCardIssued($value)
    {
        $val = strtolower(trim($value));
        return ($val === 'hand in' || $val === 'true');
    }

    private function parseFreeSessions($value)
    {
        return is_numeric($value) ? (int)$value : 0;
    }

    /**
     * Create or retrieve a membership plan based on RATE:
     * - "FREE" → Free Plan (price=0)
     * - "1599" → Discounted Plan
     * - "1999" → Regular Plan
     * Otherwise → "Imported Plan {rate}"
     */
    private function getOrCreatePlan($rateValue)
    {
        if (strtoupper(trim($rateValue)) === 'FREE') {
            $price    = 0;
            $planName = 'Free Plan';
        } else {
            $price = (float) $rateValue;
            if ($price === 1599.0) {
                $planName = 'Discounted Plan';
            } elseif ($price === 1999.0) {
                $planName = 'Regular Plan';
            } else {
                $planName = 'Imported Plan ' . $rateValue;
            }
        }

        // Example: 90-day lock-in, monthly billing
        return MembershipPlan::firstOrCreate(
            ['Price' => $price],
            [
                'PlanName'     => $planName,
                'Duration'     => 90,
                'LockInMonths' => 3,
                'BillingMode'  => 'monthly',
            ]
        );
    }

    /**
     * Find or create the membership status. If the CSV has an exact match
     * for 'ACTIVE', 'FROZEN', 'ON-HOLD', 'TERMINATED', or 'EXPIRED', it reuses
     * that. Otherwise, it creates a new row.
     */
    private function getOrCreateMemberStatus($statusName)
    {
        // If empty, default to ACTIVE
        if (empty($statusName)) {
            return 1;
        }
        // Trim and convert to lowercase for comparison
        $status = strtolower(trim($statusName));
        
        // Use a case-insensitive query
        $existing = MemberStatus::whereRaw('LOWER(StatusName) = ?', [$status])->first();
        if ($existing) {
            return $existing->MemberStatusID;
        }
        // If not found, create new with uppercase (or your desired format)
        $newStatus = MemberStatus::create(['StatusName' => strtoupper($status)]);
        return $newStatus->MemberStatusID;
    }
    
}
