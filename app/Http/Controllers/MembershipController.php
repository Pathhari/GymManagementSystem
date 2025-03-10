<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Member;
use App\Models\MembershipPlan;
use App\Models\MembershipRenewal;
use App\Models\MembershipFreeze;
use App\Models\Invoice;
use App\Models\InvoiceLineItem;
use App\Models\PaymentInvoice;
use App\Models\WalkIn;
use App\Models\Payment;
use App\Models\SystemLog;
use Carbon\Carbon;



class MembershipController extends Controller
{
    /* ------------------------------------------------------------------
     * 1) MEMBERS
     * ------------------------------------------------------------------ */

    /**
     * Return JSON with members (and optionally walkIns, renewals, etc.).
     * GET /membership/members
     */
    public function apiIndex()
    {
        $staff = auth('staff')->user();

        if ($staff) {
            $branchIDs = $staff->branches->pluck('BranchID');

            // Filter members by those branches
            $members = Member::whereIn('StartedBranchID', $branchIDs)
                ->orderBy('MemberID','desc')
                ->get();

            // Similarly for Freezes, Renewals, Walk-Ins, etc.
            $freezes = MembershipFreeze::whereHas('member', function ($q) use ($branchIDs) {
                $q->whereIn('StartedBranchID', $branchIDs);
            })->orderBy('FreezeID','desc')->get();

            $renewals = MembershipRenewal::whereIn('MemberID', function ($sub) use ($branchIDs) {
                $sub->select('MemberID')
                    ->from('members')
                    ->whereIn('StartedBranchID', $branchIDs);
            })->orderBy('RenewalID','desc')->get();

            $walkIns = WalkIn::whereIn('BranchID', $branchIDs)
                ->orderBy('WalkInID','desc')
                ->get();
        } else {
            // Admin or Owner => see all
            $members  = Member::orderBy('MemberID','desc')->get();
            $freezes  = MembershipFreeze::orderBy('FreezeID','desc')->get();
            $renewals = MembershipRenewal::orderBy('RenewalID','desc')->get();
            $walkIns  = WalkIn::orderBy('WalkInID','desc')->get();
        }

        return response()->json([
            'members'  => $members,
            'walkIns'  => $walkIns,
            'renewals' => $renewals,
            'freezes'  => $freezes,
        ]);
    }

    /**
     * Simple search by name (GET /membership/search-members?q=)
     */
    public function apiSearchMembers(Request $request)
    {
        $q = $request->query('q', '');
        $members = Member::where('FullName', 'like', $q . '%')
                    ->orderBy('FullName')
                    ->limit(30)
                    ->get(['MemberID','FullName']);
        
        return response()->json($members);
    }

    /**
     * Create a new member (POST /membership/members).
     */

     public function apiStoreMember(Request $request)
     {

        if ($request->has('Payments')) {
            $request->merge([
                'Payments' => json_decode($request->input('Payments'), true),
            ]);
        }

         $data = $request->validate([
             'BranchID'             => 'nullable|exists:branches,BranchID',
             'FullName'             => 'required|string|max:255',
             'Email'                => 'required|email|unique:members,Email',
             'Phone'                => 'nullable|string|max:50',
             'PlanID'               => 'nullable|exists:membership_plans,PlanID',
             'MembershipCardNumber' => 'nullable|unique:members,MembershipCardNumber',
             'MembershipCardIssued' => 'boolean',
             'MemberStatusID'       => 'nullable|exists:member_statuses,MemberStatusID',
             'MembershipStartDate'  => 'nullable|date',
             'MembershipEndDate'    => 'nullable|date|after_or_equal:MembershipStartDate',
             'Biometrics'           => 'nullable|string',
             'FreeSessions'         => 'nullable|integer',
             'Notes'                => 'nullable|string',
             'PhotoFile'            => 'nullable|image|mimes:jpg,png,jpeg,gif|max:2048',
     
             // Payment & multi-month
             'Payments'                      => 'array', // array of partial payments
             'Payments.*.PaymentMethod'      => 'string|max:50',
             'Payments.*.PaymentAmount'      => 'numeric|min:0',
             'MonthsToPayUpfront'           => 'nullable|integer|min:1', // e.g. 3 or 6
         ]);
     
         // If staff => override BranchID
         $staff = auth('staff')->user();
         if ($staff) {
             // Retrieve the branch id from the staff's associated branches.
             $branch = $staff->branches()->first();
             $data['StartedBranchID'] = $branch ? $branch->BranchID : null;
         } else {
             $data['StartedBranchID'] = $data['BranchID'] ?? null;
         }
         
         // Handle photo upload
         if ($request->hasFile('PhotoFile')) {
             $filename = 'member_' . time() . '.' . $request->file('PhotoFile')->extension();
             $photoPath = $request->file('PhotoFile')->storeAs('member_photos', $filename, 'public');
             $data['PhotoPath'] = $photoPath;
         }
     
         // Default to "NEW MEMBER" (ID=6) if no status given
         $data['MemberStatusID'] = $data['MemberStatusID'] ?? 6;
     
         DB::beginTransaction();
         try {
             // 1) Create the Member
             $member = Member::create($data);
     
             // 2) If a Plan is selected => create membership invoice
             $monthsUpfront = $data['MonthsToPayUpfront'] ?? 1;
             $invoice = null; // We'll store the newly created invoice here if it applies
     
             if (!empty($data['PlanID'])) {
                 $plan = MembershipPlan::find($data['PlanID']);
                 if ($plan) {
                     // If no start date, default to today
                     $startDate = !empty($data['MembershipStartDate'])
                         ? Carbon::parse($data['MembershipStartDate'])
                         : Carbon::today();
     
                     $member->MembershipStartDate = $startDate->format('Y-m-d');
     
                     if ($monthsUpfront > 1) {
                         // MULTI-MONTH: create one invoice for all months
                         $nextCycleDate = $startDate->copy();
                         for ($i = 1; $i <= $monthsUpfront; $i++) {
                             $nextCycleDate = $this->calculateNextMonthBillingDay($nextCycleDate);
                         }
                         $member->MembershipEndDate = $nextCycleDate->format('Y-m-d');
                         $member->save();
     
                         // Create single invoice for the entire multi-month charge
                         $invoice = Invoice::create([
                             'BranchID'     => $member->StartedBranchID,
                             'MemberID'     => $member->MemberID,
                             'InvoiceDate'  => now(),
                             'DueDate'      => now(), // or pick a date
                             'InvoiceTotal' => 0,
                         ]);
                         $lineSubtotal = $plan->Price * $monthsUpfront;
                         InvoiceLineItem::create([
                             'InvoiceID'   => $invoice->InvoiceID,
                             'ItemType'    => 'Membership',
                             'ItemID'      => $plan->PlanID,
                             'Description' => "Prepaid for {$monthsUpfront} months",
                             'Quantity'    => $monthsUpfront,
                             'UnitPrice'   => $plan->Price,
                             'Subtotal'    => $lineSubtotal,
                         ]);
                         $invoice->InvoiceTotal = $lineSubtotal;
                         $invoice->save();
     
                     } else {
                         // SINGLE-MONTH SCENARIO
                         $endDate = $this->calculateNextMonthBillingDay($startDate);
                         $member->MembershipEndDate = $endDate->format('Y-m-d');
                         $member->save();
     
                         $invoice = Invoice::create([
                             'BranchID'     => $member->StartedBranchID,
                             'MemberID'     => $member->MemberID,
                             'InvoiceDate'  => now(),
                             'DueDate'      => $endDate,  // or now() if you want immediate
                             'InvoiceTotal' => 0,
                         ]);
                         InvoiceLineItem::create([
                             'InvoiceID'   => $invoice->InvoiceID,
                             'ItemType'    => 'Membership',
                             'ItemID'      => $plan->PlanID,
                             'Description' => 'Monthly Membership',
                             'Quantity'    => 1,
                             'UnitPrice'   => $plan->Price,
                             'Subtotal'    => $plan->Price,
                         ]);
                         $invoice->InvoiceTotal = $plan->Price;
                         $invoice->save();
                     }
                 }
             }
     
             // 3) Process payments array (split payments)
             $paymentsData = $data['Payments'] ?? [];
             $allocatedSoFar = 0;
             $invoiceTotal = $invoice ? $invoice->InvoiceTotal : 0;
     
             foreach ($paymentsData as $payItem) {
                 // Create Payment record
                 $payment = Payment::create([
                     'MemberID'      => $member->MemberID,
                     'BranchID'      => $member->StartedBranchID,
                     'PaymentMethod' => $payItem['PaymentMethod'] ?? '',
                     'Amount'        => $payItem['PaymentAmount'] ?? 0,
                     'PaymentDate'   => now(),
                     'PaymentFor'    => ['New Membership'],
                     'Status'        => 'Completed',
                 ]);
     
                 // If we have an invoice, allocate the payment
                 if ($invoice) {
                     $allocatedSoFar += $payItem['PaymentAmount'];
                     PaymentInvoice::create([
                         'PaymentID'       => $payment->PaymentID,
                         'InvoiceID'       => $invoice->InvoiceID,
                         'AmountAllocated' => $payItem['PaymentAmount'],
                     ]);
                 }
             }
     
             // Update invoice PaymentStatus, if we have an invoice
             if ($invoice) {
                 if ($allocatedSoFar >= $invoiceTotal) {
                     $invoice->PaymentStatus = 'Paid';
                 } elseif ($allocatedSoFar > 0) {
                     $invoice->PaymentStatus = 'Partially Paid';
                 } else {
                     $invoice->PaymentStatus = 'Unpaid'; // or whatever you prefer
                 }
                 $invoice->save();
             }
     
             // 4) If they've paid at least 3 months and the invoice is fully paid => "ACTIVE"
             //
             // Otherwise, remain "NEW MEMBER" (ID=6).
             // So the logic is:
             //   - If monthsUpfront >= 3 (i.e. 3 or more months lock-in)
             //   - AND $invoice->PaymentStatus === 'Paid'
             // then MemberStatusID = 1.
             if ($invoice && $monthsUpfront >= 3 && $invoice->PaymentStatus === 'Paid') {
                 $member->MemberStatusID = 1; // 1 = ACTIVE
                 $member->save();
             }
     
             DB::commit();
     
             return response()->json(['member' => $member], 201);
     
         } catch (\Exception $e) {
             DB::rollBack();
             return response()->json(['error' => $e->getMessage()], 500);
         }
     }
     
     /**
      * This helper function chooses day 15 or 30 in the next month,
      * falling back to the last day if next month has fewer days.
      */
     private function calculateNextMonthBillingDay(Carbon $referenceDate)
     {
         $nextMonth = $referenceDate->copy()->addMonthNoOverflow();
         $daysInNextMonth = $nextMonth->daysInMonth;
         $dayOfMonth = (int) $referenceDate->format('d');
     
         if ($dayOfMonth <= 15) {
             $candidateDay = 15;
             if ($daysInNextMonth < 15) {
                 $candidateDay = $daysInNextMonth;
             }
         } else {
             $candidateDay = 30;
             if ($daysInNextMonth < 30) {
                 $candidateDay = $daysInNextMonth;
             }
         }
     
         return Carbon::create($nextMonth->year, $nextMonth->month, $candidateDay, 0, 0, 0);
     }
     

    /**
     * Update an existing member (PUT /membership/members/{id}).
     */
    public function apiUpdateMember(Request $request, $id)
    {
        $member = Member::findOrFail($id);
    
        // For staff, ensure the member belongs to one of their branches.
        $staff = auth('staff')->user();
        if ($staff && !$staff->branches->pluck('BranchID')->contains($member->StartedBranchID)) {
            abort(403, 'Cannot update member from another branch.');
        }
    
        $data = $request->validate([
            'BranchID'             => 'nullable|exists:branches,BranchID',
            'FullName'             => 'nullable|string|max:255',
            'Email'                => 'nullable|email|unique:members,Email,' . $member->MemberID . ',MemberID',
            'Phone'                => 'nullable|string|max:50',
            'PlanID'               => 'nullable|exists:membership_plans,PlanID',
            'MembershipCardNumber' => 'nullable|unique:members,MembershipCardNumber,' . $member->MemberID . ',MemberID',
            'MembershipCardIssued' => 'boolean',
            'MemberStatusID'       => 'nullable|exists:member_statuses,MemberStatusID',
            'MembershipStartDate'  => 'nullable|date',
            'MembershipEndDate'    => 'nullable|date|after_or_equal:MembershipStartDate',
            'Biometrics'           => 'nullable|string',
            'FreeSessions'         => 'nullable|integer',
            'Notes'                => 'nullable|string',
            'PhotoFile'            => 'nullable|image|mimes:jpg,png,jpeg,gif|max:2048',
            'PaymentMethod'        => 'nullable|string|max:50',
            'PaymentAmount'        => 'nullable|numeric|min:0',
        ]);
    
        // For staff, do not allow changing to a branch not already assigned.
        if ($staff) {
            if (isset($data['BranchID']) && !$staff->branches->pluck('BranchID')->contains($data['BranchID'])) {
                abort(403, 'Staff cannot assign a different branch.');
            }
            // Ensure we keep the original branch.
            $data['StartedBranchID'] = $member->StartedBranchID;
        } else {
            $data['StartedBranchID'] = $data['BranchID'] ?? $member->StartedBranchID;
        }
    
        // Handle photo upload if provided.
        if ($request->hasFile('PhotoFile')) {
            $filename = 'member_' . time() . '.' . $request->file('PhotoFile')->extension();
            $photoPath = $request->file('PhotoFile')->storeAs('member_photos', $filename, 'public');
            $data['PhotoPath'] = $photoPath;
        }
    
        $member->update($data);
        return response()->json($member, 200);
    }
    

    /**
     * Delete a member (DELETE /membership/members/{id}).
     */
    public function apiDestroyMember($id)
    {
        $member = Member::findOrFail($id);

        // If staff => block cross-branch
        $staff = auth('staff')->user();
        if ($staff && $member->StartedBranchID != $staff->BranchID) {
            abort(403, 'Cannot delete member from another branch.');
        }

        $member->delete();
        return response()->json(['message' => 'Member deleted.'], 200);
    }

    /**
     * Just an example if you want membership statuses in the front-end
     */
    public function indexMemberStatuses()
    {
        $statuses = \App\Models\MemberStatus::orderBy('MemberStatusID')->get();
        return response()->json($statuses, 200);
    }

        /**
     * Return members whose membership ends within the next X days.
     * GET /membership/expiring?days=7
     */
    public function expiringMembers(Request $request)
    {
        // 1) Determine how many days in the future
        $days = (int) $request->query('days', 7);

        // 2) Calculate the date cutoff (today + X days)
        $today = Carbon::today();
        $cutoff = $today->copy()->addDays($days);

        // 3) Branch filtering if staff is logged in
        $staff = auth('staff')->user();
        if ($staff) {
            // If staff => filter for members in staff's branch(es)
            $branchIDs = $staff->branches->pluck('BranchID');
            $members = Member::whereIn('StartedBranchID', $branchIDs)
                ->whereNotNull('MembershipEndDate')
                ->whereDate('MembershipEndDate', '>=', $today)   // ends in the future (or today)
                ->whereDate('MembershipEndDate', '<=', $cutoff)  // ends on/before cutoff
                ->orderBy('MembershipEndDate', 'asc')
                ->get();
        } else {
            // Admin or Owner => no branch restriction
            $members = Member::whereNotNull('MembershipEndDate')
                ->whereDate('MembershipEndDate', '>=', $today)
                ->whereDate('MembershipEndDate', '<=', $cutoff)
                ->orderBy('MembershipEndDate', 'asc')
                ->get();
        }

        return response()->json($members);
    }


    /* ------------------------------------------------------------------
     * 2) MEMBERSHIP PLANS
     * ------------------------------------------------------------------ */

    /**
     * Return all membership plans as JSON.
     * GET /membership/plans
     */
    public function indexPlans()
    {
        // We join the "members" relationship, but we only need to select
        // minimal columns: MemberID, PlanID, StartedBranchID
        // so we can do branch-based filtering on the frontend
        $plans = MembershipPlan::with([
            'members' => function ($q) {
                // Only select the minimal fields
                $q->select('MemberID', 'PlanID', 'StartedBranchID');
            }
        ])
        ->orderBy('PlanID')
        ->get();
    
        return response()->json($plans, 200);
    }
    /**
     * Create a new plan.
     * POST /membership/plans
     */
    public function storePlan(Request $request)
    {
        $data = $request->validate([
            'PlanName' => 'required|string|max:255|unique:membership_plans,PlanName',
            'Price'    => 'required|numeric|min:0',
            'Duration' => 'required|integer|min:1',
            'Features' => 'nullable|string',
        ]);

        $plan = MembershipPlan::create($data);
        return response()->json($plan, 201);
    }

    /**
     * Update an existing plan.
     * PUT /membership/plans/{id}
     */
    public function updatePlan(Request $request, $id)
    {
        $plan = MembershipPlan::findOrFail($id);

        $data = $request->validate([
            'PlanName' => 'required|string|max:255|unique:membership_plans,PlanName,' . $plan->PlanID . ',PlanID',
            'Price'    => 'required|numeric|min:0',
            'Duration' => 'required|integer|min:1',
            'Features' => 'nullable|string',
        ]);

        $plan->update($data);
        return response()->json($plan, 200);
    }

    /**
     * Delete a plan.
     * DELETE /membership/plans/{id}
     */
    public function destroyPlan($id)
    {
        $plan = MembershipPlan::findOrFail($id);
        $plan->delete();
        return response()->json(['message' => 'Plan deleted'], 200);
    }

    /* ------------------------------------------------------------------
     * 3) MEMBERSHIP RENEWAL
     * ------------------------------------------------------------------ */

    // If you have more logic for Renewals, do similarly with JSON methods
    // For demonstration, we show a single store method:

    public function storeRenewal(Request $request)
    {
        $data = $request->validate([
            'MemberID'                => 'required|exists:members,MemberID',
            'NewEndDate'              => 'required|date|after_or_equal:today',
            'RenewalAmount'           => 'required|numeric|min:0',
            'Payments'                => 'array',
            'Payments.*.PaymentMethod'=> 'string|max:50',
            'Payments.*.PaymentAmount'=> 'numeric|min:0',
            'PaymentFor'              => 'nullable|string',
        ]);
    
        // 1) Fetch the member
        $member = Member::findOrFail($data['MemberID']);
    
        // 2) Update membership end date to the user-selected date
        $member->MembershipEndDate = $data['NewEndDate'];
    
        // DON’T immediately set to Active here. We handle status after we do the invoice, etc.
    
        $member->save();
    
        // 3) Create a renewal record
        $renewal = MembershipRenewal::create([
            'MemberID'      => $member->MemberID,
            'PlanID'        => $member->PlanID, // keep existing plan if needed
            'RenewalAmount' => $data['RenewalAmount'],
            'RenewalDate'   => now(),
        ]);
    
        // 4) Create an invoice + line item
        $invoice = Invoice::create([
            'BranchID'     => $member->StartedBranchID,
            'MemberID'     => $member->MemberID,
            'InvoiceDate'  => now(),
            'DueDate'      => now(),
            'InvoiceTotal' => $data['RenewalAmount'],
        ]);
    
        InvoiceLineItem::create([
            'InvoiceID'   => $invoice->InvoiceID,
            'ItemType'    => 'Renewal',
            'ItemID'      => $member->PlanID, // or null
            'Description' => 'Manual Renewal',
            'Quantity'    => 1,
            'UnitPrice'   => $data['RenewalAmount'],
            'Subtotal'    => $data['RenewalAmount'],
        ]);
    
        // 5) Payment logic
        $paymentsData   = $data['Payments'] ?? [];
        $allocatedSoFar = 0;
        $payment        = null;
    
        foreach ($paymentsData as $payItem) {
            if (empty($payItem['PaymentMethod']) || empty($payItem['PaymentAmount'])) {
                continue;
            }
    
            $paymentFor = !empty($data['PaymentFor'])
                ? json_decode($data['PaymentFor'], true)
                : ["Membership Renewal"];
    
            $payment = Payment::create([
                'MemberID'      => $member->MemberID,
                'BranchID'      => $member->StartedBranchID,
                'PaymentMethod' => $payItem['PaymentMethod'],
                'Amount'        => $payItem['PaymentAmount'],
                'PaymentDate'   => now(),
                'PaymentFor'    => $paymentFor,
                'Status'        => 'Completed',
            ]);
    
            PaymentInvoice::create([
                'PaymentID'       => $payment->PaymentID,
                'InvoiceID'       => $invoice->InvoiceID,
                'AmountAllocated' => $payItem['PaymentAmount'],
            ]);
    
            $allocatedSoFar += $payItem['PaymentAmount'];
        }
    
        // Update the invoice payment status
        if ($allocatedSoFar >= $data['RenewalAmount']) {
            $invoice->update(['PaymentStatus' => 'Paid']);
        } elseif ($allocatedSoFar > 0) {
            $invoice->update(['PaymentStatus' => 'Partially Paid']);
        } else {
            $invoice->update(['PaymentStatus' => 'Unpaid']);
        }
    
        // 6) Decide if the member can become Active
        // We check how many months total from the membership's start date to the new end date:
        $monthsPaidSoFar = $this->calculateMonthsPaidSoFar($member);
    
        // Example rule: if they've effectively paid for >= 3 months, set to Active
        // and the invoice is fully paid
        if ($monthsPaidSoFar >= 3 && $invoice->PaymentStatus === 'Paid') {
            $member->MemberStatusID = 1; // 1 = ACTIVE
        } else {
            // Otherwise, stay NEW (ID=6) or keep their existing status
            // if you prefer to force it to remain "NEW MEMBER" if <3 months:
            $member->MemberStatusID = 6; // "NEW MEMBER"
        }
        $member->save();
    
        // 7) Return everything
        return response()->json([
            'renewal' => $renewal,
            'invoice' => $invoice,
            'payment' => $payment,
            'member'  => $member,
        ], 201);
    }
    
    
public function destroyRenewal($id)
{
    $renewal = MembershipRenewal::findOrFail($id);
    $renewal->delete();
    return response()->json(['message' => 'Renewal deleted'], 200);
}

/* ------------------------------------------------------------------
 * 4) MEMBERSHIP FREEZE
 * ------------------------------------------------------------------ */

 public function storeFreeze(Request $request)
 {
     $staff = auth('staff')->user();
 
     $data = $request->validate([
         'MemberID'        => 'required|exists:members,MemberID',
         'FreezeStartDate' => 'required|date',
         'FreezeEndDate'   => 'nullable|date|after_or_equal:FreezeStartDate',
         'Reason'          => 'nullable|string|max:255',
     ]);
 
     $member = Member::findOrFail($data['MemberID']);
 
     // Check if the member belongs to one of the staff's branches.
     if ($staff && !$staff->branches->pluck('BranchID')->contains($member->StartedBranchID)) {
         abort(403, 'Not your branch.');
     }
 
     // Attach the member's branch to the freeze record.
     $data['StartedBranchID'] = $member->StartedBranchID;
 
     $freeze = MembershipFreeze::create($data);
 
     // Update the member’s status to Frozen (assuming 2 = Frozen).
     $member->MemberStatusID = 2;
     $member->save();
 
     // Extend the MembershipEndDate by the freeze duration.
     $freezeStart = Carbon::parse($data['FreezeStartDate']);
     $freezeEnd   = $data['FreezeEndDate'] ? Carbon::parse($data['FreezeEndDate']) : $freezeStart;
     $freezeDays  = $freezeStart->diffInDays($freezeEnd) + 1;
 
     if ($member->MembershipEndDate) {
         $currentEnd = Carbon::parse($member->MembershipEndDate);
         $newEnd = $currentEnd->addDays($freezeDays);
         $member->MembershipEndDate = $newEnd->format('Y-m-d');
         $member->save();
     }
 
     return response()->json($freeze, 201);
 }
 
// 2) UPDATE an existing freeze
public function updateFreeze(Request $request, $id)
{
    $staff = auth('staff')->user();
    $freeze = MembershipFreeze::findOrFail($id);

    // Ensure the freeze's member belongs to one of the staff's branches.
    $member = $freeze->member;
    if ($staff && !$staff->branches->pluck('BranchID')->contains($member->StartedBranchID)) {
        abort(403, 'Not your branch.');
    }

    $data = $request->validate([
        'FreezeStartDate' => 'required|date',
        'FreezeEndDate'   => 'nullable|date|after_or_equal:FreezeStartDate',
        'Reason'          => 'nullable|string|max:255',
    ]);

    // Keep the original branch.
    $data['StartedBranchID'] = $freeze->StartedBranchID;

    $freeze->update($data);
    return response()->json($freeze, 200);
}


// 3) DELETE a freeze record and revert membership changes
public function destroyFreeze($id)
{
    $freeze = MembershipFreeze::findOrFail($id);
    $member = Member::findOrFail($freeze->MemberID);

    // Get the authenticated staff user.
    $staff = auth('staff')->user();

    // Use the staff's associated branch IDs for verification.
    if ($staff && !$staff->branches->pluck('BranchID')->contains($member->StartedBranchID)) {
        abort(403, 'Cannot remove freeze from another branch.');
    }

    // 1) Calculate freeze duration.
    $freezeStart = Carbon::parse($freeze->FreezeStartDate);
    $freezeEnd   = $freeze->FreezeEndDate ? Carbon::parse($freeze->FreezeEndDate) : $freezeStart;
    $totalFreezeDays = $freezeStart->diffInDays($freezeEnd) + 1;

    $today = Carbon::today();

    // Determine unused freeze days.
    if ($today <= $freezeStart) {
        $leftoverDays = $totalFreezeDays;
    } elseif ($today >= $freezeEnd) {
        $leftoverDays = 0;
    } else {
        $leftoverDays = $today->diffInDays($freezeEnd) + 1;
    }

    // 2) Subtract only the unused freeze days from the membership's end date.
    if (!empty($member->MembershipEndDate) && $leftoverDays > 0) {
        $currentEnd = Carbon::parse($member->MembershipEndDate);
        $newEnd = $currentEnd->subDays($leftoverDays);
        $member->MembershipEndDate = $newEnd->format('Y-m-d');
        $member->save();
    }

    // 3) Revert member status to Active (assuming '1' = Active).
    $member->MemberStatusID = 1;
    $member->save();

    // 4) Delete the freeze record.
    $freeze->delete();

    return response()->json([
        'message' => 'Freeze canceled. Unused freeze days removed, status reverted to Active.'
    ], 200);
}

public function growth()
{
    $growthData = \DB::table('members')
        ->select(
            'StartedBranchID as BranchID',
            \DB::raw("DATE_FORMAT(MembershipStartDate, '%b %Y') as month"),
            \DB::raw("COUNT(*) as count")
        )
        ->whereNotNull('MembershipStartDate')
        ->groupBy('StartedBranchID', 'month')
        ->orderByRaw("MIN(MembershipStartDate)")
        ->get();

    return response()->json($growthData, 200);
}


public function getLatestCardNumber()
{
    // Get the most recent card number (last registered member)
    $latestMember = Member::whereNotNull('MembershipCardNumber')
        ->where('MembershipCardNumber', 'LIKE', 'CARD-%')
        ->orderByDesc('MemberID') 
        ->first();

    // Default to "CARD-0000" if no records exist
    $latestCardNumber = $latestMember ? $latestMember->MembershipCardNumber : "CARD-0000";

    return response()->json(['latestCardNumber' => $latestCardNumber]);
}


    /**
     * Calculate how many whole months the member has paid for so far
     * by comparing MembershipStartDate and MembershipEndDate.
     */
    private function calculateMonthsPaidSoFar(Member $member)
    {
        // If start/end dates are missing, return 0
        if (empty($member->MembershipStartDate) || empty($member->MembershipEndDate)) {
            return 0;
        }

        $start = \Carbon\Carbon::parse($member->MembershipStartDate);
        $end   = \Carbon\Carbon::parse($member->MembershipEndDate);

        // Use diffInMonths for whole months difference
        // e.g. if start=Mar 5, end=Jun 4 => 2 months
        //      if start=Mar 5, end=Jun 5 => 3 months
        // If you want partial months to count, you can use floatDiffInMonths()
        // and do floor/ceil. For example:
        //   $months = floor($start->floatDiffInMonths($end));
        $months = $start->diffInMonths($end);

        return $months;
    }


}
