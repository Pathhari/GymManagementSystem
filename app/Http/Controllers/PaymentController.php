<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
// Models
use App\Models\Payment;
use App\Models\Member;
use App\Models\Invoice;
use App\Models\PaymentInvoice;
use App\Models\SystemSetting; // If storing PayMongo keys, fee rules in DB
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /* ------------------------------------------------------------------
     * A) Payment Setup & Configuration
     * ------------------------------------------------------------------ */

    /**
     * 1. PayMongo API Credentials (route => role:Owner)
     * Shows a form to view/change PayMongo API keys.
     */
    public function viewPayMongoCredentials()
    {
        // Optional gate check (in addition to route-level 'role:Owner')
        if (Gate::denies('view-paymongo-creds')) {
            abort(403, 'You do not have permission to view PayMongo credentials.');
        }

        // Load from system_settings, or from .env
        $setting = SystemSetting::where('key','paymongo_api_key')->first();
        $apiKey = $setting ? $setting->value : '';

        return Inertia::render('Payments/Setup/PayMongoCredentials', [
            'credentials' => [
                'apiKey' => $apiKey
            ]
        ]);
    }

    /**
     * Update PayMongo credentials in DB or .env
     */
    public function updatePayMongoCredentials(Request $request)
    {
        $data = $request->validate([
            'apiKey' => 'required|string|max:255',
        ]);

        // Store in system_settings
        SystemSetting::updateOrCreate(
            ['key'=>'paymongo_api_key'],
            ['value'=>$data['apiKey']]
        );

        return redirect()->back()->with('success', 'PayMongo credentials updated successfully.');
    }

    /**
     * 2. Transaction Fee Rules / Markups (role:Owner,Admin)
     * View fee rules stored in system_settings => cardFee, cardFixed, etc.
     */
    public function viewFeeRules()
    {
        if (Gate::denies('set-fee-rules')) {
            abort(403, 'You do not have permission to set fee rules.');
        }

        // Suppose we have keys: 'card_fee', 'card_fixed'
        $cardFeeSetting   = SystemSetting::where('key','card_fee')->first();
        $cardFixedSetting = SystemSetting::where('key','card_fixed')->first();

        $feeRules = [
            'cardFee'   => $cardFeeSetting   ? $cardFeeSetting->value : 3.5,
            'cardFixed' => $cardFixedSetting ? $cardFixedSetting->value : 15
        ];

        return Inertia::render('Payments/Setup/FeeRules', [
            'feeRules' => $feeRules
        ]);
    }

    public function updateFeeRules(Request $request)
    {
        $data = $request->validate([
            'cardFee'   => 'required|numeric|min:0',
            'cardFixed' => 'required|numeric|min:0',
        ]);

        SystemSetting::updateOrCreate(['key'=>'card_fee'],   ['value'=>$data['cardFee']]);
        SystemSetting::updateOrCreate(['key'=>'card_fixed'], ['value'=>$data['cardFixed']]);

        return redirect()->back()->with('success', 'Transaction fee rules updated successfully.');
    }

    /**
     * 3. Enable/Disable Payment Methods (role:Owner,Admin)
     */
    public function indexPaymentMethods()
    {
        // You could store each method in system_settings as well, e.g. 'method_card_enabled' => true
        // We'll just show a static array for demonstration
        $methods = [
            ['name' => 'Card', 'enabled' => true],
            ['name' => 'E-Wallet', 'enabled' => false],
            ['name' => 'OnlineBanking', 'enabled' => true],
        ];

        return Inertia::render('Payments/Setup/PaymentMethods', [
            'methods' => $methods
        ]);
    }

    public function togglePaymentMethod(Request $request)
    {
        $data = $request->validate([
            'methodName' => 'required|string|max:50',
            'enabled'    => 'required|boolean',
        ]);

        // If you want to store in DB, do so. For now, just success response
        return redirect()->back()->with('success', 'Payment method toggled.');
    }


    /* ------------------------------------------------------------------
     * B) Transaction Logs
     * ------------------------------------------------------------------ */

    /**
     * 4. View all Payment Transactions
     * If staff => read-only columns
     */
    public function indexTransactions()
    {
        $user = auth()->user();

        if ($user && $user->role === 'Staff') {
            // Staff sees partial columns
            $payments = Payment::select('PaymentID','MemberID','Amount','Status','PaymentDate')
                               ->orderBy('PaymentDate','desc')
                               ->get();
        } else {
            // Owner/Admin see everything
            $payments = Payment::with('member')->orderBy('PaymentDate','desc')->get();
        }

        return Inertia::render('Payments/Transactions/Index', [
            'payments' => $payments
        ]);
    }

    /**
     * 5. Export/Print transaction histories (role:Owner,Admin)
     */
    public function exportTransactions()
    {
        // Example: generate CSV from Payment
        $allPayments = Payment::orderBy('PaymentDate','desc')->get();

        $csvLines = [];
        $csvLines[] = "PaymentID,MemberID,Amount,Status,PaymentDate";
        foreach ($allPayments as $p) {
            $csvLines[] = "{$p->PaymentID},{$p->MemberID},{$p->Amount},{$p->Status},{$p->PaymentDate}";
        }
        $csvContent = implode("\n", $csvLines);

        return response($csvContent)
                ->header('Content-Type','text/csv')
                ->header('Content-Disposition','attachment; filename=transactions.csv');
    }


    /* ------------------------------------------------------------------
     * C) Issue Refunds (PayMongo)
     * ------------------------------------------------------------------ */

    /**
     * 6. Initiate Refunds (role:Owner,Admin)
     */
    public function initiateRefund(Request $request, $paymentId)
    {
        $payment = Payment::findOrFail($paymentId);
        // If payment is 'Completed', we can mark it as 'RefundRequested'
        if ($payment->Status !== 'Completed') {
            return redirect()->back()->with('error','Refund cannot be initiated for non-completed payments.');
        }

        // Possibly call PayMongo API. For now, let's just mark it:
        $payment->update(['Status'=>'RefundRequested']);

        return redirect()->back()->with('success','Refund initiated successfully.');
    }

    /**
     * 7. Approve Refunds (2-step) (role:Owner,Admin)
     */
    public function approveRefund(Request $request, $paymentId)
    {
        $payment = Payment::findOrFail($paymentId);

        if ($payment->Status !== 'RefundRequested') {
            return redirect()
                ->route('payments.transactions.index')
                ->with('error','No pending refund request for this payment.');
        }

        // Final step => call PayMongo or set status = 'Refunded'
        $payment->update(['Status'=>'Refunded']);

        return redirect()
            ->route('payments.transactions.index')
            ->with('success','Refund approved successfully.');
    }


    /* ------------------------------------------------------------------
     * K) Payment (Direct Table) CRUD
     * ------------------------------------------------------------------ */

    /**
     * 27. Create Payment Record => route:Owner,Admin,Staff
     * Show a form to record a payment.
     */
    public function create()
    {
        $members = Member::orderBy('FullName','asc')->get();

        return Inertia::render('Payments/Direct/Create', compact('members'));
    }

    /**
     * Store a new Payment row.
     */
    public function store(Request $request)
    {
        // Payment table: PaymentFor, PaymentMethod, Amount, PaymentDate, Status, etc.
        $data = $request->validate([
            'MemberID'        => 'nullable|exists:members,MemberID',
            'PaymentFor'      => 'required|string|max:50', // e.g. "Membership", "Session", "Facility"
            'PaymentMethod'   => 'required|string|max:50', // e.g. "Cash","GCash","BPI"
            'Amount'          => 'required|numeric|min:0',
            'PaymentDate'     => 'required|date',
            'Status'          => 'required|string|max:50',   // e.g. "Completed","Pending"
            'FailureReason'   => 'nullable|string|max:255',
        ]);

        Payment::create($data);

        return redirect()->route('payments.index')->with('success','Payment created successfully.');
    }

    /**
     * 28. Read Payment Records => route:All
     */
    public function index()
    {
        $payments = Payment::with('member')
                    ->orderBy('PaymentDate','desc')
                    ->get();

        return Inertia::render('Payments/Direct/Index', [
            'payments' => $payments
        ]);
    }

    /**
     * 29. Update Payment Info => route:All
     * Show edit form & process
     */
    public function edit($id)
    {
        $payment = Payment::findOrFail($id);
        $members = Member::orderBy('FullName','asc')->get();

        return Inertia::render('Payments/Direct/Edit', compact('payment','members'));
    }

    public function update(Request $request, $id)
    {
        $payment = Payment::findOrFail($id);

        $data = $request->validate([
            'MemberID'       => 'nullable|exists:members,MemberID',
            'PaymentFor'     => 'required|string|max:50',
            'PaymentMethod'  => 'required|string|max:50',
            'Amount'         => 'required|numeric|min:0',
            'PaymentDate'    => 'required|date',
            'Status'         => 'required|string|max:50',
            'FailureReason'  => 'nullable|string|max:255',
        ]);

        $payment->update($data);

        return redirect()->route('payments.index')->with('success','Payment updated successfully.');
    }

    /**
     * 30. Delete Payment => route:All
     */
    public function destroy($id)
    {
        $payment = Payment::findOrFail($id);
        $payment->delete();

        return redirect()->route('payments.index')->with('success','Payment deleted successfully.');
    }


    /* ------------------------------------------------------------------
     * M) Partial / Multiple Payments
     * PaymentInvoice bridging table
     * ------------------------------------------------------------------ */

    /**
     * 35. Create Partial Payments => route:All
     * Show a form to create a partial payment for an invoice or multiple invoices.
     */
    public function createPartialPayment()
    {
        // Perhaps you want to list all open invoices:
        $invoices = Invoice::whereNull('PaymentStatus')
                    ->orWhere('PaymentStatus','!=','Paid')
                    ->orderBy('InvoiceDate','desc')
                    ->get();

        return Inertia::render('Payments/Partial/Create', [
            'invoices' => $invoices
        ]);
    }

    /**
     * Store partial payment
     */
    public function storePartialPayment(Request $request)
    {
        // We create a Payment, then link it partially to one or more invoices via PaymentInvoice
        $data = $request->validate([
            'MemberID'       => 'nullable|exists:members,MemberID',
            'PaymentFor'     => 'required|string|max:50',
            'PaymentMethod'  => 'required|string|max:50',
            'Amount'         => 'required|numeric|min:0',
            'PaymentDate'    => 'required|date',
            'Status'         => 'required|string|max:50',
            'allocatedInvoices' => 'required|array|min:1', 
            // e.g. allocatedInvoices => [ {invoiceId:..., amountAllocated:...}, {...} ]
        ]);

        // Start DB transaction
        DB::transaction(function () use ($data) {
            // 1) Create Payment
            $payment = Payment::create([
                'MemberID'      => $data['MemberID'] ?? null,
                'PaymentFor'    => $data['PaymentFor'],
                'PaymentMethod' => $data['PaymentMethod'],
                'Amount'        => $data['Amount'],
                'PaymentDate'   => $data['PaymentDate'],
                'Status'        => $data['Status'],
            ]);

            // 2) Link Payment to each invoice in allocatedInvoices
            foreach ($data['allocatedInvoices'] as $alloc) {
                $invoiceId = $alloc['invoiceId'];
                $allocated = $alloc['amountAllocated'];

                PaymentInvoice::create([
                    'PaymentID'     => $payment->PaymentID,
                    'InvoiceID'     => $invoiceId,
                    'AmountAllocated' => $allocated
                ]);

                // Optionally update invoice's PaymentStatus or partial
                $invoice = Invoice::findOrFail($invoiceId);
                // If total allocated >= invoice total => set invoice PaymentStatus = 'Paid'
                $newStatus = ($allocated >= $invoice->InvoiceTotal) ? 'Paid' : 'Partially Paid';
                $invoice->update(['PaymentStatus' => $newStatus]);
            }
        });

        return redirect()->route('payments.index')->with('success','Partial payment created and allocated.');
    }

    /**
     * 36. Link Multiple Payments => route:All
     * e.g. combine e-wallet + cash for the same invoice
     */
    public function linkPaymentsToInvoice(Request $request, $invoiceId)
    {
        $invoice = Invoice::findOrFail($invoiceId);

        $data = $request->validate([
            'paymentIds'       => 'required|array|min:1', // e.g. [1,2]
            'allocation'       => 'required|array',       // keyed by paymentId => amount
        ]);

        // e.g. 'allocation' => [ 1 => 300, 2 =>200 ] meaning Payment #1 gives 300, Payment #2 gives 200
        DB::transaction(function() use ($invoice, $data) {
            $sumAlloc = 0;

            foreach ($data['paymentIds'] as $pid) {
                $allocAmount = $data['allocation'][$pid] ?? 0;
                if ($allocAmount <= 0) continue;

                PaymentInvoice::create([
                    'PaymentID'       => $pid,
                    'InvoiceID'       => $invoice->InvoiceID,
                    'AmountAllocated' => $allocAmount
                ]);

                $sumAlloc += $allocAmount;
            }

            // If sumAlloc >= invoice->InvoiceTotal => mark invoice as 'Paid'
            if ($sumAlloc >= $invoice->InvoiceTotal) {
                $invoice->update(['PaymentStatus' => 'Paid']);
            } else {
                $invoice->update(['PaymentStatus' => 'Partially Paid']);
            }
        });

        return redirect()->route('invoices.show', $invoiceId)
                         ->with('success','Payments allocated successfully.');
    }
}
