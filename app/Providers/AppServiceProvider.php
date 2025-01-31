<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Payment;
use App\Observers\PaymentObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {   
        //-activity()->causedBy(
            // pick the first guard that is logged in, e.g. owner, then admin, then staff
        //   auth('owner')->user() ?? auth('admin')->user() ?? auth('staff')->user());
        Payment::observe(PaymentObserver::class);       
    }
}