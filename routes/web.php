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

/*
|--------------------------------------------------------------------------
| Owner Dashboard
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\OwnerDashboardController;

Route::middleware(['auth:owner'])->group(function () {
    Route::get('/owner/dashboard', [OwnerDashboardController::class, 'index'])
        ->name('owner.dashboard');
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

    // 4) Freezes
    Route::post('freezes', [MembershipController::class, 'storeFreeze'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('membership.freezes.store');
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
    Route::get('{id}/edit', [BookingController::class, 'editBooking'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.edit');
    Route::put('{id}', [BookingController::class, 'updateBooking'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.update');
    Route::post('{id}/cancel', [BookingController::class, 'cancelBooking'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('booking.cancel');
    

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

/* 
|--------------------------------------------------------------------------
| 5) StaffController
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\StaffController;

Route::prefix('staff')->group(function() {

    // AA) Staff Management
    Route::get('create', [StaffController::class, 'createStaff'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.create');
    Route::post('/', [StaffController::class, 'storeStaff'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.store');
    Route::get('/', [StaffController::class, 'indexStaff'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('staff.index');
    Route::get('{id}/edit', [StaffController::class, 'editStaff'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.edit');
    Route::put('{id}', [StaffController::class, 'updateStaff'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.update');
    Route::post('{id}/deactivate', [StaffController::class, 'deactivateStaff'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.deactivate');
    Route::delete('{id}', [StaffController::class, 'destroyStaff'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.destroy');

    // V) Attendance
    Route::post('attendance/clock', [StaffController::class, 'clockInOut'])
        ->middleware('multiGuard:admin,staff')
        ->name('staff.attendance.clock');
    Route::get('attendance', [StaffController::class, 'indexAttendance'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.attendance.index');
    Route::put('attendance/{id}', [StaffController::class, 'updateAttendance'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.attendance.update');

    // R) Staff Tasks
    Route::get('tasks', [StaffController::class, 'indexTasks'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('staff.tasks.index');
    Route::post('tasks', [StaffController::class, 'storeTask'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.tasks.store');
    Route::put('tasks/{id}', [StaffController::class, 'updateTask'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.tasks.update');
    Route::post('tasks/{id}/complete', [StaffController::class, 'markTaskCompleted'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('staff.tasks.complete');

    // AB) StaffSchedule
    Route::get('schedules', [StaffController::class, 'indexSchedules'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('staff.schedules.index');
    Route::get('schedules/create', [StaffController::class, 'createSchedule'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.schedules.create');
    Route::post('schedules', [StaffController::class, 'storeSchedule'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.schedules.store');
    Route::delete('schedules/{id}', [StaffController::class, 'destroySchedule'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.schedules.destroy');

    // W) Payroll & Bonus
    Route::get('payroll/create', [StaffController::class, 'createPayroll'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.payroll.create');
    Route::post('payroll', [StaffController::class, 'storePayroll'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.payroll.store');
    Route::get('payroll', [StaffController::class, 'indexPayroll'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.payroll.index');
    Route::put('payroll/{id}', [StaffController::class, 'updatePayroll'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.payroll.update');
    Route::get('bonus/create', [StaffController::class, 'createBonus'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.bonus.create');
    Route::post('bonus', [StaffController::class, 'storeBonus'])
        ->middleware('multiGuard:owner,admin')
        ->name('staff.bonus.store');
});

/* 
|--------------------------------------------------------------------------
| 6) OperationsController
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\OperationsController;


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



Route::prefix('operations')->group(function() {

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
    Route::post('equipment/maintenance', [OperationsController::class, 'addMaintenanceLog'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('operations.equipment.maintenance');
    
        Route::get('maintenance-logs', [OperationsController::class, 'indexMaintenanceLogs'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('operations.maintenanceLogs.index');

        Route::put('maintenance-logs/{id}', [OperationsController::class, 'updateMaintenanceLog'])
     ->middleware('multiGuard:owner,admin,staff')
     ->name('operations.maintenanceLogs.update');

Route::delete('maintenance-logs/{id}', [OperationsController::class, 'destroyMaintenanceLog'])
     ->middleware('multiGuard:owner,admin,staff')
     ->name('operations.maintenanceLogs.delete');


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

/* 
|--------------------------------------------------------------------------
| 7) FinanceController
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\FinanceController;

Route::prefix('finance')->group(function() {

    Route::get('summary', [FinanceController::class, 'indexSummary'])
     ->middleware('multiGuard:owner,admin,staff')
     ->name('finance.summary.index');

Route::put('summary/{id}', [FinanceController::class, 'updateSummary'])
     ->middleware('multiGuard:owner,admin')
     ->name('finance.summary.update');

Route::delete('summary/{id}', [FinanceController::class, 'destroySummary'])
     ->middleware('multiGuard:owner,admin')
     ->name('finance.summary.destroy');


    // DailyCashFlow
    Route::get('cashflow/create', [FinanceController::class, 'createCashFlow'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.cashflow.create');
    Route::post('cashflow', [FinanceController::class, 'storeCashFlow'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.cashflow.store');
    Route::get('cashflow', [FinanceController::class, 'indexCashFlow'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('finance.cashflow.index');

    // Expenses
    Route::get('expenses/create', [FinanceController::class, 'createExpense'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.expenses.create');
    Route::post('expenses', [FinanceController::class, 'storeExpense'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.expenses.store');
    Route::get('expenses', [FinanceController::class, 'indexExpenses'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('finance.expenses.index');
    Route::get('expenses/{id}/edit', [FinanceController::class, 'editExpense'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.expenses.edit');
    Route::put('expenses/{id}', [FinanceController::class, 'updateExpense'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.expenses.update');
    Route::delete('expenses/{id}', [FinanceController::class, 'destroyExpense'])
        ->middleware('multiGuard:owner,admin')
        ->name('finance.expenses.destroy');

    // Promotions
    Route::get('promotions', [FinanceController::class, 'indexPromotions'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('finance.promotions.index');
    Route::post('promotions', [FinanceController::class, 'storePromotion'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('finance.promotions.store');
    Route::post('promotions/{id}/toggle', [FinanceController::class, 'togglePromotion'])
        ->middleware('multiGuard:owner,admin,staff')
        ->name('finance.promotions.toggle');
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
});

/* 
|--------------------------------------------------------------------------
| 9) BranchController
|--------------------------------------------------------------------------
*/
Route::get('/owner/branches', [BranchController::class, 'indexJson']);
Route::post('/owner/branches', [BranchController::class, 'storeJson']);
Route::put('/owner/branches/{id}', [BranchController::class, 'updateJson']);
Route::delete('/owner/branches/{id}', [BranchController::class, 'destroyJson']);
