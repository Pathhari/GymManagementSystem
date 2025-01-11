<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Member;
use App\Models\MembershipPlan;
use App\Models\MembershipRenewal;
use App\Models\MembershipFreeze;
use Illuminate\Support\Facades\Gate;

class MembershipController extends Controller
{
    /* ------------------------------------------------------------------
     * G. MEMBER TABLE (ERD #1)
     * ------------------------------------------------------------------ */

    /**
     * Show form to create a new Member.
     * Route-level middleware might be: role:Owner,Admin,Staff
     */
    public function createMember()
    {
        // Get all membership plans for a dropdown
        $plans = MembershipPlan::orderBy('PlanName')->get();

        return Inertia::render('Membership/Member/Create', compact('plans'));
    }

    /**
     * Store a new Member record in the DB.
     */
    public function storeMember(Request $request)
    {
        // Validate fields based on ERD columns
        $data = $request->validate([
            'FullName'              => 'required|string|max:255',
            'Email'                 => 'required|email|unique:members,Email',
            'Phone'                 => 'nullable|string|max:50',
            'PlanID'                => 'nullable|exists:membership_plans,PlanID',
            'MembershipCardNumber'  => 'nullable|unique:members,MembershipCardNumber',
            'MembershipCardIssued'  => 'boolean',
            'MembershipStatus'      => 'required|string|max:50', // e.g. 'active', 'expired', 'inactive'
            'MembershipStartDate'   => 'nullable|date',
            'MembershipEndDate'     => 'nullable|date|after_or_equal:MembershipStartDate',
            'Biometrics'            => 'nullable|string',
            'FreeSessions'          => 'nullable|integer',
            'Notes'                 => 'nullable|string',
        ]);

        // Create the member
        Member::create($data);

        return redirect()
            ->route('membership.members.index')
            ->with('success', 'Member created successfully.');
    }

    /**
     * Display a listing of Members (Read).
     * Possibly allow all roles.
     */
    public function indexMembers()
    {
        // Eager-load the plan relationship to avoid N+1
        $members = Member::with('plan')->orderBy('MemberID','desc')->get();

        return Inertia::render('Membership/Member/Index', [
            'members' => $members
        ]);
    }

    /**
     * Show the edit form for a single Member.
     */
    public function editMember($id)
    {
        $member = Member::findOrFail($id);
        $plans  = MembershipPlan::orderBy('PlanName')->get();

        return Inertia::render('Membership/Member/Edit', [
            'member' => $member,
            'plans'  => $plans
        ]);
    }

    /**
     * Update an existing Member record.
     */
    public function updateMember(Request $request, $id)
    {
        $member = Member::findOrFail($id);

        $data = $request->validate([
            'FullName'              => 'required|string|max:255',
            'Email'                 => 'required|email|unique:members,Email,'.$member->MemberID.',MemberID',
            'Phone'                 => 'nullable|string|max:50',
            'PlanID'                => 'nullable|exists:membership_plans,PlanID',
            'MembershipCardNumber'  => 'nullable|unique:members,MembershipCardNumber,'.$member->MemberID.',MemberID',
            'MembershipCardIssued'  => 'boolean',
            'MembershipStatus'      => 'required|string|max:50',
            'MembershipStartDate'   => 'nullable|date',
            'MembershipEndDate'     => 'nullable|date|after_or_equal:MembershipStartDate',
            'Biometrics'            => 'nullable|string',
            'FreeSessions'          => 'nullable|integer',
            'Notes'                 => 'nullable|string',
        ]);

        $member->update($data);

        return redirect()
            ->route('membership.members.index')
            ->with('success','Member updated successfully.');
    }

    /**
     * Delete or remove a Member record.
     * Usually route:Owner,Admin only
     */
    public function destroyMember($id)
    {
        $member = Member::findOrFail($id);
        $member->delete();

        return redirect()->back()->with('success','Member deleted successfully.');
    }


    /* ------------------------------------------------------------------
     * H. MEMBERSHIPPLAN TABLE (ERD #2)
     * ------------------------------------------------------------------ */

    /**
     * Display a list of membership plans.
     * Possibly route:Owner,Admin
     */
    public function indexPlans()
    {
        $plans = MembershipPlan::orderBy('PlanName')->get();

        return Inertia::render('Membership/Plan/Index', compact('plans'));
    }

    /**
     * Store a new MembershipPlan.
     */
    public function storePlan(Request $request)
    {
        $data = $request->validate([
            'PlanName' => 'required|string|max:255|unique:membership_plans,PlanName',
            'Price'    => 'required|numeric|min:0',
            'Duration' => 'required|string|max:50', // e.g. "1 month", "1 year"
            'Features' => 'nullable|string', 
        ]);

        MembershipPlan::create($data);

        return redirect()
            ->route('membership.plans.index')
            ->with('success','Membership plan created.');
    }

    /**
     * Update an existing MembershipPlan.
     */
    public function updatePlan(Request $request, $id)
    {
        $plan = MembershipPlan::findOrFail($id);

        $data = $request->validate([
            'PlanName' => 'required|string|max:255|unique:membership_plans,PlanName,'.$plan->PlanID.',PlanID',
            'Price'    => 'required|numeric|min:0',
            'Duration' => 'required|string|max:50',
            'Features' => 'nullable|string',
        ]);

        $plan->update($data);

        return redirect()
            ->route('membership.plans.index')
            ->with('success','Membership plan updated.');
    }

    /**
     * Delete a MembershipPlan.
     */
    public function destroyPlan($id)
    {
        $plan = MembershipPlan::findOrFail($id);
        $plan->delete();

        return redirect()->back()->with('success','Membership plan deleted.');
    }


    /* ------------------------------------------------------------------
     * I. MEMBERSHIPRENEWAL TABLE (ERD #3)
     * ------------------------------------------------------------------ */

    /**
     * Show form to create a new Membership Renewal.
     * route:Owner,Admin,Staff
     */
    public function createRenewal()
    {
        // Member + Plans for a dropdown
        $members = Member::orderBy('FullName')->get();
        $plans   = MembershipPlan::orderBy('PlanName')->get();

        return Inertia::render('Membership/Renewal/Create', compact('members','plans'));
    }

    /**
     * Store a new MembershipRenewal record.
     */
    public function storeRenewal(Request $request)
    {
        $data = $request->validate([
            'MemberID'      => 'required|exists:members,MemberID',
            'RenewalDate'   => 'required|date',
            'PlanID'        => 'required|exists:membership_plans,PlanID',
            'RenewalAmount' => 'required|numeric|min:0',
        ]);

        MembershipRenewal::create($data);

        return redirect()
            ->route('membership.renewals.logs')
            ->with('success','Renewal entry created.');
    }

    /**
     * View Renewal Logs.
     */
    public function renewalLogs()
    {
        // Eager load member & plan
        $renewals = MembershipRenewal::with(['member','plan'])
                    ->orderBy('RenewalDate','desc')
                    ->get();

        return Inertia::render('Membership/Renewal/Logs', compact('renewals'));
    }


    /* ------------------------------------------------------------------
     * J. MEMBERSHIPFREEZE TABLE (ERD #4)
     * ------------------------------------------------------------------ */

    /**
     * Show form to create a Freeze record.
     */
    public function createFreeze()
    {
        $members = Member::orderBy('FullName')->get();

        return Inertia::render('Membership/Freeze/Create', compact('members'));
    }

    /**
     * Store a new Freeze record.
     */
    public function storeFreeze(Request $request)
    {
        $data = $request->validate([
            'MemberID'         => 'required|exists:members,MemberID',
            'FreezeStartDate'  => 'required|date',
            'FreezeEndDate'    => 'nullable|date|after_or_equal:FreezeStartDate',
            'Reason'           => 'nullable|string|max:255',
        ]);

        MembershipFreeze::create($data);

        return redirect()
            ->route('membership.freezes.index')
            ->with('success','Membership freeze created.');
    }

    /**
     * Index Freeze records.
     */
    public function indexFreezes()
    {
        $freezes = MembershipFreeze::with('member')
                   ->orderBy('FreezeStartDate','desc')
                   ->get();

        return Inertia::render('Membership/Freeze/Index', compact('freezes'));
    }
}
