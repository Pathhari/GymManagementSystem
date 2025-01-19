<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Branch;

class BranchController extends Controller
{
    /**
     * Return all branches as JSON.
     * Example GET /owner/branches
     */
    public function indexJson(Request $request)
    {
        // If you want to filter or order, you can do so here
        $branches = Branch::orderBy('BranchID', 'asc')->get();

        // Transform if you want to unify naming
        // or just return them raw. We'll add "Status" or "Contact" if those columns exist in the DB
        $data = $branches->map(function($b) {
            return [
                'BranchID'   => $b->BranchID,
                'BranchName' => $b->BranchName,
                'Location'   => $b->Location,
                // If your DB has these columns:
                'Status'     => $b->Status ?? 'Active', 
                'Contact'    => $b->Contact ?? '',
            ];
        });

        // Return JSON
        return response()->json(['branches' => $data]);
    }

    /**
     * Store a new branch (POST /owner/branches).
     */
    public function storeJson(Request $request)
    {
        // Validate
        $data = $request->validate([
            'BranchName' => 'required|string|max:255',
            'Location'   => 'nullable|string|max:255',
            // Add 'Status' => 'required|string' if you want
            // Add 'Contact' => 'nullable|string' if you want
        ]);

        // If your branches table has Status, Contact, etc., add them as well
        // e.g. 'Status' => $request->input('Status','Active')

        $branch = Branch::create($data);

        return response()->json([
            'message' => 'Branch created successfully.',
            'branch'  => $branch
        ], 201);
    }

    /**
     * Update an existing branch (PUT /owner/branches/{id}).
     */
    public function updateJson(Request $request, $id)
    {
        $branch = Branch::findOrFail($id);

        $data = $request->validate([
            'BranchName' => 'required|string|max:255',
            'Location'   => 'nullable|string|max:255',
            // Add 'Status' => 'required|string' if you have that column
            // Add 'Contact' => 'nullable|string' if you have that column
        ]);

        $branch->update($data);

        return response()->json([
            'message' => 'Branch updated successfully.',
            'branch'  => $branch
        ]);
    }

    /**
     * Delete a branch (DELETE /owner/branches/{id}).
     */
    public function destroyJson($id)
    {
        $branch = Branch::findOrFail($id);
        $branch->delete();

        return response()->json(['message' => 'Branch removed successfully.']);
    }
}
