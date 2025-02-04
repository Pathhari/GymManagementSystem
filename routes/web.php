<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Root: Redirect to Correct Dashboard if Logged In
|--------------------------------------------------------------------------
*/
Route::get('/', function() {
    if (auth('owner')->check()) {
        return redirect()->route('owner.dashboard');
    } elseif (auth('admin')->check()) {
        return redirect()->route('admin.dashboard');
    } elseif (auth('staff')->check()) {
        return redirect()->route('staff.dashboard');
    }
    // If no one is logged in, show a public landing or Blade 'welcome'
    return Inertia::render('LandingPage');// or Inertia::render('Public/Welcome')
})->name('root');

use App\Http\Controllers\ProfileController;

Route::middleware('auth:owner,admin,staff')->get('/profile', [ProfileController::class, 'show']);
/*
|--------------------------------------------------------------------------
| Owner Dashboard
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\OwnerDashboardController;

Route::middleware(['auth:owner'])->group(function () {
    Route::get('/owner/dashboard', [OwnerDashboardController::class, 'index'])
        ->name('owner.dashboard');

 Route::get('/owner/dashboard-metrics', [OwnerDashboardController::class, 'metrics'])
    ->middleware('auth:owner')
    ->name('dashboard.metrics');
});


/*
|--------------------------------------------------------------------------
| Admin Dashboard
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\AdminDashboardController;

Route::middleware('auth:admin')->prefix('admin')->group(function () {
    Route::get('dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('users', [AdminDashboardController::class, 'users'])->name('admin.users');
    Route::get('payments', [AdminDashboardController::class, 'payments'])->name('admin.payments');
    Route::get('system-logs', [AdminDashboardController::class, 'systemLogs'])->name('admin.systemLogs');
    Route::get('notifications', [AdminDashboardController::class, 'notifications'])->name('admin.notifications');
    Route::get('settings', [AdminDashboardController::class, 'settings'])->name('admin.settings');
});


/*
|--------------------------------------------------------------------------
| Staff Dashboard
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\StaffDashboardController;

Route::middleware('auth:staff')->prefix('staff')->group(function () {
    
    Route::get('dashboard', [StaffDashboardController::class, 'index'])->name('staff.dashboard');
    Route::get('/staff/branches', [StaffDashboardController::class, 'branches']);
    Route::get('tasks', [StaffDashboardController::class, 'tasks'])->name('staff.tasks');
    Route::get('attendance', [StaffDashboardController::class, 'attendance'])->name('staff.attendance');
    Route::get('notifications', [StaffDashboardController::class, 'notifications'])->name('staff.notifications');
    Route::get('system-logs', [StaffDashboardController::class, 'systemLogs'])->name('staff.systemLogs');
});

/*
|--------------------------------------------------------------------------
| Staff Authentication Routes
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\StaffAuthController;

Route::get('/staff/login', [StaffAuthController::class, 'showLoginForm'])->name('staff.login');
Route::post('/staff/login', [StaffAuthController::class, 'login'])->name('staff.login.post');
Route::post('/staff/logout', [StaffAuthController::class, 'logout'])->name('staff.logout');

/*
|--------------------------------------------------------------------------
| Admin Authentication Routes
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\AdminAuthController;

Route::get('/admin/login', [AdminAuthController::class, 'showLoginForm'])->name('admin.login');
Route::post('/admin/login', [AdminAuthController::class, 'login'])->name('admin.login.post');
Route::post('/admin/logout', [AdminAuthController::class, 'logout'])->name('admin.logout');


/*
|--------------------------------------------------------------------------
| Owner Authentication Routes
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\OwnerAuthController;

Route::get('/owner/login', [OwnerAuthController::class, 'showLoginForm'])->name('owner.login');
Route::post('/owner/login', [OwnerAuthController::class, 'login'])->name('owner.login.post');
Route::post('/owner/logout', [OwnerAuthController::class, 'logout'])->name('owner.logout');


/* 
|--------------------------------------------------------------------------
| 1) PaymentController
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\PaymentController;

Route::prefix('payments')->group(function() {

    // A) Payment Setup & Configuration
    Route::get('setup/paymongo', [PaymentController::class, 'viewPayMongoCredentials'])
        ->middleware('auth:owner')
        ->name('payments.setup.paymongo');

    Route::post('setup/paymongo', [PaymentController::class, 'updatePayMongoCredentials'])
        ->middleware('auth:owner')
        ->name('payments.setup.paymongo.update');

    Route::get('setup/fee-rules', [PaymentController::class, 'viewFeeRules'])
        ->middleware('multiGuard:owner,admin')
        ->name('payments.setup.feeRules');
    Route::post('setup/fee-rules', [PaymentController::class, 'updateFeeRules'])
        ->middleware('multiGuard:owner,admin')
        ->name('payments.setup.feeRules.update');

    Route::get('setup/methods', [PaymentController::class, 'indexPaymentMethods'])
        ->middleware('multiGuard:owner,admin')
        ->name('payments.setup.methods');
    Route::post('setup/methods/toggle', [PaymentController::class, 'togglePaymentMethod'])
        ->middleware('multiGuard:owner,admin')
        ->name('payments.setup.methods.toggle');

    // B) Transaction Logs
    Route::get('transactions', [PaymentController::class, 'indexTransactions'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('payments.transactions.index');
    Route::get('transactions/export', [PaymentController::class, 'exportTransactions'])
        ->middleware('multiGuard:owner,admin')
        ->name('payments.transactions.export');

    // C) Issue Refunds
    Route::post('{paymentId}/refund/initiate', [PaymentController::class, 'initiateRefund'])
        ->middleware('multiGuard:owner,admin')
        ->name('payments.refund.initiate');
    Route::post('{paymentId}/refund/approve', [PaymentController::class, 'approveRefund'])
        ->middleware('multiGuard:owner,admin')
        ->name('payments.refund.approve');

    // K) Payment (Direct Table) CRUD
    Route::get('create', [PaymentController::class, 'create'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('payments.create');
    Route::post('/', [PaymentController::class, 'store'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('payments.store');

    Route::get('/', [PaymentController::class, 'index'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('payments.index');
    Route::get('{id}/edit', [PaymentController::class, 'edit'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('payments.edit');
    Route::put('{id}', [PaymentController::class, 'update'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('payments.update');
    Route::delete('{id}', [PaymentController::class, 'destroy'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('payments.destroy');

    // M) Partial / Multiple Payments
    Route::get('partial/create', [PaymentController::class, 'createPartialPayment'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('payments.partial.create');
    Route::post('partial', [PaymentController::class, 'storePartialPayment'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('payments.partial.store');
    Route::post('invoices/{invoiceId}/link', [PaymentController::class, 'linkPaymentsToInvoice'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('payments.link.invoices');
});

use App\Http\Controllers\InvoiceController;

Route::prefix('invoices')->middleware('multiGuard:owner,admin,staff')->group(function() {
    Route::get('/', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::post('/', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::get('{id}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::put('{id}', [InvoiceController::class, 'update'])->name('invoices.update');
    Route::delete('{id}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');
});

/* 
|--------------------------------------------------------------------------
| 2) NotificationController
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\NotificationController;

Route::prefix('notifications')->group(function() {

    // D) Notification Channels Setup
    Route::get('channels/semaphore', [NotificationController::class, 'viewSemaphore'])
        ->middleware('auth:owner')
        ->name('notifications.channels.semaphore');
    Route::post('channels/semaphore', [NotificationController::class, 'updateSemaphore'])
        ->middleware('auth:owner')
        ->name('notifications.channels.semaphore.update');

    Route::get('channels/sms-limit', [NotificationController::class, 'viewSMSLimit'])
        ->middleware('multiGuard:owner,admin')
        ->name('notifications.channels.smsLimit');
    Route::post('channels/sms-limit', [NotificationController::class, 'updateSMSLimit'])
        ->middleware('multiGuard:owner,admin')
        ->name('notifications.channels.smsLimit.update');

    Route::get('channels/mailjet', [NotificationController::class, 'viewMailjet'])
        ->middleware('auth:owner')
        ->name('notifications.channels.mailjet');
    Route::post('channels/mailjet', [NotificationController::class, 'updateMailjet'])
        ->middleware('auth:owner')
        ->name('notifications.channels.mailjet.update');

    // E) Notification Sending & Management
    Route::post('send/bulk-sms', [NotificationController::class, 'sendBulkSMS'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('notifications.send.bulkSMS');
    Route::post('send/bulk-email', [NotificationController::class, 'sendBulkEmail'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('notifications.send.bulkEmail');
    Route::post('send/ad-hoc', [NotificationController::class, 'adHocNotification'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('notifications.send.adHoc');
    Route::get('sms-credits', [NotificationController::class, 'viewSMSCredits'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('notifications.smsCredits');
    Route::get('mailjet/advanced', [NotificationController::class, 'advancedMailjet'])
        ->middleware('auth:owner')
        ->name('notifications.mailjet.advanced');

        Route::get('announcements', [NotificationController::class, 'indexAnnouncements'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('notifications.announcements.index');

    Route::post('announcements', [NotificationController::class, 'storeAnnouncement'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('notifications.announcements.store');

    Route::put('announcements/{id}', [NotificationController::class, 'updateAnnouncement'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('notifications.announcements.update');

    Route::delete('announcements/{id}', [NotificationController::class, 'destroyAnnouncement'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('notifications.announcements.destroy');

    // Send Notification to Staff
    Route::post('send-staff', [NotificationController::class, 'sendStaffNotification'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('notifications.send.staff');

    // F) Notification Templates
    Route::get('templates', [NotificationController::class, 'indexTemplates'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('notifications.templates.index');
    Route::post('templates', [NotificationController::class, 'storeTemplate'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('notifications.templates.store');
    Route::get('templates/{id}/edit', [NotificationController::class, 'editTemplate'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('notifications.templates.edit');
    Route::post('templates/{id}/update', [NotificationController::class, 'updateTemplate'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('notifications.templates.update');
    Route::post('templates/{id}/approve', [NotificationController::class, 'approveTemplate'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('notifications.templates.approve');
});

/* 
|--------------------------------------------------------------------------
| 3) MembershipController
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\MembershipController;

Route::prefix('membership')->group(function() {

    // 1) Members
    Route::get('members', [MembershipController::class, 'apiIndex'])
        ->name('membership.members.apiIndex'); // or rename as you prefer
    Route::post('members', [MembershipController::class, 'apiStoreMember'])
        ->name('membership.members.apiStoreMember');
    Route::put('members/{id}', [MembershipController::class, 'apiUpdateMember'])
        ->name('membership.members.apiUpdateMember');
    Route::delete('members/{id}', [MembershipController::class, 'apiDestroyMember'])
        ->name('membership.members.apiDestroyMember');
    Route::get('statuses', [MembershipController::class, 'indexMemberStatuses'])
    ->name('membership.statuses.index');
    Route::get('members/search', [MembershipController::class, 'apiSearchMembers'])
    ->name('membership.members.apiSearch');
    Route::get('growth', [MembershipController::class, 'growth'])->name('membership.growth');


    // 2) Plans
    Route::get('plans', [MembershipController::class, 'indexPlans'])
        ->middleware('multiGuard:owner,admin')
        ->name('membership.plans.indexPlans');
    Route::post('plans', [MembershipController::class, 'storePlan'])
        ->middleware('multiGuard:owner,admin')
        ->name('membership.plans.storePlan');
    Route::put('plans/{id}', [MembershipController::class, 'updatePlan'])
        ->middleware('multiGuard:owner,admin')
        ->name('membership.plans.updatePlan');
    Route::delete('plans/{id}', [MembershipController::class, 'destroyPlan'])
        ->middleware('multiGuard:owner,admin')
        ->name('membership.plans.destroyPlan');

    // 3) Renewals
    Route::post('renewals', [MembershipController::class, 'storeRenewal'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('membership.renewals.store');
    Route::delete('renewals/{id}', [MembershipController::class, 'destroyRenewal'])
    ->middleware('multiGuard:owner,admin,staff')
    ->name('membership.renewals.destroy');
    

    // 4) Freezes
    Route::post('freezes', [MembershipController::class, 'storeFreeze'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('membership.freezes.store');

    Route::put('freezes/{id}', [MembershipController::class, 'updateFreeze'])
    ->middleware('multiGuard:owner,admin,staff')
    ->name('membership.freezes.update');

    Route::delete('freezes/{id}', [MembershipController::class, 'destroyFreeze'])
     ->middleware('multiGuard:owner,admin,staff')
     ->name('membership.freezes.destroy');


    Route::post('storeLockInMembership', [MembershipController::class, 'storeLockInMembership'])
    ->middleware('multiGuard:owner,admin,staff')
    ->name('membership.lockIn.store');
    
    Route::post('import-lock-in', [MembershipController::class, 'importLockInMember'])
     ->middleware('multiGuard:owner,admin,staff')
     ->name('membership.lockIn.import');
    });



/* 
|--------------------------------------------------------------------------
| 4) BookingController
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\BookingController;

Route::prefix('booking')->group(function() {

    // N) Bookings
    Route::get('create', [BookingController::class, 'createBooking'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.create');
    Route::post('/', [BookingController::class, 'storeBooking'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.store');
    Route::get('/', [BookingController::class, 'indexBooking'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.index');
    Route::get('most-popular', [BookingController::class, 'mostPopular'])
        ->name('booking.mostPopular');
    Route::get('{id}/edit', [BookingController::class, 'editBooking'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.edit');
    Route::put('{id}', [BookingController::class, 'updateBooking'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.update');
    Route::post('{id}/cancel', [BookingController::class, 'cancelBooking'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.cancel');
    Route::get('trends', [BookingController::class, 'bookingTrends'])->name('booking.trends');

    
    Route::get('/coaches', [BookingController::class, 'index'])
    ->middleware('multiGuard:owner,admin,staff')
    ->name('coaches.index');

    // Facilities
    Route::get('facilities', [BookingController::class, 'indexFacilities'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.facilities.index');

    // O) Coaching Sessions
    Route::get('sessions', [BookingController::class, 'indexSessions'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.sessions.index');
    Route::get('sessions/create', [BookingController::class, 'createSession'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.sessions.create');
    Route::post('sessions', [BookingController::class, 'storeSession'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.sessions.store');
    // **NEW** Update & Cancel Session
    Route::put('sessions/{id}', [BookingController::class, 'updateSession'])
         ->middleware('multiGuard:owner,admin,staff')
         ->name('booking.sessions.update');
    Route::post('sessions/{id}/cancel', [BookingController::class, 'cancelSession'])
         ->middleware('multiGuard:owner,admin,staff')
         ->name('booking.sessions.cancel');

    Route::post('sessions/book', [BookingController::class, 'storeSessionBooking'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.sessions.book');
    Route::post('sessions/waitlist', [BookingController::class, 'addToWaitlist'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.sessions.waitlist');
    Route::post('sessions/attendance', [BookingController::class, 'markAttendance'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.sessions.attendance');
});

use App\Http\Controllers\StaffController;

Route::middleware('auth:staff')->prefix('staff')->group(function () {

    // Staff main CRUD
    Route::get('/', [StaffController::class, 'indexStaffJson'])->name('staff.index');
    Route::post('/', [StaffController::class, 'storeStaff'])->name('staff.store');
    Route::put('/{id}', [StaffController::class, 'updateStaff'])->name('staff.update');
    Route::delete('/{id}', [StaffController::class, 'destroyStaff'])->name('staff.destroy');

    // 1) Attendance
    Route::get('/attendance', [StaffController::class, 'indexAttendance'])->name('attendance.index');
    Route::put('/attendance/{id}', [StaffController::class, 'updateAttendance'])->name('attendance.update');
    Route::delete('/attendance/{id}', [StaffController::class, 'destroyAttendance'])->name('attendance.destroy');

    // 1A) Clock In/Out
    Route::post('/attendance/clock-in-out', [StaffController::class, 'clockInOut'])
         ->name('attendance.clockInOut');

    // 2) Tasks
    Route::prefix('tasks')->group(function() {
        Route::get('/', [StaffController::class, 'indexTasks'])->name('tasks.index');
        Route::post('/', [StaffController::class, 'storeTask'])->name('tasks.store');
        Route::put('/{id}', [StaffController::class, 'updateTask'])->name('tasks.update');
        Route::delete('/{id}', [StaffController::class, 'destroyTask'])->name('tasks.destroy');
    });

    // 3) Schedules
    Route::prefix('schedules')->group(function() {
        Route::get('/', [StaffController::class, 'indexSchedules'])->name('schedules.index');
        Route::post('/', [StaffController::class, 'storeSchedule'])->name('schedules.store');
        Route::put('/{id}', [StaffController::class, 'updateSchedule'])->name('schedules.update');
        Route::delete('/{id}', [StaffController::class, 'destroySchedule'])->name('schedules.destroy');
    });

    // 4) Additional routes, e.g. staff/performance, etc.
    Route::get('/performance', [StaffController::class, 'performance'])->name('performance');
    Route::get('/dashboard-info', [StaffController::class, 'staffDashboardInfo'])->name('dashboard.info');
});
// routes/web.php (or api.php)


/* 
|--------------------------------------------------------------------------
| 6) OperationsController
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\OperationsController;

Route::prefix('operations')->group(function() {
    // Maintenance Logs (Consolidated)
    Route::prefix('maintenance-logs')->name('maintenance.logs.')->group(function() {
        Route::get('/', [OperationsController::class, 'indexMaintenanceLogs'])
            ->middleware('multiGuard:owner,admin,staff')
            ->name('index');
            
            
        Route::post('/', [OperationsController::class, 'storeMaintenanceLog'])
            ->middleware('multiGuard:owner,admin,staff')
            ->name('store');
            
        Route::put('/{id}', [OperationsController::class, 'updateMaintenanceLog'])
            ->middleware('multiGuard:owner,admin,staff')
            ->name('update');
            
        Route::delete('/{id}', [OperationsController::class, 'destroyMaintenanceLog'])
            ->middleware('multiGuard:owner,admin,staff')
            ->name('destroy');

            Route::get('/maintenance/stats', [OperationsController::class, 'getMaintenanceStats'])
     ->middleware('multiGuard:owner,admin,staff')
     ->name('maintenance.stats');
    });

    // Inventory
    Route::get('products', [OperationsController::class, 'indexProducts'])
        ->middleware('multiGuard:owner,admin')
        ->name('operations.products.index');
    Route::post('products', [OperationsController::class, 'storeProduct'])
        ->middleware('multiGuard:owner,admin')
        ->name('operations.products.store');
    Route::post('products/adjust', [OperationsController::class, 'adjustStock'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('operations.products.adjust');
    Route::delete('products/{id}', [OperationsController::class, 'destroyProduct'])
        ->middleware('multiGuard:owner,admin')
        ->name('operations.products.destroy');
    Route::get('stock-levels', [OperationsController::class, 'viewStockLevels'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('operations.products.stockLevels');

    // Lockers
    Route::get('lockers', [OperationsController::class, 'indexLockers'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('operations.lockers.index');    
    Route::post('lockers', [OperationsController::class, 'storeLocker'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('operations.lockers.store');
    Route::post('lockers/borrow', [OperationsController::class, 'borrowLockerKey'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('operations.lockers.borrow');
    Route::post('lockers/{usageId}/return', [OperationsController::class, 'returnLockerKey'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('operations.lockers.return');

    // Equipment
    Route::get('equipment', [OperationsController::class, 'indexEquipment'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('operations.equipment.index');
    Route::post('equipment', [OperationsController::class, 'storeEquipment'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('operations.equipment.store');

    // Walk-Ins
    Route::get('walk-ins', [OperationsController::class, 'indexWalkIns'])
    ->middleware('multiGuard:owner,admin,staff')
    ->name('operations.walkins.index');

    Route::get('walk-ins/create', [OperationsController::class, 'createWalkIn'])
    ->middleware('multiGuard:owner,admin,staff')
    ->name('operations.walkins.create');

    Route::post('walk-ins', [OperationsController::class, 'storeWalkIn'])
    ->middleware('multiGuard:owner,admin,staff')
    ->name('operations.walkins.store');

    Route::get('walk-ins/{id}/edit', [OperationsController::class, 'editWalkIn'])
    ->middleware('multiGuard:owner,admin,staff')
    ->name('operations.walkins.edit');

    Route::put('walk-ins/{id}', [OperationsController::class, 'updateWalkIn'])
    ->middleware('multiGuard:owner,admin,staff')
    ->name('operations.walkins.update');

    Route::delete('walk-ins/{id}', [OperationsController::class, 'destroyWalkIn'])
    ->middleware('multiGuard:owner,admin,staff')
    ->name('operations.walkins.destroy');


    // Member Visits
    Route::get('visits/create', [OperationsController::class, 'createVisit'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('operations.visits.create');
    Route::post('visits', [OperationsController::class, 'storeVisit'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('operations.visits.store');
    Route::get('visits', [OperationsController::class, 'indexVisits'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('operations.visits.index');
    Route::get('visits/{id}/edit', [OperationsController::class, 'editVisit'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('operations.visits.edit');
    Route::put('visits/{id}', [OperationsController::class, 'updateVisit'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('operations.visits.update');
});

use App\Http\Controllers\FinanceController;

Route::prefix('finance')->group(function() {

    // Points to: /finance/summary  (GET)
    Route::get('summary', [FinanceController::class, 'indexSummary'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('finance.summary.index');

    // Points to: /finance/summary  (GET) -- if you want an alias
    Route::get('financial-summary', [FinanceController::class, 'getFinancialSummary'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('finance.summary');

    Route::put('summary/{id}', [FinanceController::class, 'updateSummary'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.summary.update');

    Route::delete('summary/{id}', [FinanceController::class, 'destroySummary'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.summary.destroy');

    // DailyCashFlow
    // => GET /finance/cashflow/create
    Route::get('cashflow/create', [FinanceController::class, 'createCashFlow'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.cashflow.create');

    // => POST /finance/cashflow
    Route::post('cashflow', [FinanceController::class, 'storeCashFlow'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.cashflow.store');

    // => GET /finance/cashflow
    Route::get('cashflow', [FinanceController::class, 'indexCashFlow'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('finance.cashflow.index');

    // Expenses
    // => GET /finance/expenses/create
    Route::get('expenses/create', [FinanceController::class, 'createExpense'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.expenses.create');

    // => POST /finance/expenses
    Route::post('expenses', [FinanceController::class, 'storeExpense'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.expenses.store');

    // => GET /finance/expenses
    Route::get('expenses', [FinanceController::class, 'indexExpenses'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('finance.expenses.index');

    // => GET /finance/expenses/123/edit
    Route::get('expenses/{id}/edit', [FinanceController::class, 'editExpense'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.expenses.edit');

    // => PUT /finance/expenses/123
    Route::put('expenses/{id}', [FinanceController::class, 'updateExpense'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.expenses.update');

    // => DELETE /finance/expenses/123
    Route::delete('expenses/{id}', [FinanceController::class, 'destroyExpense'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.expenses.destroy');

    // Promotions
    // => GET /finance/promotions
    Route::get('promotions', [FinanceController::class, 'indexPromotions'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('finance.promotions.index');

    // => POST /finance/promotions
    Route::post('promotions', [FinanceController::class, 'storePromotion'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('finance.promotions.store');

    // => POST /finance/promotions/123/toggle
    Route::post('promotions/{id}/toggle', [FinanceController::class, 'togglePromotion'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('finance.promotions.toggle');

    // => POST /finance/generate-cashflow
    Route::post('generate-cashflow', [FinanceController::class, 'generateDailyCashFlow'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('finance.generate-cashflow');
});

/* 
|--------------------------------------------------------------------------
| 8) SystemController
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\SystemController;

Route::prefix('system')->group(function() {

    // System Logs
    Route::get('logs', [SystemController::class, 'indexLogs'])
        ->middleware('multiGuard:owner,admin')
        ->name('system.logs.index');
    Route::delete('logs/{id}', [SystemController::class, 'destroyLog'])
        ->middleware('auth:owner')
        ->name('system.logs.destroy');

    // Reports
    Route::get('reports', [SystemController::class, 'generateReports'])
        ->middleware('multiGuard:owner,admin')
        ->name('system.reports');
        Route::get('metrics', [SystemController::class, 'systemMetrics'])->name('system.metrics');

});

/* 
|-------------------------------------------------------------------------- 
| 9) BranchController (Updated)
|-------------------------------------------------------------------------- 
*/
use App\Http\Controllers\BranchController;

Route::prefix('owner/branches')->name('branches.')->group(function() {
    // Index accessible by owner, admin, staff
    Route::get('/', [BranchController::class, 'indexJson'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('index');

    // Write operations only for owner/admin
    Route::middleware('multiGuard:owner,admin')->group(function() {
        Route::post('/', [BranchController::class, 'storeJson'])->name('store');
        Route::put('/{id}', [BranchController::class, 'updateJson'])->name('update');
        Route::delete('/{id}', [BranchController::class, 'destroyJson'])->name('destroy');
        // Change this:
        Route::get('/branch/stats', [BranchController::class, 'getBranchStats'])
             ->middleware('multiGuard:owner,admin,staff')
             ->name('stats');
    });
});