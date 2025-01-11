<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| This file references your 8 merged controllers plus a Dashboard.
| We apply 'role' middleware based on the RBA matrix.
|
*/

// Landing page / dashboard, often all roles can view
Route::get('/', [DashboardController::class, 'index'])
     ->middleware('role:Owner,Admin,Staff')  // If you want all to see the dashboard
     ->name('dashboard');


/*
|--------------------------------------------------------------------------
| 1) PaymentController
| Handles Payment Setup & Config, Transaction Logs, Refunds, Direct Payment, etc.
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\PaymentController;

Route::prefix('payments')->group(function() {

    // A. Payment Setup & Configuration
    // 1. PayMongo API Credentials (Owner only)
    Route::get('setup/paymongo', [PaymentController::class, 'viewPayMongoCredentials'])
         ->middleware('role:Owner')
         ->name('payments.setup.paymongo');

    Route::post('setup/paymongo', [PaymentController::class, 'updatePayMongoCredentials'])
         ->middleware('role:Owner')
         ->name('payments.setup.paymongo.update');

    // 2. Transaction Fee Rules / Markups => Owner or Admin
    Route::get('setup/fee-rules', [PaymentController::class, 'viewFeeRules'])
         ->middleware('role:Owner,Admin')
         ->name('payments.setup.feeRules');

    Route::post('setup/fee-rules', [PaymentController::class, 'updateFeeRules'])
         ->middleware('role:Owner,Admin')
         ->name('payments.setup.feeRules.update');

    // 3. Enable/Disable Payment Methods => Owner or Admin
    Route::get('setup/methods', [PaymentController::class, 'indexPaymentMethods'])
         ->middleware('role:Owner,Admin')
         ->name('payments.setup.methods');

    Route::post('setup/methods/toggle', [PaymentController::class, 'togglePaymentMethod'])
         ->middleware('role:Owner,Admin')
         ->name('payments.setup.methods.toggle');

    // B. Transaction Logs
    // 4. View all Payment Transactions => (Owner Full, Admin Full, Staff read-only)
    // We'll block no one here at route-level, so all roles can see, but staff can have partial data in the controller.
    Route::get('transactions', [PaymentController::class, 'indexTransactions'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('payments.transactions.index');

    // 5. Export/Print => (Owner Full, Admin Full, Staff = X)
    Route::get('transactions/export', [PaymentController::class, 'exportTransactions'])
         ->middleware('role:Owner,Admin')
         ->name('payments.transactions.export');

    // C. Issue Refunds (PayMongo)
    // 6. Initiate Refunds => (Owner Full, Admin Full, Staff = X)
    Route::post('{paymentId}/refund/initiate', [PaymentController::class, 'initiateRefund'])
         ->middleware('role:Owner,Admin')
         ->name('payments.refund.initiate');

    // 7. Approve Refunds => (Owner Full, Admin Full, Staff = X)
    Route::post('{paymentId}/refund/approve', [PaymentController::class, 'approveRefund'])
         ->middleware('role:Owner,Admin')
         ->name('payments.refund.approve');

    // K. Direct Payment table (27–30)
    // 27. Create Payment => (Owner, Admin, Staff all can do)
    Route::get('create', [PaymentController::class, 'create'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('payments.create');
    Route::post('/', [PaymentController::class, 'store'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('payments.store');

    // 28. Read Payment Records => (All can read)
    Route::get('/', [PaymentController::class, 'index'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('payments.index');

    // 29. Update Payment Info => (All can do, per matrix)
    Route::get('{id}/edit', [PaymentController::class, 'edit'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('payments.edit');
    Route::put('{id}', [PaymentController::class, 'update'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('payments.update');

    // 30. Delete Payment Record => (Owner, Admin, Staff all can do in matrix)
    Route::delete('{id}', [PaymentController::class, 'destroy'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('payments.destroy');

    // M. Partial / Multiple Payments (35–36)
    // 35. Create Partial Payments => (Owner, Admin, Staff all can do)
    Route::get('partial/create', [PaymentController::class, 'createPartialPayment'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('payments.partial.create');

    Route::post('partial', [PaymentController::class, 'storePartialPayment'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('payments.partial.store');

    // 36. Link Multiple Payments to One Invoice => all can do
    Route::post('invoices/{invoiceId}/link', [PaymentController::class, 'linkPaymentsToInvoice'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('payments.link.invoices');
});


/*
|--------------------------------------------------------------------------
| 2) NotificationController
| Channels, sending, templates
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\NotificationController;

Route::prefix('notifications')->group(function() {

    // D. Notification Channels Setup
    // 8. Semaphore SMS Credentials => (Owner Full, Admin= X, Staff= X)
    Route::get('channels/semaphore', [NotificationController::class, 'viewSemaphore'])
         ->middleware('role:Owner')
         ->name('notifications.channels.semaphore');
    Route::post('channels/semaphore', [NotificationController::class, 'updateSemaphore'])
         ->middleware('role:Owner')
         ->name('notifications.channels.semaphore.update');

    // 9. SMS Credit Limits => (Owner Full, Admin= ✓, Staff= X)
    // So staff is excluded
    Route::get('channels/sms-limit', [NotificationController::class, 'viewSMSLimit'])
         ->middleware('role:Owner,Admin')
         ->name('notifications.channels.smsLimit');
    Route::post('channels/sms-limit', [NotificationController::class, 'updateSMSLimit'])
         ->middleware('role:Owner,Admin')
         ->name('notifications.channels.smsLimit.update');

    // 10. Mailjet Email Credentials => (Owner Full, Admin= X, Staff= X)
    Route::get('channels/mailjet', [NotificationController::class, 'viewMailjet'])
         ->middleware('role:Owner')
         ->name('notifications.channels.mailjet');
    Route::post('channels/mailjet', [NotificationController::class, 'updateMailjet'])
         ->middleware('role:Owner')
         ->name('notifications.channels.mailjet.update');

    // E. Notification Sending & Management
    // 11. Send Bulk SMS => (Owner Full, Admin= ✓, Staff= ✓)
    Route::post('send/bulk-sms', [NotificationController::class, 'sendBulkSMS'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('notifications.send.bulkSMS');

    // 12. Send Bulk Emails => (Owner Full, Admin= ✓, Staff= ✓)
    Route::post('send/bulk-email', [NotificationController::class, 'sendBulkEmail'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('notifications.send.bulkEmail');

    // 13. Ad-hoc SMS/Email => (Owner Full, Admin= ✓, Staff= ✓)
    Route::post('send/ad-hoc', [NotificationController::class, 'adHocNotification'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('notifications.send.adHoc');

    // 14. View SMS Credits => (Owner Full, Admin= ✓, Staff= ✓)
    Route::get('sms-credits', [NotificationController::class, 'viewSMSCredits'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('notifications.smsCredits');

    // 15. Advanced Email Settings => (Owner Full, Admin= X, Staff= X)
    Route::get('mailjet/advanced', [NotificationController::class, 'advancedMailjet'])
         ->middleware('role:Owner')
         ->name('notifications.mailjet.advanced');

    // F. Notification Templates
    // 16. Create/Edit Templates => (Owner Full, Admin= ✓, Staff= ✓)
    Route::get('templates', [NotificationController::class, 'indexTemplates'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('notifications.templates.index');
    Route::post('templates', [NotificationController::class, 'storeTemplate'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('notifications.templates.store');

    Route::get('templates/{id}/edit', [NotificationController::class, 'editTemplate'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('notifications.templates.edit');

    Route::post('templates/{id}/update', [NotificationController::class, 'updateTemplate'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('notifications.templates.update');

    // 17. Approve Official Templates => (Owner Full, Admin= ✓, Staff= ✓)
    Route::post('templates/{id}/approve', [NotificationController::class, 'approveTemplate'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('notifications.templates.approve');
});


/*
|--------------------------------------------------------------------------
| 3) MembershipController
| Member, MembershipPlan, Renewal, Freeze
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\MembershipController;

Route::prefix('membership')->group(function() {

    // G. Member Table
    // 18. Create New Member => (Owner Full, Admin Full, Staff Full)
    Route::get('members/create', [MembershipController::class, 'createMember'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('membership.members.create');
    Route::post('members', [MembershipController::class, 'storeMember'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('membership.members.store');

    // 19. Read Member Details => (All roles)
    Route::get('members', [MembershipController::class, 'indexMembers'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('membership.members.index');

    // 20. Update Member Info => (All roles)
    Route::get('members/{id}/edit', [MembershipController::class, 'editMember'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('membership.members.edit');
    Route::put('members/{id}', [MembershipController::class, 'updateMember'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('membership.members.update');

    // 21. Delete Member Record => (Owner Full, Admin Full, Staff = X)
    Route::delete('members/{id}', [MembershipController::class, 'destroyMember'])
         ->middleware('role:Owner,Admin')
         ->name('membership.members.destroy');

    // H. MembershipPlan (22 Manage Plans) => (Owner, Admin)
    Route::get('plans', [MembershipController::class, 'indexPlans'])
         ->middleware('role:Owner,Admin')
         ->name('membership.plans.index');
    Route::post('plans', [MembershipController::class, 'storePlan'])
         ->middleware('role:Owner,Admin')
         ->name('membership.plans.store');
    Route::put('plans/{id}', [MembershipController::class, 'updatePlan'])
         ->middleware('role:Owner,Admin')
         ->name('membership.plans.update');
    Route::delete('plans/{id}', [MembershipController::class, 'destroyPlan'])
         ->middleware('role:Owner,Admin')
         ->name('membership.plans.destroy');

    // I. MembershipRenewal
    // 23. Create Renewal => (Owner, Admin, Staff => partial)
    Route::get('renewals/create', [MembershipController::class, 'createRenewal'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('membership.renewals.create');
    Route::post('renewals', [MembershipController::class, 'storeRenewal'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('membership.renewals.store');

    // 24. View Renewal Logs => (Owner, Admin, Staff read-only)
    Route::get('renewals/logs', [MembershipController::class, 'renewalLogs'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('membership.renewals.logs');

    // J. MembershipFreeze
    // 25. Create Freeze => (Owner, Admin, Staff => full)
    Route::get('freezes/create', [MembershipController::class, 'createFreeze'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('membership.freezes.create');
    Route::post('freezes', [MembershipController::class, 'storeFreeze'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('membership.freezes.store');

    // 26. View Freeze => (All roles)
    Route::get('freezes', [MembershipController::class, 'indexFreezes'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('membership.freezes.index');
});


/*
|--------------------------------------------------------------------------
| 4) BookingController
| Bookings, Facilities, Coaching Sessions
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\BookingController;

Route::prefix('booking')->group(function() {

    // N. Booking & Facility
    // 37. Create Booking => (Owner, Admin, Staff)
    Route::get('create', [BookingController::class, 'createBooking'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('booking.create');
    Route::post('/', [BookingController::class, 'storeBooking'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('booking.store');

    // 38. Read/Update Booking => (All roles)
    Route::get('/', [BookingController::class, 'indexBooking'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('booking.index');
    Route::get('{id}/edit', [BookingController::class, 'editBooking'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('booking.edit');
    Route::put('{id}', [BookingController::class, 'updateBooking'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('booking.update');

    // 39. Cancel Booking => (All roles)
    Route::post('{id}/cancel', [BookingController::class, 'cancelBooking'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('booking.cancel');

    // Facilities 
    Route::get('facilities', [BookingController::class, 'indexFacilities'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('booking.facilities.index');

    // O. Coaching Sessions
    // 40. Create/Edit Session => (All roles)
    Route::get('sessions', [BookingController::class, 'indexSessions'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('booking.sessions.index');
    Route::get('sessions/create', [BookingController::class, 'createSession'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('booking.sessions.create');
    Route::post('sessions', [BookingController::class, 'storeSession'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('booking.sessions.store');

    // 41. SessionBooking => (All roles)
    Route::post('sessions/book', [BookingController::class, 'storeSessionBooking'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('booking.sessions.book');

    // 42. SessionWaitlist => (All roles)
    Route::post('sessions/waitlist', [BookingController::class, 'addToWaitlist'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('booking.sessions.waitlist');

    // 43. SessionAttendance => (All roles)
    Route::post('sessions/attendance', [BookingController::class, 'markAttendance'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('booking.sessions.attendance');
});


/*
|--------------------------------------------------------------------------
| 5) StaffController
| Staff management, tasks, schedule, attendance, payroll, bonus
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\StaffController;

Route::prefix('staff')->group(function() {

    // AA. Staff Management
    // 67. Create Staff => (Owner, Admin)
    Route::get('create', [StaffController::class, 'createStaff'])
         ->middleware('role:Owner,Admin')
         ->name('staff.create');
    Route::post('/', [StaffController::class, 'storeStaff'])
         ->middleware('role:Owner,Admin')
         ->name('staff.store');

    // 70. View Staff List => (Owner, Admin, Staff read-only)
    // We let all roles in, staff sees partial data
    Route::get('/', [StaffController::class, 'indexStaff'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('staff.index');

    // 68. Edit/Update Staff => (Owner, Admin) => staff can’t update others
    Route::get('{id}/edit', [StaffController::class, 'editStaff'])
         ->middleware('role:Owner,Admin')
         ->name('staff.edit');
    Route::put('{id}', [StaffController::class, 'updateStaff'])
         ->middleware('role:Owner,Admin')
         ->name('staff.update');

    // 69. Deactivate/Delete Staff => (Owner, Admin)
    Route::post('{id}/deactivate', [StaffController::class, 'deactivateStaff'])
         ->middleware('role:Owner,Admin')
         ->name('staff.deactivate');
    Route::delete('{id}', [StaffController::class, 'destroyStaff'])
         ->middleware('role:Owner,Admin')
         ->name('staff.destroy');

    // V. Attendance (Staff)
    // 56. Clock In/Out => (Admin Full, Staff Self) => 
    // We'll let both Admin,Staff
    Route::post('attendance/clock', [StaffController::class, 'clockInOut'])
         ->middleware('role:Admin,Staff')
         ->name('staff.attendance.clock');

    // 57. View/Edit Staff Attendance => (Owner,Admin => Full, Staff => X)
    Route::get('attendance', [StaffController::class, 'indexAttendance'])
         ->middleware('role:Owner,Admin')
         ->name('staff.attendance.index');
    Route::put('attendance/{id}', [StaffController::class, 'updateAttendance'])
         ->middleware('role:Owner,Admin')
         ->name('staff.attendance.update');

    // R. Staff Tasks
    // 48. Create/Update => (Owner, Admin)
    Route::get('tasks', [StaffController::class, 'indexTasks'])
         ->middleware('role:Owner,Admin')
         ->name('staff.tasks.index');
    Route::post('tasks', [StaffController::class, 'storeTask'])
         ->middleware('role:Owner,Admin')
         ->name('staff.tasks.store');
    Route::put('tasks/{id}', [StaffController::class, 'updateTask'])
         ->middleware('role:Owner,Admin')
         ->name('staff.tasks.update');

    // 49. Mark Completed => (Owner, Admin, Staff => only own tasks)
    // We'll let all roles in, do logic in controller
    Route::post('tasks/{id}/complete', [StaffController::class, 'markTaskCompleted'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('staff.tasks.complete');

    // AB. StaffSchedule
    // 71. Create/Edit => (Owner,Admin) 
    Route::get('schedules', [StaffController::class, 'indexSchedules'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('staff.schedules.index'); // 73 view
    Route::get('schedules/create', [StaffController::class, 'createSchedule'])
         ->middleware('role:Owner,Admin')
         ->name('staff.schedules.create'); // 71
    Route::post('schedules', [StaffController::class, 'storeSchedule'])
         ->middleware('role:Owner,Admin')
         ->name('staff.schedules.store');
    Route::delete('schedules/{id}', [StaffController::class, 'destroySchedule'])
         ->middleware('role:Owner,Admin')
         ->name('staff.schedules.destroy'); //72

    // W. Payroll & Bonus
    // 58. Payroll (create) => (Owner, Admin)
    Route::get('payroll/create', [StaffController::class, 'createPayroll'])
         ->middleware('role:Owner,Admin')
         ->name('staff.payroll.create');
    Route::post('payroll', [StaffController::class, 'storePayroll'])
         ->middleware('role:Owner,Admin')
         ->name('staff.payroll.store');

    // 59. View/Update => (Owner, Admin, Staff => X for update) 
    Route::get('payroll', [StaffController::class, 'indexPayroll'])
         ->middleware('role:Owner,Admin')
         ->name('staff.payroll.index');
    Route::put('payroll/{id}', [StaffController::class, 'updatePayroll'])
         ->middleware('role:Owner,Admin')
         ->name('staff.payroll.update');

    // 60. Bonus => (Owner, Admin)
    Route::get('bonus/create', [StaffController::class, 'createBonus'])
         ->middleware('role:Owner,Admin')
         ->name('staff.bonus.create');
    Route::post('bonus', [StaffController::class, 'storeBonus'])
         ->middleware('role:Owner,Admin')
         ->name('staff.bonus.store');
});


/*
|--------------------------------------------------------------------------
| 6) OperationsController
| Inventory, locker usage, equipment, member visits
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\OperationsController;

Route::prefix('operations')->group(function() {

    // AC. Inventory
    // 74. Create/Edit Product => (Owner,Admin) staff = X
    Route::get('products', [OperationsController::class, 'indexProducts'])
         ->middleware('role:Owner,Admin')
         ->name('operations.products.index');
    Route::post('products', [OperationsController::class, 'storeProduct'])
         ->middleware('role:Owner,Admin')
         ->name('operations.products.store');

    // 75. Adjust Stock => (Owner,Admin => full, Staff => maybe partial?)
    Route::post('products/adjust', [OperationsController::class, 'adjustStock'])
         ->middleware('role:Owner,Admin,Staff') 
         ->name('operations.products.adjust');

    // 76. Delete Product => (Owner,Admin) staff = X
    Route::delete('products/{id}', [OperationsController::class, 'destroyProduct'])
         ->middleware('role:Owner,Admin')
         ->name('operations.products.destroy');

    // 77. View Stock => (Owner,Admin => Full, Staff => read-only)
    Route::get('stock-levels', [OperationsController::class, 'viewStockLevels'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('operations.products.stockLevels');

    // P. Locker & Usage
    // 44. Manage Locker => (All roles)
    Route::get('lockers', [OperationsController::class, 'indexLockers'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('operations.lockers.index');
    Route::post('lockers', [OperationsController::class, 'storeLocker'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('operations.lockers.store');

    // 45. LockerUsage => (All roles)
    Route::post('lockers/borrow', [OperationsController::class, 'borrowLockerKey'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('operations.lockers.borrow');
    Route::post('lockers/{usageId}/return', [OperationsController::class, 'returnLockerKey'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('operations.lockers.return');

    // Q. Equipment & Maintenance
    // 46. Equipment => (Owner,Admin,Staff)
    Route::get('equipment', [OperationsController::class, 'indexEquipment'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('operations.equipment.index');
    Route::post('equipment', [OperationsController::class, 'storeEquipment'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('operations.equipment.store');

    // 47. MaintenanceLog => (All roles)
    Route::post('equipment/maintenance', [OperationsController::class, 'addMaintenanceLog'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('operations.equipment.maintenance');

    // S. MemberVisit
    // 50. Log Visit => (All roles)
    Route::get('visits/create', [OperationsController::class, 'createVisit'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('operations.visits.create');
    Route::post('visits', [OperationsController::class, 'storeVisit'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('operations.visits.store');

    // 51. View/Update => (All roles)
    Route::get('visits', [OperationsController::class, 'indexVisits'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('operations.visits.index');
    Route::get('visits/{id}/edit', [OperationsController::class, 'editVisit'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('operations.visits.edit');
    Route::put('visits/{id}', [OperationsController::class, 'updateVisit'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('operations.visits.update');
});


/*
|--------------------------------------------------------------------------
| 7) FinanceController
| Daily cash flow, expenses, promotions
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\FinanceController;

Route::prefix('finance')->group(function() {

    // X. DailyCashFlow
    // 61. Record Daily CashFlow => (Owner,Admin, Staff= X)
    Route::get('cashflow/create', [FinanceController::class, 'createCashFlow'])
         ->middleware('role:Owner,Admin')
         ->name('finance.cashflow.create');
    Route::post('cashflow', [FinanceController::class, 'storeCashFlow'])
         ->middleware('role:Owner,Admin')
         ->name('finance.cashflow.store');

    // 62. View CashFlow => (Owner,Admin => full, Staff => read-only)
    Route::get('cashflow', [FinanceController::class, 'indexCashFlow'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('finance.cashflow.index');

    // AE. Expenses
    // 81. Create Expense => (Owner,Admin), Staff= X
    Route::get('expenses/create', [FinanceController::class, 'createExpense'])
         ->middleware('role:Owner,Admin')
         ->name('finance.expenses.create');
    Route::post('expenses', [FinanceController::class, 'storeExpense'])
         ->middleware('role:Owner,Admin')
         ->name('finance.expenses.store');

    // 82. Read Expense => (Owner,Admin => full, Staff => read only)
    Route::get('expenses', [FinanceController::class, 'indexExpenses'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('finance.expenses.index');

    // 83. Update Expense => (Owner,Admin), Staff= X
    Route::get('expenses/{id}/edit', [FinanceController::class, 'editExpense'])
         ->middleware('role:Owner,Admin')
         ->name('finance.expenses.edit');
    Route::put('expenses/{id}', [FinanceController::class, 'updateExpense'])
         ->middleware('role:Owner,Admin')
         ->name('finance.expenses.update');

    // 84. Delete Expense => (Owner,Admin), Staff= X
    Route::delete('expenses/{id}', [FinanceController::class, 'destroyExpense'])
         ->middleware('role:Owner,Admin')
         ->name('finance.expenses.destroy');

    // U. Promotions (54–55) => (Owner,Admin,Staff => full)
    // 54. Create/Edit => all
    Route::get('promotions', [FinanceController::class, 'indexPromotions'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('finance.promotions.index');
    Route::post('promotions', [FinanceController::class, 'storePromotion'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('finance.promotions.store');

    // 55. Activate/Deactivate => all
    Route::post('promotions/{id}/toggle', [FinanceController::class, 'togglePromotion'])
         ->middleware('role:Owner,Admin,Staff')
         ->name('finance.promotions.toggle');
});


/*
|--------------------------------------------------------------------------
| 8) SystemController
| System logs, system-wide reports
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\SystemController;

Route::prefix('system')->group(function() {

    // T. SystemLog
    // 52. View Logs => (Owner,Admin => full, Staff => X)
    Route::get('logs', [SystemController::class, 'indexLogs'])
         ->middleware('role:Owner,Admin')
         ->name('system.logs.index');

    // 53. Delete/Archive Logs => (Owner => full, Admin => X per matrix ?? Actually matrix says: 53 is => (Owner=Full, Manager= X, Staff= X)
    Route::delete('logs/{id}', [SystemController::class, 'destroyLog'])
         ->middleware('role:Owner')
         ->name('system.logs.destroy');

    // Y. Reports & Analytics
    // 63. Generate System-wide => (Owner=Full, Admin=Full, Staff= X or limited)
    Route::get('reports', [SystemController::class, 'generateReports'])
         ->middleware('role:Owner,Admin')
         ->name('system.reports');
});

