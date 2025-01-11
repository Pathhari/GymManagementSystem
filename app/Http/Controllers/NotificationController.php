<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;
use App\Models\SystemSetting;
use App\Models\NotificationTemplate;
use App\Models\Notification;

class NotificationController extends Controller
{
    /* ------------------------------------------------------------------
     * D. Notification Channels Setup
     *    - Storing credentials/limits in 'system_settings'
     * ------------------------------------------------------------------ */

    // 8. Semaphore SMS Creds => route:Owner
    public function viewSemaphore()
    {
        // Get semaphore_key from system_settings
        $setting = SystemSetting::where('key','semaphore_key')->first();
        $semaphoreKey = $setting ? $setting->value : '';

        return Inertia::render('Notifications/Setup/Semaphore', [
            'semaphoreKey' => $semaphoreKey
        ]);
    }

    public function updateSemaphore(Request $request)
    {
        $data = $request->validate([
            'semaphoreKey' => 'required|string|max:255',
        ]);

        // Update or create system_settings row
        SystemSetting::updateOrCreate(
            ['key'=>'semaphore_key'],
            ['value'=>$data['semaphoreKey']]
        );

        return redirect()
            ->back()
            ->with('success','Semaphore credentials updated successfully.');
    }

    // 9. SMS Credit Limits => route:Owner,Admin
    public function viewSMSLimit()
    {
        $setting = SystemSetting::where('key','sms_daily_limit')->first();
        $limit = $setting ? $setting->value : '1000';

        return Inertia::render('Notifications/Setup/SMSLimit', [
            'limit' => $limit
        ]);
    }

    public function updateSMSLimit(Request $request)
    {
        $data = $request->validate([
            'limit' => 'required|integer|min:0'
        ]);

        SystemSetting::updateOrCreate(
            ['key'=>'sms_daily_limit'],
            ['value'=>$data['limit']]
        );

        return redirect()
            ->back()
            ->with('success','SMS credit limit updated.');
    }

    // 10. Mailjet Email Credentials => route:Owner
    public function viewMailjet()
    {
        $setting = SystemSetting::where('key','mailjet_key')->first();
        $mailjetKey = $setting ? $setting->value : '';

        return Inertia::render('Notifications/Setup/Mailjet', [
            'mailjetKey' => $mailjetKey
        ]);
    }

    public function updateMailjet(Request $request)
    {
        $data = $request->validate([
            'mailjetKey' => 'required|string|max:255',
        ]);

        SystemSetting::updateOrCreate(
            ['key'=>'mailjet_key'],
            ['value'=>$data['mailjetKey']]
        );

        return redirect()
            ->back()
            ->with('success','Mailjet credentials updated.');
    }


    /* ------------------------------------------------------------------
     * E. Notification Sending & Management
     *    - We'll store logs in "notifications" table
     * ------------------------------------------------------------------ */

    // 11. Send Bulk SMS => route:Owner,Admin,Staff
    public function sendBulkSMS(Request $request)
    {
        // e.g. "message" and "recipientGroup" from form
        $data = $request->validate([
            'message'         => 'required|string|max:500',
            'recipientGroup'  => 'nullable|string|max:50', // e.g. "AllMembers","ActiveOnly", etc.
        ]);

        // Here, you’d integrate with actual SMS sending logic using the "semaphore_key."
        // For demonstration, we just log a single row in "notifications" table.
        Notification::create([
            'MemberID'          => null,                 // Bulk => no specific member
            'EventTrigger'      => 'BulkSMS',
            'Message'           => $data['message'],
            'NotificationMethod'=> 'SMS',
            'SentDate'          => now(),
            'Status'            => 'Sent',
        ]);

        return redirect()->back()->with('success','Bulk SMS sent.');
    }

    // 12. Send Bulk Emails => route:Owner,Admin,Staff
    public function sendBulkEmail(Request $request)
    {
        $data = $request->validate([
            'subject' => 'required|string|max:100',
            'body'    => 'required|string|max:2000',
        ]);

        // Integrate with mailjet_key. For now, just log to "notifications."
        Notification::create([
            'MemberID'          => null,
            'EventTrigger'      => 'BulkEmail',
            'Message'           => "Subject: {$data['subject']}\n\n{$data['body']}",
            'NotificationMethod'=> 'Email',
            'SentDate'          => now(),
            'Status'            => 'Sent',
        ]);

        return redirect()->back()->with('success','Bulk Emails sent.');
    }

    // 13. Ad-hoc => route:Owner,Admin,Staff
    public function adHocNotification(Request $request)
    {
        // Suppose we pick a single MemberID and a message
        $data = $request->validate([
            'MemberID' => 'required|exists:members,MemberID',
            'method'   => 'required|string|in:SMS,Email',
            'message'  => 'required|string|max:500',
        ]);

        // Insert row in "notifications"
        Notification::create([
            'MemberID'          => $data['MemberID'],
            'EventTrigger'      => 'AdHoc',
            'Message'           => $data['message'],
            'NotificationMethod'=> $data['method'],
            'SentDate'          => now(),
            'Status'            => 'Sent',
        ]);

        return redirect()->back()->with('success','Ad-hoc notification sent.');
    }

    // 14. View SMS Credits => route:Owner,Admin,Staff
    public function viewSMSCredits()
    {
        // Possibly call an API or read "sms_daily_limit" from system_settings
        $limitSetting = SystemSetting::where('key','sms_daily_limit')->first();
        $limit = $limitSetting ? (int)$limitSetting->value : 1000;

        // If you track usage, you might do something like "sms_used_today." But let's keep it simple
        $creditsUsed = 200; // example
        $creditsRemaining = $limit - $creditsUsed;

        return Inertia::render('Notifications/SMSCredits', [
            'limit'            => $limit,
            'creditsUsed'      => $creditsUsed,
            'creditsRemaining' => $creditsRemaining,
        ]);
    }

    // 15. Advanced Email Settings => route:Owner
    public function advancedMailjet()
    {
        // For advanced domain verification or sender management
        return Inertia::render('Notifications/Setup/AdvancedMailjet');
    }


    /* ------------------------------------------------------------------
     * F. Notification Templates
     * ------------------------------------------------------------------ */

    // 16. Create/Edit => route:All
    public function indexTemplates()
    {
        // Show all templates from "notification_templates"
        $templates = NotificationTemplate::orderBy('name','asc')->get();

        return Inertia::render('Notifications/Templates/Index', [
            'templates' => $templates
        ]);
    }

    public function storeTemplate(Request $request)
    {
        // If "TemplateID" is present => update, else create
        $data = $request->validate([
            'TemplateID' => 'nullable|exists:notification_templates,id',
            'name'       => 'required|string|max:100|unique:notification_templates,name,'.$request->TemplateID.',id',
            'content'    => 'required|string',
        ]);

        if (!empty($data['TemplateID'])) {
            $template = NotificationTemplate::findOrFail($data['TemplateID']);
            $template->update([
                'name'    => $data['name'],
                'content' => $data['content'],
            ]);
        } else {
            NotificationTemplate::create([
                'name'    => $data['name'],
                'content' => $data['content'],
            ]);
        }

        return redirect()->back()->with('success','Template saved successfully.');
    }

    public function editTemplate($id)
    {
        $template = NotificationTemplate::findOrFail($id);

        return Inertia::render('Notifications/Templates/Edit', [
            'template' => $template
        ]);
    }

    public function updateTemplate(Request $request, $id)
    {
        $template = NotificationTemplate::findOrFail($id);

        $data = $request->validate([
            'name'    => 'required|string|max:100|unique:notification_templates,name,'.$template->id.',id',
            'content' => 'required|string',
        ]);

        $template->update($data);

        return redirect()->route('notifications.templates.index')
            ->with('success','Template updated successfully.');
    }

    // 17. Approve => route:All
    public function approveTemplate($id)
    {
        $template = NotificationTemplate::findOrFail($id);
        $template->update(['approved' => true]);

        return redirect()->back()->with('success','Template approved.');
    }
}
