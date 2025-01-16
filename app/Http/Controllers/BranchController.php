<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Branch;

class BranchController extends Controller
{
    /**
     * Display all branches (Owner only).
     */
    public function index()
    {
        $branches = Branch::orderBy('BranchID')->get();
        return Inertia::render('System/Branches/Index', compact('branches'));
    }

    /**
     * Show form to create a new branch (Owner only).
     */
    public function create()
    {
        return Inertia::render('System/Branches/Create');
    }

    /**
     * Store a new Branch record.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'BranchName' => 'required|string|max:255',
            'Location'   => 'nullable|string|max:255',
            // … any other columns
        ]);

        Branch::create($data);

        return redirect()->route('system.branches.index')
            ->with('success','Branch created successfully.');
    }

    /**
     * Show form to edit an existing branch.
     */
    public function edit($id)
    {
        $branch = Branch::findOrFail($id);
        return Inertia::render('System/Branches/Edit', compact('branch'));
    }

    /**
     * Update an existing branch.
     */
    public function update(Request $request, $id)
    {
        $branch = Branch::findOrFail($id);

        $data = $request->validate([
            'BranchName' => 'required|string|max:255',
            'Location'   => 'nullable|string|max:255',
            // etc.
        ]);

        $branch->update($data);

        return redirect()->route('system.branches.index')
            ->with('success','Branch updated successfully.');
    }

    /**
     * Delete a branch.
     */
    public function destroy($id)
    {
        $branch = Branch::findOrFail($id);
        $branch->delete();

        return redirect()->route('system.branches.index')
            ->with('success','Branch removed successfully.');
    }
}
