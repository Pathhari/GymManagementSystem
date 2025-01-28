<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use Faker\Factory as Faker;

// Models (adjust these as needed)
use App\Models\Branch;
use App\Models\Owner;
use App\Models\Admin;
use App\Models\Staff;
use App\Models\MembershipPlan;
use App\Models\Member;
use App\Models\MembershipRenewal;
use App\Models\MembershipFreeze;
use App\Models\MembershipChangeLog;
use App\Models\MemberVisit;
use App\Models\StaffSchedule;
use App\Models\StaffTask;
use App\Models\Payroll;
use App\Models\Attendance;
use App\Models\Bonus;
use App\Models\Promotions;
use App\Models\Invoice;
use App\Models\InvoiceLineItem;
use App\Models\Payment;
use App\Models\PaymentInvoice;
use App\Models\Facility;
use App\Models\Booking;
use App\Models\DailyCashFlow;
use App\Models\WalkIn;
use App\Models\Equipment;
use App\Models\MaintenanceLog;
use App\Models\Coach;
use App\Models\CoachingSession;
use App\Models\SessionBooking;
use App\Models\SessionWaitlist;
use App\Models\SessionAttendance;
use App\Models\Locker;
use App\Models\LockerUsage;
use App\Models\SystemLog;
use App\Models\Product;
use App\Models\ProductInventoryLog;
use App\Models\Notification;
use App\Models\NotificationTemplate;
use App\Models\Expense;

use Database\Seeders\MemberStatusSeeder;

class TestDataSeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create();

        // Seed member statuses first.
        $this->call(MemberStatusSeeder::class);

        // 1) Branches
        $branches = [];
        for ($i = 1; $i <= 2; $i++) {
            $branches[] = Branch::create([
                'BranchName' => "Contnental Branch $i",
                'Location'   => $faker->streetAddress,
            ]);
        }

        // 2) Owners and Admins
        Owner::create([
            'name'     => 'Juan dela Cruz (Owner)',
            'email'    => 'owner@example.com',
            'password' => Hash::make('owner123'),
        ]);
        Admin::create([
            'name'     => 'Maria Admin',
            'email'    => 'admin@example.com',
            'password' => Hash::make('admin123'),
        ]);

        // 3) Membership Plans
        $planLockIn = MembershipPlan::create([
            'PlanName'     => 'Lock-In (3 months)',
            'Price'        => 2000,
            'Duration'     => 90,
            'LockInMonths' => 3,
            'BillingMode'  => 'half-month',
        ]);
        $planMonthly = MembershipPlan::create([
            'PlanName'     => 'Regular Monthly',
            'Price'        => 1500,
            'Duration'     => 30,
            'LockInMonths' => null,
            'BillingMode'  => null,
        ]);
        $membershipPlans = [$planLockIn, $planMonthly];

        // 4) Staff
        $staffList = [];
        for ($i = 1; $i <= 5; $i++) {
            $branchPick = $faker->randomElement($branches);
            $staff = Staff::create([
                'FullName'   => $faker->name,
                'Role'       => $faker->randomElement(['Front Desk', 'Coach Assistant', 'Staff']),
                'Email'      => $faker->unique()->safeEmail,
                'password'   => Hash::make('staff123'),
                'Phone'      => $faker->phoneNumber,
                'DailyRate'  => $faker->randomFloat(2, 400, 600),
                'HourlyRate' => $faker->randomFloat(2, 60, 100),
                'DateHired'  => $faker->date(),
                'Notes'      => $faker->sentence,
            ]);
            // Attach to pivot
            $branchPick->staff()->attach($staff->StaffID);
            $staffList[] = $staff;
        }

        // 5) Members
        $members = [];
        for ($m = 1; $m <= 10; $m++) {
            $branchPick = $faker->randomElement($branches);
            $planPick   = $faker->randomElement($membershipPlans);
            $startDate  = $faker->dateTimeBetween('-30 days', 'now');
            $endDate    = (clone $startDate)->modify("+{$planPick->Duration} days");

            $members[] = Member::create([
                'StartedBranchID'      => $branchPick->BranchID,
                'FullName'             => $faker->name,
                'Email'                => $faker->unique()->safeEmail,
                'Phone'                => $faker->phoneNumber,
                'PlanID'               => $planPick->PlanID,
                'MembershipCardNumber' => 'CARD-' . $faker->unique()->numerify('###'),
                'MembershipCardIssued' => $faker->boolean(70),
                'MemberStatusID'       => 1, // "Active"
                'MembershipStartDate'  => $startDate,
                'MembershipEndDate'    => $endDate,
                'FreeSessions'         => $faker->numberBetween(0, 5),
                'Notes'                => $faker->sentence,
            ]);
        }

        // 6) Membership Renewals
        foreach ($members as $member) {
            if ($faker->boolean(50)) {
                MembershipRenewal::create([
                    'MemberID'      => $member->MemberID,
                    'RenewalDate'   => $faker->dateTimeBetween('-15 days', 'now'),
                    'PlanID'        => $faker->randomElement($membershipPlans)->PlanID,
                    'RenewalAmount' => $faker->randomFloat(2, 1000, 3000),
                ]);
            }
        }

        // 7) Membership Freezes
        foreach ($members as $member) {
            if ($faker->boolean(20)) {
                $freezeStart = $faker->dateTimeBetween('now', '+15 days');
                MembershipFreeze::create([
                    'MemberID'        => $member->MemberID,
                    'FreezeStartDate' => $freezeStart,
                    'FreezeEndDate'   => (clone $freezeStart)->modify('+7 days'),
                    'Reason'          => 'Vacation',
                    'OriginalEndDate' => $member->MembershipEndDate,
                ]);
            }
        }

        // 8) Membership Change Logs
        foreach ($members as $member) {
            if ($faker->boolean(20)) {
                $oldPlan = $faker->randomElement($membershipPlans);
                $newPlan = $faker->randomElement($membershipPlans);
                MembershipChangeLog::create([
                    'MemberID'   => $member->MemberID,
                    'OldPlanID'  => $oldPlan->PlanID,
                    'NewPlanID'  => $newPlan->PlanID,
                    'ChangeDate' => $faker->dateTimeBetween('-10 days', 'now'),
                    'Reason'     => $faker->sentence,
                    'Notes'      => $faker->sentence,
                ]);
            }
        }

        // 9) Member Visits
        foreach ($members as $member) {
            for ($i = 0; $i < 3; $i++) {
                MemberVisit::create([
                    'BranchID'      => $member->StartedBranchID,
                    'MemberID'      => $member->MemberID,
                    'VisitDate'     => $faker->dateTimeBetween('-30 days', 'now'),
                    'VisitTime'     => $faker->time(),
                    'CheckInMethod' => $faker->randomElement(['Biometric', 'Card']),
                    'Remarks'       => $faker->sentence,
                ]);
            }
        }

        // 10) Staff Schedules
        foreach ($staffList as $staff) {
            for ($i = 1; $i <= 5; $i++) {
                $shiftDate = $faker->dateTimeBetween('-10 days', '+10 days');
                StaffSchedule::create([
                    'StaffID'     => $staff->StaffID,
                    'ShiftDate'   => $shiftDate,
                    'ShiftStart'  => $faker->time('H:i:s', '12:00'),
                    'ShiftEnd'    => $faker->time('H:i:s', '23:00'),
                    'RoleOverride'=> null,
                ]);
            }
        }

        // 11) Staff Tasks
        foreach ($staffList as $staff) {
            if ($faker->boolean(50)) {
                StaffTask::create([
                    'StaffID'        => $staff->StaffID,
                    'TaskDescription' => $faker->sentence,
                    'TaskDate'       => $faker->dateTimeBetween('-5 days', '+5 days'),
                    'Status'         => $faker->randomElement(['Pending','Completed']),
                ]);
            }
        }

        // 12) Payroll
        $payrolls = [];
        foreach ($staffList as $staff) {
            $payroll = Payroll::create([
                'StaffID'      => $staff->StaffID,
                'StartDate'    => $faker->dateTimeBetween('-15 days', '-8 days'),
                'EndDate'      => $faker->dateTimeBetween('-7 days', 'now'),
                'GrossPay'     => $faker->randomFloat(2, 5000, 10000),
                'Deductions'   => $faker->randomFloat(2, 200, 1000),
                'NetPay'       => 0,
                'GeneratedDate'=> $faker->dateTimeBetween('-2 days', 'now'),
                'Status'       => $faker->randomElement(['Pending','Paid']),
            ]);
            // Recalculate net pay
            $payroll->NetPay = $payroll->GrossPay - $payroll->Deductions;
            $payroll->save();
            $payrolls[] = $payroll;
        }

        // 13) Attendance
        foreach ($payrolls as $pay) {
            for ($i = 1; $i <= 5; $i++) {
                $timeIn  = Carbon::parse('08:00');
                $timeOut = Carbon::parse('16:00');
                Attendance::create([
                    'StaffID'      => $pay->StaffID,
                    'PayrollID'    => $pay->PayrollID,
                    'Date'         => $faker->dateTimeBetween($pay->StartDate, $pay->EndDate),
                    'TimeIn'       => $timeIn,
                    'TimeOut'      => $timeOut,
                    'HoursWorked'  => 8,
                    'OvertimeHours'=> $faker->boolean(20) ? 1 : 0,
                ]);
            }
        }

        // 14) Bonuses
        foreach ($staffList as $staff) {
            if ($faker->boolean(30)) {
                Bonus::create([
                    'StaffID'     => $staff->StaffID,
                    'BonusAmount' => $faker->randomFloat(2, 100, 1000),
                    'BonusDate'   => $faker->dateTimeBetween('-10 days', 'now'),
                    'Reason'      => $faker->sentence,
                ]);
            }
        }

        // 15) Promotions
        $promotions = [];
        for ($i = 1; $i <= 3; $i++) {
            $promotions[] = Promotions::create([
                'Name'            => $faker->words(2, true),
                'DiscountType'    => $faker->randomElement(['Percentage','FixedAmount']),
                'DiscountValue'   => $faker->randomFloat(2, 5, 500),
                'StartDate'       => $faker->dateTimeBetween('-5 days', 'now'),
                'EndDate'         => $faker->dateTimeBetween('now', '+5 days'),
                'TermsAndConditions' => $faker->sentence,
                'Status'          => 'Active',
            ]);
        }

        // 16) Invoices & Line Items
        $invoices = [];
        foreach ($members as $member) {
            if ($faker->boolean(50)) {
                $promo = $faker->boolean(30) ? $faker->randomElement($promotions) : null;
                $invoice = Invoice::create([
                    'BranchID'     => $member->StartedBranchID,
                    'MemberID'     => $member->MemberID,
                    'PromotionID'  => $promo ? $promo->PromotionID : null,
                    'InvoiceDate'  => $faker->dateTimeBetween('-5 days','now'),
                    'DueDate'      => $faker->dateTimeBetween('now','+7 days'),
                    'InvoiceTotal' => 0,
                ]);

                // Add line items
                $lineCount  = $faker->numberBetween(1, 3);
                $invoiceSum = 0;
                for ($l = 1; $l <= $lineCount; $l++) {
                    $qty       = $faker->numberBetween(1, 5);
                    $unitPrice = $faker->randomFloat(2, 100, 2000);
                    $subtotal  = $qty * $unitPrice;
                    InvoiceLineItem::create([
                        'InvoiceID'   => $invoice->InvoiceID,
                        'ItemType'    => $faker->randomElement(['Membership','PersonalTraining','Product']),
                        'Description' => $faker->sentence,
                        'Quantity'    => $qty,
                        'UnitPrice'   => $unitPrice,
                        'Subtotal'    => $subtotal,
                    ]);
                    $invoiceSum += $subtotal;
                }
                // Update invoice total
                $discountValue = 0;
                if ($promo && $promo->DiscountType === 'Percentage') {
                    $discountValue = $invoiceSum * ($promo->DiscountValue / 100);
                } elseif ($promo && $promo->DiscountType === 'FixedAmount') {
                    $discountValue = $promo->DiscountValue;
                }
                $invoice->InvoiceTotal = max(0, $invoiceSum - $discountValue);
                $invoice->save();
                $invoices[] = $invoice;
            }
        }

        // 17) Payments & Payment Invoice pivot
        foreach ($invoices as $inv) {
            if ($faker->boolean(50)) {
                $payment = Payment::create([
                    'BranchID'      => $inv->BranchID,
                    'MemberID'      => $inv->MemberID,
                    'PaymentFor'    => 'Invoice Payment',
                    'PaymentMethod' => $faker->randomElement(['Cash','GCash','BPI']),
                    'Amount'        => $inv->InvoiceTotal,
                    'PaymentDate'   => $faker->dateTimeBetween($inv->InvoiceDate, 'now'),
                    'Status'        => 'Completed',
                ]);
                PaymentInvoice::create([
                    'PaymentID'       => $payment->PaymentID,
                    'InvoiceID'       => $inv->InvoiceID,
                    'AmountAllocated' => $inv->InvoiceTotal,
                ]);
            }
        }

        // 18) Facilities
        $facilities = [];
        for ($i = 1; $i <= 5; $i++) {
            $branchPick = $faker->randomElement($branches);
            $facilities[] = Facility::create([
                'BranchID'     => $branchPick->BranchID,
                'Name'         => $faker->word . ' Facility',
                'FacilityType' => $faker->randomElement(['Court','Room','Equipment']),
                'Status'       => 'Available',
                'Capacity'     => $faker->numberBetween(5,20),
                'Location'     => $faker->randomElement(['Ground Floor','2nd Floor','3rd Floor']),
                'Notes'        => $faker->sentence,
            ]);
        }

        // 19) Bookings
        for ($i = 1; $i <= 5; $i++) {
            $memberPick   = $faker->randomElement($members);
            $facilityPick = $faker->randomElement($facilities);
            Booking::create([
                'BranchID'   => $facilityPick->BranchID,
                'MemberID'   => $memberPick->MemberID,
                'FacilityID' => $facilityPick->FacilityID,
                'PaymentID'  => null,
                'BookingDate'=> $faker->dateTimeBetween('now','+7 days'),
                'BookingTime'=> $faker->time(),
                'Duration'   => $faker->numberBetween(30, 120),
            ]);
        }

        // 20) Daily Cash Flow
        for ($i = 1; $i <= 5; $i++) {
            $branchPick = $faker->randomElement($branches);
            $cashSales  = $faker->randomFloat(2, 100, 2000);
            $gCashSales = $faker->randomFloat(2, 100, 1000);
            $bpiSales   = $faker->randomFloat(2, 100, 1000);
            $walkInCash = $faker->randomFloat(2, 0, 500);
            $walkInGCash= $faker->randomFloat(2, 0, 500);
            $walkInBPI  = $faker->randomFloat(2, 0, 500);
            DailyCashFlow::create([
                'BranchID'         => $branchPick->BranchID,
                'Date'             => $faker->dateTimeBetween('-10 days','now'),
                'BusinessType'     => 'Gym',
                'CashSales'        => $cashSales,
                'GCashSales'       => $gCashSales,
                'BPISales'         => $bpiSales,
                'WalkInCashSales'  => $walkInCash,
                'WalkInGCashSales' => $walkInGCash,
                'WalkInBPISales'   => $walkInBPI,
                'TotalSales'       => ($cashSales + $gCashSales + $bpiSales + $walkInCash + $walkInGCash + $walkInBPI),
            ]);
        }

        // 21) Walk-Ins
        for ($i = 1; $i <= 5; $i++) {
            $branchPick = $faker->randomElement($branches);
            WalkIn::create([
                'BranchID' => $branchPick->BranchID,
                'PaymentID'=> null,
                'FullName' => $faker->name,
                'VisitDate'=> $faker->dateTimeBetween('-5 days','now'),
                'Notes'    => $faker->sentence,
            ]);
        }

        // 22) Equipment
        $equipmentList = [];
        for ($i = 1; $i <= 5; $i++) {
            $branchPick = $faker->randomElement($branches);
            $equipmentList[] = Equipment::create([
                'BranchID'           => $branchPick->BranchID,
                'Name'               => $faker->randomElement(['Treadmill','Bike','Dumbbell Rack','Bench Press','Rowing Machine']),
                'SerialNumber'       => $faker->bothify('EQ-#####'),
                'Status'             => $faker->randomElement(['Available','InMaintenance']),
                'LastMaintenanceDate'=> $faker->dateTimeBetween('-60 days','-10 days'),
                'Notes'              => $faker->sentence,
            ]);
        }

        // 23) Maintenance Logs
        foreach ($equipmentList as $eq) {
            if ($faker->boolean(40)) {
                MaintenanceLog::create([
                    'EquipmentID'       => $eq->EquipmentID,
                    'MaintenanceDate'   => $faker->dateTimeBetween('-20 days','now'),
                    'IssueDescription'  => $faker->sentence,
                    'Resolution'        => $faker->sentence,
                    'MaintainedBy'      => $faker->randomElement($staffList)->StaffID,
                    'NextMaintenanceDate' => $faker->dateTimeBetween('now','+30 days'),
                    'Notes'             => $faker->sentence,
                ]);
            }
        }

        // 24) Coaches
        $coaches = [];
        for ($i = 1; $i <= 5; $i++) {
            $branchPick = $faker->randomElement($branches);
            $coaches[] = Coach::create([
                'BranchID'     => $branchPick->BranchID,
                'FullName'     => $faker->name,
                'Specialty'    => $faker->randomElement(['Yoga','Boxing','Zumba','Crossfit']),
                'Availability' => 'Weekdays 5AM - 9PM',
                'ContactInfo'  => $faker->phoneNumber,
            ]);
        }

        // 25) Coaching Sessions
        $sessions = [];
        foreach ($coaches as $coach) {
            for ($i = 1; $i <= 2; $i++) {
                $sessions[] = CoachingSession::create([
                    'SessionName' => $faker->sentence(2),
                    'SessionType' => $faker->randomElement(['Group Class','Personal Training']),
                    'CoachID'     => $coach->CoachID,
                    'StartTime'   => $faker->time('H:i:s','18:00'),
                    'EndTime'     => $faker->time('H:i:s','21:00'),
                    'Capacity'    => $faker->numberBetween(5,15),
                    'Location'    => $faker->randomElement(['Studio A','Boxing Ring','Main Hall']),
                    'Fee'         => $faker->randomFloat(2, 100, 500),
                ]);
            }
        }

        // 26) Session Bookings
        foreach ($sessions as $session) {
            if ($faker->boolean(50)) {
                $memberPick = $faker->randomElement($members);
                SessionBooking::create([
                    'SessionID'   => $session->SessionID,
                    'MemberID'    => $memberPick->MemberID,
                    'BookingDate' => $faker->dateTimeBetween('now','+10 days'),
                    'PaymentID'   => null,
                    'Status'      => 'Confirmed',
                ]);
            }
        }

        // 27) Session Waitlists
        foreach ($sessions as $session) {
            if ($faker->boolean(20)) {
                $memberPick = $faker->randomElement($members);
                SessionWaitlist::create([
                    'SessionID'   => $session->SessionID,
                    'MemberID'    => $memberPick->MemberID,
                    'WaitlistDate'=> $faker->dateTimeBetween('-1 days','now'),
                    'Status'      => 'Waiting',
                ]);
            }
        }

        // 28) Session Attendance
        foreach ($sessions as $session) {
            if ($faker->boolean(20)) {
                $memberPick = $faker->randomElement($members);
                SessionAttendance::create([
                    'SessionID'      => $session->SessionID,
                    'MemberID'       => $memberPick->MemberID,
                    'AttendanceDate' => $faker->dateTimeBetween('-2 days','now'),
                ]);
            }
        }

        // 29) Lockers
        $lockers = [];
        foreach ($branches as $branchPick) {
            for ($i = 1; $i <= 100; $i++) {
                $lockers[] = Locker::create([
                    'BranchID'     => $branchPick->BranchID,
                    'LockerNumber' => (string) $i, // or "LCK-$i" if you prefer
                    'Status'       => $faker->randomElement(['Available','Occupied','OutOfService']),
                    'Notes'        => $faker->sentence,
                ]);
            }
        }


        // 30) Locker Usage
        foreach ($lockers as $locker) {
            if ($locker->Status === 'Occupied' && !empty($members)) {
                $memberPick = $faker->randomElement($members);
                LockerUsage::create([
                    'BranchID'   => $locker->BranchID,
                    'LockerID'   => $locker->LockerID,
                    'MemberID'   => $memberPick->MemberID,
                    'KeyBorrowed'=> true,
                    'BorrowDate' => $faker->dateTimeBetween('-1 days','now'),
                    'ReturnDate' => null,
                    'Returned'   => false,
                    'Notes'      => $faker->sentence,
                ]);
            }
        }

        // 31) System Logs
        for ($i = 1; $i <= 5; $i++) {
            $staffPick = $faker->randomElement($staffList);
            SystemLog::create([
                'BranchID'  => $staffPick->BranchID,
                'UserID'    => $staffPick->StaffID,
                'Action'    => 'Test action ' . $i,
                'Timestamp' => Carbon::now(),
                'IPAddress' => $faker->ipv4,
                'Details'   => json_encode(['info' => $faker->sentence]),
            ]);
        }

        // 32) Products
        $productList = [];
        for ($i = 1; $i <= 5; $i++) {
            $branchPick = $faker->randomElement($branches);
            $productList[] = Product::create([
                'BranchID'     => $branchPick->BranchID,
                'ProductName'  => $faker->randomElement(['Gym Towel','Bottle Water','Protein Bar','Alcohol','Yoga Mat']),
                'Category'     => 'Consumable',
                'StockLevel'   => $faker->numberBetween(10,100),
                'ReorderLevel' => 10,
                'UnitOfMeasure'=> 'Piece',
                'Cost'         => $faker->randomFloat(2, 10, 50),
                'Price'        => $faker->randomFloat(2, 60, 150),
                'Notes'        => $faker->sentence,
            ]);
        }

        // 33) Product Inventory Logs
        foreach ($productList as $product) {
            if ($faker->boolean(50)) {
                $qtyChange     = $faker->numberBetween(-5, 5);
                $newStockLevel = $product->StockLevel + $qtyChange;
                ProductInventoryLog::create([
                    'BranchID'      => $product->BranchID,
                    'ProductID'     => $product->ProductID,
                    'ChangeDate'    => $faker->dateTimeBetween('-5 days','now'),
                    'ChangeType'    => $qtyChange > 0 ? 'Purchase' : 'Usage',
                    'QuantityChange'=> $qtyChange,
                    'NewStockLevel' => $newStockLevel,
                    'StaffID'       => $faker->randomElement($staffList)->StaffID,
                    'Notes'         => $faker->sentence,
                ]);
                $product->StockLevel = $newStockLevel;
                $product->save();
            }
        }

        // 34) Notifications
        foreach ($members as $member) {
            if ($faker->boolean(50)) {
                Notification::create([
                    'MemberID'           => $member->MemberID,
                    'EventTrigger'       => 'Test Trigger',
                    'Message'            => $faker->sentence,
                    'NotificationMethod' => $faker->randomElement(['Email','SMS']),
                    'SentDate'           => $faker->dateTimeBetween('-3 days','now'),
                    'Status'             => $faker->randomElement(['Sent','Pending','Failed']),
                ]);
            }
        }

        // 35) Notification Templates
        for ($i = 1; $i <= 3; $i++) {
            NotificationTemplate::create([
                'name'     => 'Template ' . $i,
                'content'  => $faker->paragraph,
                'approved' => $faker->boolean(70),
            ]);
        }

        // 36) Expenses
        for ($i = 1; $i <= 5; $i++) {
            $branchPick = $faker->randomElement($branches);
            Expense::create([
                'BranchID'        => $branchPick->BranchID,
                'ExpenseDate'     => $faker->dateTimeBetween('-10 days','now'),
                'ExpenseCategory' => $faker->randomElement(['Utilities','Marketing','Repairs','Misc']),
                'Amount'          => $faker->randomFloat(2, 100, 2000),
                'PaymentMethod'   => $faker->randomElement(['Cash','GCash','BPI']),
                'StaffID'         => $faker->randomElement($staffList)->StaffID,
                'Notes'           => $faker->sentence,
            ]);
        }

        $this->command->info('Faker test data seeded successfully.');
    }
}
