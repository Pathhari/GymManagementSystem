<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Member;
use App\Models\MembershipPlan;
use App\Models\MembershipRenewal;
use App\Models\MembershipFreeze;
use App\Models\Invoice;
use App\Models\InvoiceLineItem;
use Carbon\Carbon;


class MembershipController extends Controller
{
    /* ------------------------------------------------------------------
     * 1) MEMBERS
     * ------------------------------------------------------------------ */

    /**
     * Return JSON with members (and optionally walkIns, renewals, etc. if needed).
     * GET /membership/members
     */
    public function apiIndex()
    {
        $staff = auth('staff')->user();
    
        // 1) Fetch members
        if ($staff) {
            $members = Member::where('StartedBranchID', $staff->BranchID)
                             ->orderBy('MemberID','desc')
                             ->get();
            // Freeze records that belong to the staff's branch
            $freezes = MembershipFreeze::whereHas('member', function ($query) use ($staff) {
                $query->where('StartedBranchID', $staff->BranchID);
            })
            ->orderBy('FreezeID','desc')
            ->get();
        } else {
            // If admin/owner => fetch them all
            $members = Member::orderBy('MemberID','desc')->get();
            $freezes = MembershipFreeze::orderBy('FreezeID','desc')->get();
        }
        
        $renewals = MembershipRenewal::orderBy('RenewalID','desc')->get();

        $walkIns  = [];
        $logs     = [];
    
        return response()->json([
            'members'  => $members,
            'walkIns'  => $walkIns,
            'renewals' => $renewals,
            'freezes'  => $freezes, // <--- Real freeze rows from DB
            'logs'     => $logs,
        ]);
    }


    /**
     * Create a new member via Axios JSON.
     * POST /membership/members
     */

         // ** New: Search by name **
    public function apiSearchMembers(Request $request)
    {
        $q = $request->query('q', '');
        // E.g. "starts with" filter:
        $members = Member::where('FullName', 'like', $q . '%')
                    ->orderBy('FullName')
                    ->limit(30)
                    ->get(['MemberID','FullName']);
        
        return response()->json($members);
    }
    
    public function apiStoreMember(Request $request)
    {
        $data = $request->validate([
            'BranchID'             => 'nullable|exists:branches,BranchID',
            'FullName'             => 'required|string|max:255',
            'Email'                => 'required|email|unique:members,Email',
            'Phone'                => 'nullable|string|max:50',
            'PlanID'               => 'nullable|exists:membership_plans,PlanID',
            'MembershipCardNumber' => 'nullable|unique:members,MembershipCardNumber',
            'MembershipCardIssued' => 'boolean',
            'MemberStatusID'       => 'nullable|exists:member_statuses,MemberStatusID',
            'MembershipStartDate'  => 'nullable|date', // optional if front end wants to set
            'MembershipEndDate'    => 'nullable|date|after_or_equal:MembershipStartDate',
            'Biometrics'           => 'nullable|string',
            'FreeSessions'         => 'nullable|integer',
            'Notes'                => 'nullable|string',
            'PhotoFile'            => 'nullable|image|mimes:jpg,png,jpeg,gif|max:2048'
        ]);
    
        // If staff => override BranchID
        $staff = auth('staff')->user();
        if ($staff) {
            $data['StartedBranchID'] = $staff->BranchID;
        } else {
            $data['StartedBranchID'] = $data['BranchID'] ?? null;
        }
    
        // Handle photo upload
        if ($request->hasFile('PhotoFile')) {
            $filename = 'member_' . time() . '.' . $request->file('PhotoFile')->extension();
            $photoPath = $request->file('PhotoFile')->storeAs('member_photos', $filename, 'public');
            $data['PhotoPath'] = $photoPath;
        }
    
        // Default new members to Active if not specified
        $data['MemberStatusID'] = $data['MemberStatusID'] ?? 1;
    
        // 1) Create the member
        $member = Member::create($data);
    
        // 2) If a PlanID is given, auto-calc membership date
        if (!empty($data['PlanID'])) {
            $plan = MembershipPlan::find($data['PlanID']);
            if ($plan) {
                $durationDays = (int)$plan->Duration;
                $startDate = $member->MembershipStartDate 
                    ? Carbon::parse($member->MembershipStartDate)
                    : Carbon::today();
        
                $endDate = $startDate->copy()->addDays($durationDays - 1);
                $member->MembershipStartDate = $startDate->format('Y-m-d');
                $member->MembershipEndDate   = $endDate->format('Y-m-d');
                $member->save();
            }
        }
    
        return response()->json([
            'member' => $member
          ], 201);    }

    public function storeLockInMembership(Request $request)
    {
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
            'PhotoFile'            => 'nullable|image|mimes:jpg,png,jpeg,gif|max:2048'
        ]);
    
        // If staff => assign branch
        $staff = auth('staff')->user();
        if ($staff) {
            $data['StartedBranchID'] = $staff->BranchID;
        }
    
        // Handle photo upload if provided
        if ($request->hasFile('PhotoFile')) {
            $filename = 'member_' . time() . '.' . $request->file('PhotoFile')->extension();
            $photoPath = $request->file('PhotoFile')->storeAs('member_photos', $filename, 'public');
            $data['PhotoPath'] = $photoPath;
        }
    
        // Suppose ID=5 is "New Member (Lock-In)"
        $data['MemberStatusID']      = 5;
        $startDate                   = \Carbon\Carbon::today();
        $data['MembershipStartDate'] = $startDate->format('Y-m-d');
    
        // 1) Create the member
        $member = Member::create($data);
    
        // 2) Retrieve the plan (with LockInMonths, Price, etc.)
        $plan = MembershipPlan::findOrFail($request->PlanID);
        $lockInMonths = $plan->LockInMonths ?? 3;
    
        // End date = start date + lockInMonths months - 1 day
        $lockInEnd = $startDate->copy()->addMonths($lockInMonths)->subDay();
        $member->MembershipEndDate = $lockInEnd->format('Y-m-d');
        $member->save();
    
        // 3) Figure out billing day (15 or 30)
        $dayOfMonth = (int) $startDate->format('d');
        $billingDay = ($dayOfMonth <= 15) ? 15 : 30;
    
        // 4) Create monthly invoices
        $currentDate = $startDate->copy();
        for ($i = 1; $i <= $lockInMonths; $i++) {
            $dueDate = $this->getInvoiceDueDate($currentDate, $billingDay);
    
            $invoice = Invoice::create([
                'BranchID'     => $member->StartedBranchID,
                'MemberID'     => $member->MemberID,
                'InvoiceDate'  => $currentDate,
                'DueDate'      => $dueDate,
                'InvoiceTotal' => 0,
            ]);
    
            // If plan->Price is total for the entire lock-in, use (Price / lockInMonths).
            $monthlyFee = $plan->Price;
    
            InvoiceLineItem::create([
                'InvoiceID'   => $invoice->InvoiceID,
                'ItemType'    => 'Membership',
                'ItemID'      => $plan->PlanID,
                'Description' => "Lock-In Month #{$i}",
                'Quantity'    => 1,
                'UnitPrice'   => $monthlyFee,
                'Subtotal'    => $monthlyFee,
            ]);
    
            $invoice->load('invoice_line_items');
            $invoice->InvoiceTotal = $invoice->invoice_line_items->sum('Subtotal');
            $invoice->save();
    
            $currentDate->addMonthNoOverflow();
        }
    
        return response()->json([
            'message' => 'Lock-in membership created with monthly invoices!',
            'member'  => $member,
        ], 201);
    }
    

    /**
     * Update an existing member via Axios JSON.
     * PUT /membership/members/{id}
     */
    public function apiUpdateMember(Request $request, $id)
{
    $member = Member::findOrFail($id);

    // Staff => block updating cross‐branch
    $staff = auth('staff')->user();
    if ($staff && $member->StartedBranchID != $staff->BranchID) {
        abort(403, 'Cannot update member from another branch.');
    }

    $data = $request->validate([
        'BranchID'             => 'nullable|exists:branches,BranchID',
        'FullName'             => 'required|string|max:255',
        'Email'                => 'required|email|unique:members,Email,' . $member->MemberID . ',MemberID',
        'Phone'                => 'nullable|string|max:50',
        'PlanID'               => 'nullable|exists:membership_plans,PlanID',
        'MembershipCardNumber' => 'nullable|unique:members,MembershipCardNumber,' . $member->MemberID . ',MemberID',
        'MembershipCardIssued' => 'boolean',
        'MemberStatusID'       => 'required|exists:member_statuses,MemberStatusID',
        'MembershipStartDate'  => 'nullable|date',
        'MembershipEndDate'    => 'nullable|date|after_or_equal:MembershipStartDate',
        'Biometrics'           => 'nullable|string',
        'FreeSessions'         => 'nullable|integer',
        'Notes'                => 'nullable|string',
        'PhotoFile'            => 'nullable|image|mimes:jpg,png,jpeg,gif|max:2048'
    ]);

    // If staff => branch must remain the same
    if ($staff && isset($data['BranchID']) && $data['BranchID'] != $member->StartedBranchID) {
        abort(403, 'Staff cannot assign a different branch.');
    } else {
        $data['StartedBranchID'] = $data['BranchID'] ?? $member->StartedBranchID;
    }

    // Handle photo upload if provided
    if ($request->hasFile('PhotoFile')) {
        $filename = 'member_' . time() . '.' . $request->file('PhotoFile')->extension();
        $photoPath = $request->file('PhotoFile')->storeAs('member_photos', $filename, 'public');
        $data['PhotoPath'] = $photoPath;
    }

    $member->update($data);
    return response()->json($member, 200);
}

    /**
     * Delete a member via Axios JSON.
     * DELETE /membership/members/{id}
     */
    public function apiDestroyMember($id)
    {
        $member = Member::findOrFail($id);

        // If staff => block
        $staff = auth('staff')->user();
        if ($staff && $member->StartedBranchID != $staff->BranchID) {
            abort(403, 'Cannot delete member from another branch.');
        }

        $member->delete();
        return response()->json(['message' => 'Member deleted.'], 200);
    }

    public function indexMemberStatuses()
    {
        // Adjust model & table name as needed (if your model is MemberStatus).
        $statuses = \App\Models\MemberStatus::orderBy('MemberStatusID')->get();
        return response()->json($statuses, 200);
    }




    public function importLockInMember(Request $request)
    {
        // 1) Validate input
        $data = $request->validate([
            'BranchID'             => 'nullable|exists:branches,BranchID',
            'FullName'             => 'required|string|max:255',
            'Email'                => 'required|email|unique:members,Email,' . $member->MemberID . ',MemberID',
            'Phone'                => 'nullable|string|max:50',
            'PlanID'               => 'nullable|exists:membership_plans,PlanID',
            'MembershipCardNumber' => 'nullable|unique:members,MembershipCardNumber,' . $member->MemberID . ',MemberID',
            'MembershipCardIssued' => 'boolean',
            'MemberStatusID'       => 'required|exists:member_statuses,MemberStatusID',
            'MembershipStartDate'  => 'nullable|date',
            'MembershipEndDate'    => 'nullable|date|after_or_equal:MembershipStartDate',
            'Biometrics'           => 'nullable|string',
            'FreeSessions'         => 'nullable|integer',
            'Notes'                => 'nullable|string',
            'PhotoFile'            => 'nullable|image|mimes:jpg,png,jpeg,gif|max:2048',
            // Lock-in range:
            'LockInStart'          => 'required|date',
            'LockInEnd'            => 'required|date|after_or_equal:LockInStart',
        ]);
    
        // 2) If staff => assign branch
        $staff = auth('staff')->user();
        if ($staff) {
            $data['StartedBranchID'] = $staff->BranchID;
        }
    
        // Handle photo upload if provided
        $photoPath = null;
        if ($request->hasFile('PhotoFile')) {
            $filename = 'member_' . time() . '.' . $request->file('PhotoFile')->extension();
            $photoPath = $request->file('PhotoFile')->storeAs('member_photos', $filename, 'public');
        }
    
        // We'll treat them as "New Member (Lock-In)" => ID=5
        $data['MemberStatusID']      = 5;
        $data['MembershipStartDate'] = $data['LockInStart'];
        $data['MembershipEndDate']   = $data['LockInEnd'];
    
        // 3) Create the member
        $member = Member::create([
            'FullName'            => $data['FullName'],
            'Email'               => $data['Email'],
            'Phone'               => $data['Phone'] ?? null,
            'PlanID'              => $data['PlanID'],
            'StartedBranchID'     => $data['StartedBranchID'] ?? null,
            'MembershipCardNumber'=> $data['MembershipCardNumber'] ?? null,
            'MembershipCardIssued'=> $data['MembershipCardIssued'] ?? false,
            'MemberStatusID'      => 5,
            'MembershipStartDate' => $data['LockInStart'],
            'MembershipEndDate'   => $data['LockInEnd'],
            'Biometrics'          => $data['Biometrics'] ?? null,
            'FreeSessions'        => $data['FreeSessions'] ?? null,
            'Notes'               => $data['Notes'] ?? null,
            'PhotoPath'           => $photoPath,
        ]);
    
        // 4) Generate only future invoices from "today" onward
        return $this->generateRemainingLockInInvoices($member, $data['PlanID']);
    }

/**
 * This helper only creates invoices from "today" to the lock-in end date,
 * skipping months already passed if LockInStart was in the past.
 */
private function generateRemainingLockInInvoices(Member $member, $planID)
{
    $plan = MembershipPlan::findOrFail($planID);

    // For simplicity, treat plan->Price as a monthly fee.
    // If it's total for the entire lock-in, you'd need to 
    // divide by total months, or do partial logic yourself.
    $monthlyFee = $plan->Price;

    // Pull the lock-in range from member's dates
    $lockInStart = Carbon::parse($member->MembershipStartDate);
    $lockInEnd   = Carbon::parse($member->MembershipEndDate);

    $today = Carbon::today();

    // If the entire lock-in ends before or on today, no future invoices needed
    if ($lockInEnd->isBefore($today) || $lockInEnd->isSameDay($today)) {
        return response()->json([
            'message' => 'Member imported. Lock-in ends today/past, so no new invoices created.',
            'member'  => $member,
        ], 201);
    }

    // We'll start generating invoices from whichever is later: "today" or "LockInStart"
    $currentDate = ($lockInStart->isFuture() && $lockInStart->greaterThan($today))
        ? $lockInStart->copy()
        : $today->copy();

    // Decide billing day: if day <= 15 => 15, else => 30
    $dayOfMonth = (int) $currentDate->format('d');
    $billingDay = ($dayOfMonth <= 15) ? 15 : 30;

    $invoicesCreated = [];

    // Keep looping monthly until we pass LockInEnd
    while ($currentDate->isBefore($lockInEnd)) {
        $dueDate = $this->getInvoiceDueDate($currentDate, $billingDay);

        // If the chosen due date is beyond the entire lock-in, you can skip or create partial
        if ($dueDate->isAfter($lockInEnd)) {
            // Stop or handle partial month logic
            break;
        }

        // Create the invoice
        $invoice = Invoice::create([
            'BranchID'     => $member->StartedBranchID,
            'MemberID'     => $member->MemberID,
            'InvoiceDate'  => $currentDate,
            'DueDate'      => $dueDate,
            'InvoiceTotal' => 0,
        ]);

        // Add a line item for the monthly fee
        InvoiceLineItem::create([
            'InvoiceID'   => $invoice->InvoiceID,
            'ItemType'    => 'Membership',
            'ItemID'      => $planID,
            'Description' => "Lock-In (imported) Monthly Fee",
            'Quantity'    => 1,
            'UnitPrice'   => $monthlyFee,
            'Subtotal'    => $monthlyFee,
        ]);

        // Recalc invoice total
        $invoice->InvoiceTotal = $invoice->invoice_line_items->sum('Subtotal');
        $invoice->save();

        $invoicesCreated[] = $invoice->InvoiceID;

        // Move forward 1 month
        $currentDate->addMonthNoOverflow();
    }

    return response()->json([
        'message'  => 'Past lock-in member imported. Future invoices created if needed.',
        'member'   => $member,
        'invoices' => $invoicesCreated,
    ], 201);
}

/**
 * Same getInvoiceDueDate logic from storeLockInMembership
 */
    private function getInvoiceDueDate(Carbon $referenceDate, int $billingDay): Carbon
    {
    $year  = $referenceDate->year;
    $month = $referenceDate->month;

    $candidate = Carbon::create($year, $month, $billingDay, 0, 0, 0);
    if ($candidate->lessThan($referenceDate)) {
        $candidate->addMonthNoOverflow();
    }
    return $candidate;
    }

    /**
     * Example of how you might automatically update the member status 
     * after lock-in ends or if they renew to a normal plan, etc.
     */
    public function checkLockInStatus($memberId)
    {
        $member = Member::findOrFail($memberId);
        // If membership ended or no longer locked in, set to active:
        if (Carbon::parse($member->MembershipEndDate)->isPast()) {
            $member->MemberStatusID = 1; // 1 = Active
            $member->save();
        }
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
        // Use withCount to get the members count.
        $plans = MembershipPlan::withCount('members')->orderBy('PlanID')->get();
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
        'MemberID'      => 'required|exists:members,MemberID',
        'PlanID'        => 'required|exists:membership_plans,PlanID',
        'RenewalAmount' => 'required|numeric|min:0',
    ]);
    $data['RenewalDate'] = now();

    // 1) Create the renewal record (we store RenewalDate for reference)
    $renewal = MembershipRenewal::create($data);

    // 2) Figure out the new membership period for the member
    $member = Member::findOrFail($data['MemberID']);
    $plan   = MembershipPlan::findOrFail($data['PlanID']);

    $currentEnd = $member->MembershipEndDate 
      ? Carbon::parse($member->MembershipEndDate) 
      : null;
    $today = Carbon::today();
    $durationDays = (int) $plan->Duration;

    if ($currentEnd && $currentEnd->isFuture()) {
       // membership still active, so new membership starts next day
       $newStartDate = $currentEnd->copy()->addDay();
    } else {
       // membership expired or blank => start from today
       $newStartDate = $today;
    }

    // new end date is newStartDate + (durationDays - 1)
    $newEndDate = $newStartDate->copy()->addDays($durationDays - 1);

    // 3) Update the member’s membership
    $member->MembershipStartDate = $newStartDate->format('Y-m-d');
    $member->MembershipEndDate   = $newEndDate->format('Y-m-d');
    $member->MemberStatusID      = 1; // set them Active
    $member->save();

    // Return the created renewal record
    return response()->json($renewal, 201);
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

    // Staff branch check
    if ($staff) {
        $member = Member::findOrFail($data['MemberID']);
        if ($member->StartedBranchID != $staff->BranchID) {
            abort(403, 'Not your branch.');
        }
    }

    // 1) Create the freeze record
    $freeze = MembershipFreeze::create($data);

    // 2) Update the member’s status => set to "Frozen" (assuming '2' = Frozen)
    $member = Member::findOrFail($data['MemberID']);
    $member->MemberStatusID = 2; 
    $member->save();

    // 3) Extend the MembershipEndDate by the freeze duration
    //    3a) If FreezeEndDate is null, treat it as the same as FreezeStartDate
    $freezeStart = Carbon::parse($data['FreezeStartDate']);
    $freezeEnd   = $data['FreezeEndDate']
                     ? Carbon::parse($data['FreezeEndDate'])
                     : $freezeStart;

    // 3b) Calculate the total freeze days (+1 so e.g. Jan 20 - Jan 20 is 1 day)
    $freezeDays = $freezeStart->diffInDays($freezeEnd) + 1;

    // 3c) Only extend if MembershipEndDate is set (otherwise you can decide how to handle it)
    if ($member->MembershipEndDate) {
        $currentEnd = Carbon::parse($member->MembershipEndDate);
        // If you only want to extend if membership is still active, check if $currentEnd->isFuture()

        // 3d) Add the freezeDays
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

    // If staff => ensure this freeze's Member belongs to their branch
    // Assuming you have a relationship: $freeze->member
    if ($staff) {
        $member = $freeze->member; 
        if ($member->StartedBranchID != $staff->BranchID) {
            abort(403, 'Not your branch.');
        }
    }

    // Validate only the fields we can update
    $data = $request->validate([
        'FreezeStartDate' => 'required|date',
        'FreezeEndDate'   => 'nullable|date|after_or_equal:FreezeStartDate',
        'Reason'          => 'nullable|string|max:255',
    ]);

    $freeze->update($data);
    return response()->json($freeze, 200);
}

public function destroyFreeze($id)
{
    $freeze = MembershipFreeze::findOrFail($id);
    $member = Member::findOrFail($freeze->MemberID);

    // (Optional) staff-branch check
    $staff = auth('staff')->user();
    if ($staff && $member->StartedBranchID != $staff->BranchID) {
        abort(403, 'Cannot remove freeze from another branch.');
    }

    // 1) Figure out how many days of the freeze remain
    //    If FreezeEndDate is null, treat it as the same as FreezeStartDate or skip partial logic
    $freezeStart = Carbon::parse($freeze->FreezeStartDate);
    $freezeEnd   = $freeze->FreezeEndDate
        ? Carbon::parse($freeze->FreezeEndDate)
        : $freezeStart; // or treat null as indefinite freeze

    // Full freeze duration
    $totalFreezeDays = $freezeStart->diffInDays($freezeEnd) + 1;

    $today = Carbon::today();

    // If the freeze hasn't started yet (today < freezeStart),
    // then the entire freeze is unused, so leftover = total freeze days.
    // If we've passed the freezeEnd, leftover = 0 (nothing to revert).
    // Otherwise leftover = days from "today" to "freezeEnd".
    
    if ($today <= $freezeStart) {
        // Freeze hasn't begun, so revert all freeze days
        $leftoverDays = $totalFreezeDays;
    } elseif ($today >= $freezeEnd) {
        // Freeze fully used up or ended
        $leftoverDays = 0;
    } else {
        // Partial: used some days, some left
        $leftoverDays = $today->diffInDays($freezeEnd) + 1;
    }

    // 2) Subtract only the leftover freeze days from the membership
    //    if the membership end date is set
    if (!empty($member->MembershipEndDate) && $leftoverDays > 0) {
        $currentEnd = Carbon::parse($member->MembershipEndDate);

        // Ensure we don't accidentally go below the original date 
        // if there were multiple freeze/renew combos. For a simple approach, just:
        $newEnd = $currentEnd->subDays($leftoverDays);
        $member->MembershipEndDate = $newEnd->format('Y-m-d');
    }

    // 3) Revert status to Active (assuming '1' = Active)
    $member->MemberStatusID = 1;
    $member->save();

    // 4) Delete the freeze record
    $freeze->delete();

    return response()->json([
        'message' => 'Freeze canceled. Unused freeze days removed, status reverted to Active.'
    ], 200);
}

public function growth()
{
    // Group members by month (using MembershipStartDate) and count new members.
    $growthData = \DB::table('members')
        ->select(\DB::raw("DATE_FORMAT(MembershipStartDate, '%b %Y') as month"), \DB::raw("COUNT(*) as count"))
        ->whereNotNull('MembershipStartDate')
        ->groupBy('month')
        ->orderByRaw("MIN(MembershipStartDate)")
        ->get();

    return response()->json($growthData, 200);
}


}
