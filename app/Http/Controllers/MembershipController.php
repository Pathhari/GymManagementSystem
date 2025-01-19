<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Member;
use App\Models\MembershipPlan;
use App\Models\MembershipRenewal;
use App\Models\MembershipFreeze;

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
        // If staff => only their branch; otherwise all
        $staff = auth('staff')->user();
        if ($staff) {
            $members = Member::where('StartedBranchID', $staff->BranchID)
                ->orderBy('MemberID','desc')->get();
        } else {
            $members = Member::orderBy('MemberID','desc')->get();
        }

        // If you also want to return walkIns, etc.
        $walkIns  = [];  // or fetch from your WalkIn model
        $renewals = [];  // ...
        $freezes  = [];
        $logs     = [];

        return response()->json([
            'members'  => $members,
            'walkIns'  => $walkIns,
            'renewals' => $renewals,
            'freezes'  => $freezes,
            'logs'     => $logs,
        ]);
    }

    /**
     * Create a new member via Axios JSON.
     * POST /membership/members
     */
    public function apiStoreMember(Request $request)
    {
        $data = $request->validate([
            'FullName'             => 'required|string|max:255',
            'Email'                => 'required|email|unique:members,Email',
            'Phone'                => 'nullable|string|max:50',
            // PlanID from the front end might be a numeric ID or a "slug" like "1MonthBasic"
            // If numeric, you can do 'PlanID' => 'nullable|exists:membership_plans,PlanID'
            'PlanID'               => 'nullable|exists:membership_plans,PlanID',
            'MembershipCardNumber' => 'nullable|unique:members,MembershipCardNumber',
            'MembershipCardIssued' => 'boolean',
            'MembershipStatus'     => 'required|string|max:50',
            'MembershipStartDate'  => 'nullable|date',
            'MembershipEndDate'    => 'nullable|date|after_or_equal:MembershipStartDate',
            'Biometrics'           => 'nullable|string',
            'FreeSessions'         => 'nullable|integer',
            'Notes'                => 'nullable|string',
        ]);

        // If staff => force their BranchID
        $staff = auth('staff')->user();
        if ($staff) {
            $data['StartedBranchID'] = $staff->BranchID;
        }

        $member = Member::create($data);
        return response()->json($member, 201);
    }

    /**
     * Update an existing member via Axios JSON.
     * PUT /membership/members/{id}
     */
    public function apiUpdateMember(Request $request, $id)
    {
        $member = Member::findOrFail($id);

        // If staff => block updating members of another branch
        $staff = auth('staff')->user();
        if ($staff && $member->StartedBranchID != $staff->BranchID) {
            abort(403, 'Cannot update member from another branch.');
        }

        $data = $request->validate([
            'FullName'             => 'required|string|max:255',
            'Email'                => 'required|email|unique:members,Email,' . $member->MemberID . ',MemberID',
            'Phone'                => 'nullable|string|max:50',
            'PlanID'               => 'nullable|exists:membership_plans,PlanID',
            'MembershipCardNumber' => 'nullable|unique:members,MembershipCardNumber,' . $member->MemberID . ',MemberID',
            'MembershipCardIssued' => 'boolean',
            'MembershipStatus'     => 'required|string|max:50',
            'MembershipStartDate'  => 'nullable|date',
            'MembershipEndDate'    => 'nullable|date|after_or_equal:MembershipStartDate',
            'Biometrics'           => 'nullable|string',
            'FreeSessions'         => 'nullable|integer',
            'Notes'                => 'nullable|string',
        ]);

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

    /* ------------------------------------------------------------------
     * 2) MEMBERSHIP PLANS
     * ------------------------------------------------------------------ */

    /**
     * Return all membership plans as JSON.
     * GET /membership/plans
     */
    public function indexPlans()
    {
        $plans = MembershipPlan::orderBy('PlanID')->get();
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
            'Duration' => 'required|string|max:50',
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
            'Duration' => 'required|string|max:50',
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
        $staff = auth('staff')->user();
        $data = $request->validate([
            'MemberID'      => 'required|exists:members,MemberID',
            'RenewalDate'   => 'required|date',
            'PlanID'        => 'required|exists:membership_plans,PlanID',
            'RenewalAmount' => 'required|numeric|min:0',
        ]);

        if ($staff) {
            $member = Member::findOrFail($data['MemberID']);
            if ($member->StartedBranchID != $staff->BranchID) {
                abort(403, 'Not your branch.');
            }
        }

        $renewal = MembershipRenewal::create($data);
        return response()->json($renewal, 201);
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

        if ($staff) {
            $member = Member::findOrFail($data['MemberID']);
            if ($member->StartedBranchID != $staff->BranchID) {
                abort(403, 'Not your branch.');
            }
        }

        $freeze = MembershipFreeze::create($data);
        return response()->json($freeze, 201);
    }
}
