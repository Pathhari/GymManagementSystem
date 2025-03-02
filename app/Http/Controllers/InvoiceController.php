<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    // GET /invoices
    public function index()
    {
        // Eager-load relationships if needed
        $invoices = Invoice::with(['member', 'monthlyClient', 'branch', 'promotion'])->get();
        // Return JSON so your React front end can map it
        return response()->json($invoices);
    }

    // POST /invoices
    public function store(Request $request)
    {
        $data = $request->validate([
            'BranchID'     => 'nullable|exists:branches,BranchID',
            'MemberID'     => 'nullable|exists:members,MemberID',
            'PromotionID'  => 'nullable|exists:promotions,PromotionID',
            'InvoiceDate'  => 'required|date',
            'DueDate'      => 'nullable|date',
            'InvoiceTotal' => 'required|numeric|min:0',
        ]);

        $invoice = Invoice::create($data);
        return response()->json($invoice, 201);
    }

    // GET /invoices/{id}
    public function show($id)
    {
        // show single invoice with relationships
        $invoice = Invoice::with(['member','promotion','branch','lineItems','payments'])
            ->findOrFail($id);

        return response()->json($invoice);
    }

    // PUT /invoices/{id}
    public function update(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);

        $data = $request->validate([
            'BranchID'     => 'nullable|exists:branches,BranchID',
            'MemberID'     => 'nullable|exists:members,MemberID',
            'PromotionID'  => 'nullable|exists:promotions,PromotionID',
            'InvoiceDate'  => 'required|date',
            'DueDate'      => 'nullable|date',
            'InvoiceTotal' => 'required|numeric|min:0',
        ]);

        $invoice->update($data);
        return response()->json($invoice);
    }

    public function destroy($id)
    {
        $invoice = Invoice::findOrFail($id);
    
        // Optionally do checks or validations here,
        // e.g. if invoice is fully paid, confirm user wants to delete, etc.
    
        $invoice->delete();
    
        return response()->json([
            'message' => "Invoice #{$id} deleted successfully."
        ], 200);
    }
    
}
