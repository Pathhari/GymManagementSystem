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
            $lockInEndDateRaw     = $record['LOCK-IN END DATE'] ?? '';
            $membershipStatusRaw  = trim($record['MEMBERSHIP STATUS']) ?? 'ACTIVE';
            $cardsValue           = $record['CARDS'] ?? '';  // ← CARDS column
            $freeSessionRaw       = $record['2 FREE SESSION'] ?? '0';
            $notesCsv             = $record['NOTES'] ?? '';

            // Parse dates
            $startDate   = $this->parseDate($membershipStart);
            $endDate     = $this->parseDate($membershipEnd);
            $lockInEndDt = $this->parseDate($lockInEndDateRaw);

            // Parse CARDS column → boolean
            $membershipCardIssued = $this->parseCardIssued($cardsValue);

            // Convert free session column → integer
            $freeSessions = $this->parseFreeSessions($freeSessionRaw);

            // Combine payment info into the final Notes
            $notes = "Payment Status: {$paymentStatus}, Last Payment Date: {$lastPaymentDate}, "
                   . "Lock-In End Date: {$lockInEndDateRaw}, Additional Notes: {$notesCsv}";

            // Determine or create plan based on RATE
            $plan = $this->getOrCreatePlan($rawRate);

            // Decide the final MemberStatusID
            $memberStatusID = $this->decideMemberStatus($membershipStatusRaw, $lockInEndDt);

            // Insert into members table
            Member::create([
                'StartedBranchID'       => 1, // or parse from CSV if needed
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

    /**
     * Decide the final MemberStatusID based on CSV "MEMBERSHIP STATUS" column
     * and "LOCK-IN END DATE".
     */
    private function decideMemberStatus($statusRaw, $lockInEndDt)
    {
        $trimmedStatus = strtolower(trim($statusRaw));

        // If it's "active"
        if ($trimmedStatus === 'active') {
            // If lockInEndDt is present and is in the future => NEW MEMBER (ID=6)
            if (!empty($lockInEndDt)) {
                $lockInEnd = Carbon::parse($lockInEndDt);
                if ($lockInEnd->isFuture()) {
                    return 6; // "NEW MEMBER" ID
                }
            }
            // Otherwise => normal "ACTIVE" => ID=1
            return 1;
        }

        // Else do the normal approach => use getOrCreateMemberStatus
        return $this->getOrCreateMemberStatus($trimmedStatus);
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

    /**
     * Maps CARDS column to a boolean:
     *  - "HAND IN" or "TRUE" => true
     *  - blank or "FALSE"    => false
     */
    private function parseCardIssued($value)
    {
        $val = strtolower(trim($value));
        // Any of these exact matches should yield true
        $trueValues = ['hand in', 'true'];

        return in_array($val, $trueValues);
    }

    private function parseFreeSessions($value)
    {
        return is_numeric($value) ? (int)$value : 0;
    }

    /**
     * Create or retrieve a membership plan based on the RATE column
     */
    private function getOrCreatePlan($rateValue)
    {
        $rateTrimmed = strtoupper(trim($rateValue));
        if ($rateTrimmed === 'FREE') {
            $price = 0;
            $planName = 'Free Plan';
        } else {
            // Convert to float
            $price = (float) $rateValue;
            if ($price === 1599.0) {
                $planName = 'Discounted Plan';
            } elseif ($price === 1999.0) {
                $planName = 'Regular Plan';
            } else {
                $planName = 'Plan ' . $rateValue;
            }
        }

        // For example: 30-day membership, 3-month lockIn
        return MembershipPlan::firstOrCreate(
            ['Price' => $price],
            [
                'PlanName'     => $planName,
                'Duration'     => 30,
                'LockInMonths' => 3,
                'BillingMode'  => 'monthly',
            ]
        );
    }

    /**
     * Attempt to find or create a membership status row.
     */
    private function getOrCreateMemberStatus($statusName)
    {
        if (empty($statusName)) {
            return 1; // default to ACTIVE if empty
        }

        $existing = MemberStatus::whereRaw('LOWER(StatusName) = ?', [$statusName])->first();
        if ($existing) {
            return $existing->MemberStatusID;
        }

        $newStatus = MemberStatus::create(['StatusName' => strtoupper($statusName)]);
        return $newStatus->MemberStatusID;
    }
}
