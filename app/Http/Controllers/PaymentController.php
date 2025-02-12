<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Payment;
use App\Models\Member;
use App\Models\Invoice;
use App\Models\PaymentInvoice;
use App\Models\SystemSetting; // If storing PayMongo keys or fee rules in DB
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /* ------------------------------------------------------------------
     * A) Payment Setup & Configuration
     * ------------------------------------------------------------------ */

    /**
     * 1. PayMongo API Credentials (owner-only route)
     * Show a form for viewing/updating PayMongo API keys.
     */
    public function viewPayMongoCredentials()
    {
        // Additional Gate check if you want (beyond route-level middleware)
        if (Gate::denies('view-paymongo-creds')) {
            abort(403, 'You do not have permission to view PayMongo credentials.');
        }

        // Load from system_settings or from .env
        $setting = SystemSetting::where('key', 'paymongo_api_key')->first();
        $apiKey  = $setting ? $setting->value : '';

        return Inertia::render('Payments/Setup/PayMongoCredentials', [
            'credentials' => [
                'apiKey' => $apiKey
            ],
        ]);
    }

    /**
     * Update PayMongo credentials in system_settings or .env
     */
    public function updatePayMongoCredentials(Request $request)
    {
        $data = $request->validate([
            'apiKey' => 'required|string|max:255',
        ]);

        SystemSetting::updateOrCreate(
            ['key' => 'paymongo_api_key'],
            ['value' => $data['apiKey']]
        );

        return redirect()
            ->back()
            ->with('success', 'PayMongo credentials updated successfully.');
    }

    /**
     * 2. Transaction Fee Rules / Markups (Owner,Admin)
     */
    public function viewFeeRules()
    {
        if (Gate::denies('set-fee-rules')) {
            abort(403, 'You do not have permission to set fee rules.');
        }

        // Suppose we store keys: 'card_fee', 'card_fixed'
        $cardFeeSetting   = SystemSetting::where('key','card_fee')->first();
        $cardFixedSetting = SystemSetting::where('key','card_fixed')->first();

        $feeRules = [
            'cardFee'   => $cardFeeSetting   ? $cardFeeSetting->value : 3.5,
            'cardFixed' => $cardFixedSetting ? $cardFixedSetting->value : 15,
        ];

        return Inertia::render('Payments/Setup/FeeRules', [
            'feeRules' => $feeRules,
        ]);
    }

    public function updateFeeRules(Request $request)
    {
        $data = $request->validate([
            'cardFee'   => 'required|numeric|min:0',
            'cardFixed' => 'required|numeric|min:0',
        ]);

        SystemSetting::updateOrCreate(['key' => 'card_fee'],   ['value' => $data['cardFee']]);
        SystemSetting::updateOrCreate(['key' => 'card_fixed'], ['value' => $data['cardFixed']]);

        return redirect()
            ->back()
            ->with('success', 'Transaction fee rules updated successfully.');
    }

    /**
     * 3. Enable/Disable Payment Methods (Owner,Admin)
     */
    public function indexPaymentMethods()
    {
        // Could also store each method in system_settings; 
        // for demonstration, we show a static array:
        $methods = [
            ['name' => 'Card',           'enabled' => true],
            ['name' => 'E-Wallet',       'enabled' => false],
            ['name' => 'OnlineBanking',  'enabled' => true],
        ];

        return Inertia::render('Payments/Setup/PaymentMethods', [
            'methods' => $methods,
        ]);
    }

    public function togglePaymentMethod(Request $request)
    {
        $data = $request->validate([
            'methodName' => 'required|string|max:50',
            'enabled'    => 'required|boolean',
        ]);

        // If storing in DB, update or create a setting:
        // SystemSetting::updateOrCreate(['key' => 'method_'.$data['methodName']], ['value' => $data['enabled']]);

        return redirect()
            ->back()
            ->with('success', 'Payment method toggled.');
    }


    /* ------------------------------------------------------------------
     * B) Transaction Logs
     * ------------------------------------------------------------------ */

    /**
     * 4. View all Payment Transactions
     * Staff sees partial columns, Owner/Admin sees all.
     */
    public function indexTransactions()
    {
        $user = auth()->user();

        if ($user && $user->role === 'Staff') {
            // Partial columns for staff
            $payments = Payment::select('PaymentID','MemberID','Amount','Status','PaymentDate')
                               ->orderBy('PaymentDate','desc')
                               ->get();
        } else {
            // Owner/Admin => everything
            $payments = Payment::with('member')
                               ->orderBy('PaymentDate','desc')
                               ->get();
        }

        return Inertia::render('Payments/Transactions/Index', [
            'payments' => $payments
        ]);
    }

    /**
     * 5. Export/Print transaction histories (Owner,Admin)
     */
    public function exportTransactions()
    {
        $allPayments = Payment::orderBy('PaymentDate','desc')->get();

        $csvLines   = [];
        $csvLines[] = "PaymentID,MemberID,Amount,Status,PaymentDate";
        foreach ($allPayments as $p) {
            $csvLines[] = "{$p->PaymentID},{$p->MemberID},{$p->Amount},{$p->Status},{$p->PaymentDate}";
        }
        $csvContent = implode("\n", $csvLines);

        return response($csvContent)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename=transactions.csv');
    }


    /* ------------------------------------------------------------------
     * C) Issue Refunds (PayMongo)
     * ------------------------------------------------------------------ */

    /**
     * 6. Initiate Refunds (Owner,Admin)
     */
    public function initiateRefund(Request $request, $paymentId)
    {
        $payment = Payment::findOrFail($paymentId);

        if ($payment->Status !== 'Completed') {
            return redirect()
                ->back()
                ->with('error','Refund cannot be initiated for non-completed payments.');
        }

        // Possibly call PayMongo API. For demonstration:
        $payment->update(['Status' => 'RefundRequested']);

        return redirect()->back()->with('success','Refund initiated successfully.');
    }

    /**
     * 7. Approve Refunds (2-step) (Owner,Admin)
     */
    public function approveRefund(Request $request, $paymentId)
    {
        $payment = Payment::findOrFail($paymentId);

        if ($payment->Status !== 'RefundRequested') {
            return redirect()
                ->route('payments.transactions.index')
                ->with('error','No pending refund request for this payment.');
        }

        // Possibly finalize with PayMongo. We'll just set 'Refunded':
        $payment->update(['Status' => 'Refunded']);

        return redirect()
            ->route('payments.transactions.index')
            ->with('success','Refund approved successfully.');
    }


    /* ------------------------------------------------------------------
     * K) Payment (Direct Table) CRUD
     * ------------------------------------------------------------------ */

    /**
     * 27. Create Payment => (Owner,Admin,Staff)
     * Show form to record a direct Payment (cash/GCash/BPI).
     */
    public function create()
    {
        $members = Member::orderBy('FullName','asc')->get();

        return Inertia::render('Payments/Direct/Create', compact('members'));
    }

    /**
     * Store a new Payment record.
     * If your Payment table includes BranchID, validate it here.
     */
    public function store(Request $request)
    {
        // Add BranchID if your system requires it, e.g.: 'BranchID' => 'required|exists:branches,BranchID',
        $data = $request->validate([
            'BranchID'     => 'nullable|exists:branches,BranchID',
            'MemberID'     => 'nullable|exists:members,MemberID',
            'WalkInName'   => 'nullable|string|max:100',
            'BookingRef'   => 'nullable|string|max:100',
            'SessionRef'   => 'nullable|string|max:100',
            'PaymentFor'   => 'required|array|min:1',
            'PaymentFor.*' => 'string|max:50',
            'PaymentMethod'=> 'required|string|max:50',
            'Amount'       => 'required|numeric|min:0',
            'PaymentDate'  => 'required|date',
            'Status'       => 'required|string|max:50',
            'FailureReason'=> 'nullable|string|max:255',
        ]);

        $data['PaymentFor'] = json_encode($data['PaymentFor']);
        Payment::create($data);

        return redirect()
            ->route('payments.index')
            ->with('success','Payment created successfully.');
    }

    /**
     * 28. Read Payment Records => all roles
     */
    public function index()
    {
        $payments = Payment::with('member')
            ->orderBy('PaymentDate','desc')
            ->get();
    
        return response()->json($payments);
    }

    /**
     * 29. Update Payment Info => all roles
     * Show edit form & process update
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
            'BranchID'     => 'nullable|exists:branches,BranchID',
            'MemberID'     => 'nullable|exists:members,MemberID',
            'WalkInName'   => 'nullable|string|max:100',
            'BookingRef'   => 'nullable|string|max:100',
            'SessionRef'   => 'nullable|string|max:100',
            'PaymentFor'   => 'required|array|min:1',
            'PaymentFor.*' => 'string|max:50',
            'PaymentMethod'=> 'required|string|max:50',
            'Amount'       => 'required|numeric|min:0',
            'PaymentDate'  => 'required|date',
            'Status'       => 'required|string|max:50',
            'FailureReason'=> 'nullable|string|max:255',
        ]);

        $data['PaymentFor'] = json_encode($data['PaymentFor']);
        Payment::create($data);

        return redirect()
            ->route('payments.index')
            ->with('success','Payment updated successfully.');
    }

    /**
     * 30. Delete Payment => all roles
     */
    public function destroy($id)
    {
        $payment = Payment::findOrFail($id);
        $payment->delete();

        return redirect()
            ->route('payments.index')
            ->with('success','Payment deleted successfully.');
    }


    /* ------------------------------------------------------------------
     * M) Partial / Multiple Payments
     * ------------------------------------------------------------------ */

    /**
     * 35. Create Partial Payments => all roles
     */
    public function createPartialPayment()
    {
        // Possibly list open invoices
        $invoices = Invoice::whereNull('PaymentStatus')
                    ->orWhere('PaymentStatus','!=','Paid')
                    ->orderBy('InvoiceDate','desc')
                    ->get();

        return Inertia::render('Payments/Partial/Create', [
            'invoices' => $invoices
        ]);
    }

    public function storePartialPayment(Request $request)
    {
        $data = $request->validate([
            'BranchID'          => 'nullable|exists:branches,BranchID',
            'MemberID'          => 'nullable|exists:members,MemberID',
            'PaymentFor'        => 'required|string|max:50',
            'PaymentMethod'     => 'required|string|max:50',
            'Amount'            => 'required|numeric|min:0',
            'PaymentDate'       => 'required|date',
            'Status'            => 'required|string|max:50',
            'allocatedInvoices' => 'required|array|min:1', 
            // e.g. allocatedInvoices => [ {invoiceId:..., amountAllocated:...}, ... ]
        ]);

        DB::transaction(function () use ($data) {
            // 1) Create the Payment
            $payment = Payment::create([
                'BranchID'      => $data['BranchID'] ?? null,
                'MemberID'      => $data['MemberID'] ?? null,
                'PaymentFor'    => $data['PaymentFor'],
                'PaymentMethod' => $data['PaymentMethod'],
                'Amount'        => $data['Amount'],
                'PaymentDate'   => $data['PaymentDate'],
                'Status'        => $data['Status'],
            ]);

            // 2) Link Payment to each Invoice
            foreach ($data['allocatedInvoices'] as $alloc) {
                $invoiceId   = $alloc['invoiceId'];
                $allocated   = $alloc['amountAllocated'];

                PaymentInvoice::create([
                    'PaymentID'       => $payment->PaymentID,
                    'InvoiceID'       => $invoiceId,
                    'AmountAllocated' => $allocated,
                ]);

                // Optionally update invoice PaymentStatus 
                $invoice = Invoice::findOrFail($invoiceId);
                if ($allocated >= $invoice->InvoiceTotal) {
                    $invoice->update(['PaymentStatus' => 'Paid']);
                } else {
                    $invoice->update(['PaymentStatus' => 'Partially Paid']);
                }
            }
        });

        return redirect()
            ->route('payments.index')
            ->with('success','Partial payment created and allocated successfully.');
    }

    /**
     * 36. Link Multiple Payments => all roles
     * Combine multiple Payment records for one Invoice
     */
    public function linkPaymentsToInvoice(Request $request, $invoiceId)
    {
        $invoice = Invoice::findOrFail($invoiceId);

        $data = $request->validate([
            'paymentIds' => 'required|array|min:1',   // e.g. [ PaymentID1, PaymentID2 ]
            'allocation' => 'required|array',         // keyed by PaymentID => amount
        ]);

        DB::transaction(function () use ($invoice, $data) {
            $sumAlloc = 0;

            foreach ($data['paymentIds'] as $pid) {
                $allocAmount = $data['allocation'][$pid] ?? 0;
                if ($allocAmount <= 0) {
                    continue;
                }

                PaymentInvoice::create([
                    'PaymentID'       => $pid,
                    'InvoiceID'       => $invoice->InvoiceID,
                    'AmountAllocated' => $allocAmount,
                ]);

                $sumAlloc += $allocAmount;
            }

            // If the sum of allocated >= invoice total => 'Paid', else 'Partially Paid'
            if ($sumAlloc >= $invoice->InvoiceTotal) {
                $invoice->update(['PaymentStatus' => 'Paid']);
            } else {
                $invoice->update(['PaymentStatus' => 'Partially Paid']);
            }
        });

        return redirect()
            ->route('invoices.show', $invoiceId)
            ->with('success','Payments allocated successfully.');
    }
}
