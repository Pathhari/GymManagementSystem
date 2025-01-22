<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{   

    public function index()
    {
        $branches = Branch::all();
        return response()->json($branches);
    }
    public function indexJson()
    {
        $branches = Branch::orderBy('BranchID', 'asc')->get();
        return response()->json([
            'branches' => $branches
        ]);
    }

    public function storeJson(Request $request)
    {
        $data = $request->validate([
            'BranchName' => 'required|string|max:255',
            'Location'   => 'nullable|string|max:255',
            'Status'     => 'nullable|string|max:50',
            'Contact'    => 'nullable|string|max:255',
        ]);

        $branch = Branch::create($data);

        // Return the new branch or just a success message
        return response()->json([
            'message' => 'Branch created successfully.',
            'branch'  => $branch
        ], 201);
    }

    public function updateJson(Request $request, $id)
    {
        $branch = Branch::findOrFail($id);

        $data = $request->validate([
            'BranchName' => 'required|string|max:255',
            'Location'   => 'nullable|string|max:255',
            'Status'     => 'nullable|string|max:50',
            'Contact'    => 'nullable|string|max:255',
        ]);

        $branch->update($data);

        return response()->json([
            'message' => 'Branch updated successfully.',
            'branch'  => $branch
        ]);
    }

    public function destroyJson($id)
    {
        $branch = Branch::findOrFail($id);
        $branch->delete();

        return response()->json([
            'message' => 'Branch removed successfully.'
        ]);
    }
}
