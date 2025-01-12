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
     * route: Owner,Admin,Staff
     */
    public function createMember()
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        // Get all membership plans for a dropdown (assuming no branch constraint on Plans)
        $plans = MembershipPlan::orderBy('PlanName')->get();

        // If staff can only create members for their own branch, 
        // we do not need to filter plans unless plan usage is branch-limited.
        // If you want to show the "StartedBranchID" explicitly, staff can't change it.
        // Admin/owner might pick a branch from a dropdown. Up to you.

        return Inertia::render('Membership/Member/Create', compact('plans'));
    }

    /**
     * Store a new Member record in the DB.
     */
    public function storeMember(Request $request)
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        // Validate fields based on ERD columns
        $data = $request->validate([
            'FullName'              => 'required|string|max:255',
            'Email'                 => 'required|email|unique:members,Email',
            'Phone'                 => 'nullable|string|max:50',
            'PlanID'                => 'nullable|exists:membership_plans,PlanID',
            'MembershipCardNumber'  => 'nullable|unique:members,MembershipCardNumber',
            'MembershipCardIssued'  => 'boolean',
            'MembershipStatus'      => 'required|string|max:50', 
            'MembershipStartDate'   => 'nullable|date',
            'MembershipEndDate'     => 'nullable|date|after_or_equal:MembershipStartDate',
            'Biometrics'            => 'nullable|string',
            'FreeSessions'          => 'nullable|integer',
            'Notes'                 => 'nullable|string',
        ]);

        // If staff => auto-assign StartedBranchID to staff->BranchID
        if ($staff) {
            $data['StartedBranchID'] = $staff->BranchID;
        } 
        // If owner/admin => they might pick "StartedBranchID" from a form or you do nothing (i.e., no assignment).
        // e.g. $data['StartedBranchID'] = $request->input('StartedBranchID');

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
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        // If staff => only see members from their branch
        if ($staff) {
            $members = Member::with('plan')
                ->where('StartedBranchID', $staff->BranchID)
                ->orderBy('MemberID','desc')
                ->get();
        } else {
            // Admin/Owner => see all
            $members = Member::with('plan')
                ->orderBy('MemberID','desc')
                ->get();
        }

        return Inertia::render('Membership/Member/Index', [
            'members' => $members
        ]);
    }

    /**
     * Show the edit form for a single Member.
     */
    public function editMember($id)
    {
        $staff = auth('staff')->user();

        $member = Member::findOrFail($id);

        // If staff => ensure the member belongs to staff->branch
        if ($staff && $member->StartedBranchID != $staff->BranchID) {
            abort(403, 'You cannot edit a member from another branch.');
        }

        $plans = MembershipPlan::orderBy('PlanName')->get();

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
        $staff = auth('staff')->user();

        $member = Member::findOrFail($id);

        // If staff => block if not in same branch
        if ($staff && $member->StartedBranchID != $staff->BranchID) {
            abort(403, 'You cannot update a member from another branch.');
        }

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

        // Staff cannot change StartedBranchID, so we skip that. Owner/Admin could do it if you want.
        // e.g. if you want to allow branch transfer, you'd handle that logic here.

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
        $staff = auth('staff')->user();

        $member = Member::findOrFail($id);

        // If staff => block if not same branch
        if ($staff && $member->StartedBranchID != $staff->BranchID) {
            abort(403, 'You cannot delete a member from another branch.');
        }

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
        // Usually membership plans are global, so no branch filter needed
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
            'Duration' => 'required|string|max:50',
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
     */
    public function createRenewal()
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        // If staff => only show members from staff->BranchID
        if ($staff) {
            $members = Member::where('StartedBranchID', $staff->BranchID)
                ->orderBy('FullName')
                ->get();
        } else {
            $members = Member::orderBy('FullName')->get();
        }

        $plans = MembershipPlan::orderBy('PlanName')->get();

        return Inertia::render('Membership/Renewal/Create', compact('members','plans'));
    }

    /**
     * Store a new MembershipRenewal record.
     */
    public function storeRenewal(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'MemberID'      => 'required|exists:members,MemberID',
            'RenewalDate'   => 'required|date',
            'PlanID'        => 'required|exists:membership_plans,PlanID',
            'RenewalAmount' => 'required|numeric|min:0',
        ]);

        // If staff => ensure the member is in staff->branch
        if ($staff) {
            $member = Member::findOrFail($data['MemberID']);
            if ($member->StartedBranchID != $staff->BranchID) {
                abort(403, 'You cannot renew a member from another branch.');
            }
        }

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
        $staff = auth('staff')->user();

        if ($staff) {
            // Only show renewals for members in staff->BranchID
            $renewals = MembershipRenewal::with(['member','plan'])
                ->whereHas('member', function($q) use ($staff) {
                    $q->where('StartedBranchID', $staff->BranchID);
                })
                ->orderBy('RenewalDate','desc')
                ->get();
        } else {
            // admin/owner => all
            $renewals = MembershipRenewal::with(['member','plan'])
                ->orderBy('RenewalDate','desc')
                ->get();
        }

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
        $staff = auth('staff')->user();

        if ($staff) {
            $members = Member::where('StartedBranchID', $staff->BranchID)
                ->orderBy('FullName')
                ->get();
        } else {
            $members = Member::orderBy('FullName')->get();
        }

        return Inertia::render('Membership/Freeze/Create', compact('members'));
    }

    /**
     * Store a new Freeze record.
     */
    public function storeFreeze(Request $request)
    {
        $staff = auth('staff')->user();

        $data = $request->validate([
            'MemberID'         => 'required|exists:members,MemberID',
            'FreezeStartDate'  => 'required|date',
            'FreezeEndDate'    => 'nullable|date|after_or_equal:FreezeStartDate',
            'Reason'           => 'nullable|string|max:255',
        ]);

        // If staff => ensure the member is in staff->branch
        if ($staff) {
            $member = Member::findOrFail($data['MemberID']);
            if ($member->StartedBranchID != $staff->BranchID) {
                abort(403, 'You cannot freeze a member from another branch.');
            }
        }

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
        $staff = auth('staff')->user();

        if ($staff) {
            // Only show freeze records for members in staff->BranchID
            $freezes = MembershipFreeze::with('member')
                ->whereHas('member', function($q) use ($staff) {
                    $q->where('StartedBranchID', $staff->BranchID);
                })
                ->orderBy('FreezeStartDate','desc')
                ->get();
        } else {
            // admin/owner => all
            $freezes = MembershipFreeze::with('member')
                ->orderBy('FreezeStartDate','desc')
                ->get();
        }

        return Inertia::render('Membership/Freeze/Index', compact('freezes'));
    }
}
