<?php

namespace App\Observers;

use App\Models\Payment;
use App\Models\DailyCashFlow;
use Illuminate\Support\Carbon;

class PaymentObserver
{
    /**
     * Handle the Payment "created" event.
     */
    public function created(Payment $payment)
    {
        // Add the new payment amount to the DailyCashFlow
        $this->applyPaymentToDailyCashFlow($payment);
    }

    /**
     * Handle the Payment "updated" event.
     */
    public function updated(Payment $payment)
    {
        // If date, branch, method, or amount changed, remove old data first
        if ($payment->wasChanged(['BranchID','PaymentDate','PaymentMethod','Amount'])) {
            $original = $payment->getOriginal(); // old data
            $this->removePaymentFromDailyCashFlow($original);
            $this->applyPaymentToDailyCashFlow($payment);
        }
    }

    /**
     * Handle the Payment "deleted" event.
     */
    public function deleted(Payment $payment)
    {
        // Remove the payment from the daily cash flow
        $original = $payment->toArray();
        $this->removePaymentFromDailyCashFlow($original);
    }

    private function applyPaymentToDailyCashFlow(Payment $payment)
    {
        // 1) Convert PaymentDate to date only, if needed
        $date = Carbon::parse($payment->PaymentDate)->format('Y-m-d');
        // 2) Find or create daily cash flow
        $cashFlow = DailyCashFlow::firstOrCreate(
            [
                'BranchID' => $payment->BranchID,
                'Date'     => $date,
            ],
            [
                'BusinessType'     => 'Gym',
                'CashSales'        => 0,
                'GCashSales'       => 0,
                'BPISales'         => 0,
                'BDOSales'         => 0,
                'WalkInCashSales'  => 0,
                'WalkInGCashSales' => 0,
                'WalkInBPISales'   => 0,
                'WalkInBDOSales'   => 0,
                'TotalSales'       => 0,
            ]
        );

        // 3) Add the Payment->Amount to the correct column
        switch ($payment->PaymentMethod) {
            case 'Cash': $cashFlow->CashSales += $payment->Amount; break;
            case 'GCash': $cashFlow->GCashSales += $payment->Amount; break;
            case 'BPI': $cashFlow->BPISales += $payment->Amount; break;
            case 'BDO': $cashFlow->BDOSales += $payment->Amount; break;
            // etc.
        }

        // 4) Recompute total
        $cashFlow->TotalSales =
            ($cashFlow->CashSales ?? 0) +
            ($cashFlow->GCashSales ?? 0) +
            ($cashFlow->BPISales ?? 0) +
            ($cashFlow->BDOSales ?? 0) +
            ($cashFlow->WalkInCashSales ?? 0) +
            ($cashFlow->WalkInGCashSales ?? 0) +
            ($cashFlow->WalkInBPISales ?? 0) +
            ($cashFlow->WalkInBDOSales ?? 0);

        $cashFlow->save();
    }

    private function removePaymentFromDailyCashFlow(array $oldData)
    {
        // oldData has 'BranchID','PaymentDate','PaymentMethod','Amount'
        if (empty($oldData['BranchID']) || empty($oldData['PaymentDate'])) {
            return;
        }

        // Convert old PaymentDate to date only
        $oldDate = substr($oldData['PaymentDate'], 0, 10);

        $cashFlow = DailyCashFlow::where('BranchID', $oldData['BranchID'])
            ->where('Date', $oldDate)
            ->first();
        if (!$cashFlow) {
            return; // nothing to remove
        }

        switch ($oldData['PaymentMethod']) {
            case 'Cash': $cashFlow->CashSales -= $oldData['Amount']; break;
            case 'GCash': $cashFlow->GCashSales -= $oldData['Amount']; break;
            case 'BPI': $cashFlow->BPISales -= $oldData['Amount']; break;
            case 'BDO': $cashFlow->BDOSales -= $oldData['Amount']; break;
        }

        $cashFlow->TotalSales =
            ($cashFlow->CashSales ?? 0) +
            ($cashFlow->GCashSales ?? 0) +
            ($cashFlow->BPISales ?? 0) +
            ($cashFlow->BDOSales ?? 0) +
            ($cashFlow->WalkInCashSales ?? 0) +
            ($cashFlow->WalkInGCashSales ?? 0) +
            ($cashFlow->WalkInBPISales ?? 0) +
            ($cashFlow->WalkInBDOSales ?? 0);

        $cashFlow->save();

        // optional: if $cashFlow->TotalSales <= 0, you might delete or keep
    }
}
