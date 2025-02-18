<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;
use App\Models\SystemSetting;
use App\Models\NotificationTemplate;
use App\Models\Notification;
use App\Models\Member;
// Add Mailjet imports
use Mailjet\Resources;
use Mailjet\Client;


class NotificationController extends Controller
{
    /* ------------------------------------------------------------------
     * D. NOTIFICATION CHANNELS SETUP
     * - Storing credentials/limits in 'system_settings'
     * ------------------------------------------------------------------ */

    // 8. Semaphore SMS Creds => route:Owner
    public function viewSemaphore()
    {
        // Usually staff doesn't have access to global credentials, so no branch logic here.
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

        // Upsert the system_settings row
        SystemSetting::updateOrCreate(
            ['key' => 'semaphore_key'],
            ['value' => $data['semaphoreKey']]
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
            ['key' => 'mailjet_key'],
            ['value'=> $data['mailjetKey']]
        );

        return redirect()
            ->back()
            ->with('success','Mailjet credentials updated.');
    }


    /* ------------------------------------------------------------------
     * E. NOTIFICATION SENDING & MANAGEMENT
     * - Typically logs in "notifications" table
     * ------------------------------------------------------------------ */

    // 11. Send Bulk SMS => route:Owner,Admin,Staff
    public function sendBulkSMS(Request $request)
    {
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        // In a real app, staff might only send to their own branch's members
        // But this code doesn't do a membership query. It's just an example.
        // You could extend to fetch members of staff->BranchID if you want.

        $data = $request->validate([
            'message'        => 'required|string|max:500',
            'recipientGroup' => 'nullable|string|max:50',
        ]);

        // Possibly integrate with your SMS service here.
        Notification::create([
            'MemberID'          => null,  // bulk => not a specific member
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
        $staff = auth('staff')->user();
        // If staff => limit to staff->BranchID members? 
        // The snippet doesn't do that by default, but you can adapt it similarly.

        $data = $request->validate([
            'subject' => 'required|string|max:100',
            'body'    => 'required|string|max:2000',
        ]);

        // Similar approach: no specific member, so no direct branch check here.
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
        $staff = auth('staff')->user();
        $admin = auth('admin')->user();
        $owner = auth('owner')->user();

        // Staff can only pick members from their branch if you want the same approach
        $data = $request->validate([
            'MemberID' => 'required|exists:members,MemberID',
            'method'   => 'required|string|in:SMS,Email',
            'message'  => 'required|string|max:500',
        ]);

        // If staff => check that the chosen member is from staff->BranchID
        if ($staff) {
            $member = Member::findOrFail($data['MemberID']);
            if ($member->StartedBranchID != $staff->BranchID) {
                abort(403, 'You cannot send an ad-hoc notification to another branch\'s member.');
            }
        }

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
        $limitSetting = SystemSetting::where('key','sms_daily_limit')->first();
        $limit = $limitSetting ? (int)$limitSetting->value : 1000;

        // If you track usage by branch, staff sees only their usage. 
        // Here we keep it simple: a universal approach.
        $creditsUsed = 200; 
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
        // No branch logic; typically a global owner feature
        return Inertia::render('Notifications/Setup/AdvancedMailjet');
    }


    public function indexAnnouncements()
{
    // Return the latest announcements from notifications table
    $announcements = Notification::where('EventTrigger','Announcement')
        ->orderBy('NotificationID','desc')
        ->get();

    return response()->json($announcements);
}

public function storeAnnouncement(Request $request)
{
    // Validate input
    $data = $request->validate([
        'topic'   => 'required|string|max:100',
        'message' => 'required|string|max:2000',
    ]);

    // Create in notifications table
    $notif = Notification::create([
        'MemberID'           => null,
        'EventTrigger'       => 'Announcement',
        // We'll combine topic + message into 'Message' field
        'Message'            => "Topic: {$data['topic']}\n{$data['message']}",
        'NotificationMethod' => 'Internal', // or some arbitrary label
        'SentDate'           => now(),
        'Status'             => 'Sent',
    ]);

    // Return the newly created announcement as JSON
    return response()->json($notif, 201);
}

public function updateAnnouncement(Request $request, $id)
{
    $data = $request->validate([
        'topic'   => 'required|string|max:100',
        'message' => 'required|string|max:2000',
    ]);

    // Find the target "announcement" in notifications
    $notif = Notification::where('EventTrigger','Announcement')
        ->where('NotificationID', $id)
        ->firstOrFail();

    $notif->update([
        'Message' => "Topic: {$data['topic']}\n{$data['message']}",
    ]);

    return response()->json($notif);
}

public function destroyAnnouncement($id)
{
    $notif = Notification::where('EventTrigger','Announcement')
        ->where('NotificationID', $id)
        ->firstOrFail();

    $notif->delete();

    return response()->json(['message' => 'Announcement deleted.'], 200);
}

/**
 * Send Notification to selected staff (JSON approach)
 */
public function sendStaffNotification(Request $request)
{
    // If you have actual staff records, you'd typically validate staff IDs exist.
    // We'll keep it direct for now.
    $data = $request->validate([
        'staffIds' => 'required|array',
        'subject'  => 'required|string|max:100',
        'message'  => 'required|string|max:2000',
    ]);

    // For each staff ID, create a notification row
    // or do email/SMS integration if you prefer
    foreach ($data['staffIds'] as $staffId) {
        Notification::create([
            'MemberID'           => null,
            'EventTrigger'       => 'StaffNotice',
            'Message'            => "Subject: {$data['subject']}\n{$data['message']}",
            'NotificationMethod' => 'Internal',
            'SentDate'           => now(),
            'Status'             => 'Sent',
        ]);
    }

    return response()->json(['message' => 'Staff notifications sent.'], 200);
}



    /* ------------------------------------------------------------------
     * F. NOTIFICATION TEMPLATES
     * ------------------------------------------------------------------ */

    // 16. Create/Edit => route:All
    public function indexTemplates()
    {
        // Typically global, no branch column in notification_templates
        $templates = NotificationTemplate::orderBy('name','asc')->get();

        return Inertia::render('Notifications/Templates/Index', [
            'templates' => $templates
        ]);
    }

    public function storeTemplate(Request $request)
    {
        $data = $request->validate([
            'TemplateID' => 'nullable|exists:notification_templates,id',
            'name'       => 'required|string|max:100|unique:notification_templates,name,'.$request->TemplateID.',id',
            'content'    => 'required|string',
        ]);

        if (!empty($data['TemplateID'])) {
            // Update existing
            $template = NotificationTemplate::findOrFail($data['TemplateID']);
            $template->update([
                'name'    => $data['name'],
                'content' => $data['content'],
            ]);
        } else {
            // Create new
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

    public function sendExpiringMembershipReminder(Request $request)
    {
        // 1) Fetch members expiring in 7 days (adjust logic/date range as needed)
        $expiringSoon = Member::whereDate('expiry_date', '=', now()->addDays(7))->get();

        // 2) Initialize Mailjet Client for Send API v3.1
        $mj = new Client(
            config('services.mailjet.key'),    // MAILJET_API_KEY
            config('services.mailjet.secret'), // MAILJET_SECRET_KEY
            true,
            ['version' => 'v3.1']
        );

        // 3) Build the array of messages
        $messages = [];
        foreach ($expiringSoon as $member) {
            // If member has an email and we want to send
            if (!empty($member->Email)) {
                $messages[] = [
                    'From' => [
                        'Email' => config('services.mailjet.from.address'),
                        'Name'  => config('services.mailjet.from.name'),
                    ],
                    'To' => [
                        ['Email' => $member->Email, 'Name' => $member->name],
                    ],
                    'TemplateID'      => 6731692,      // Your Mailjet Template ID
                    'TemplateLanguage' => true,         // Enable template placeholders
                    'Subject'         => 'CONTNENTAL GYM PAYMENT DUE', 
                    // Pass dynamic variables to match placeholders like {{var:member_name}} etc.
                    'Variables' => [
                        'member_name' => $member->name,
                        'expiry_date' => $member->expiry_date->format('F j, Y'),
                    ],
                ];
            }
        }

        // 4) If we have messages to send, call the Mailjet API
        if (!empty($messages)) {
            $body = ['Messages' => $messages];
            $response = $mj->post(Resources::$Email, ['body' => $body]);

            if ($response->success()) {
                // Optionally log success or do more
                // e.g. return a success message
                return response()->json([
                    'status'  => 'success',
                    'message' => 'Expiry reminder emails sent!',
                    'data'    => $response->getData()
                ], 200);
            } else {
                // Handle or log errors
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Mailjet API call failed',
                    'data'    => $response->getData()
                ], 500);
            }
        }

        // If no members are expiring soon, you can handle that here
        return response()->json([
            'status'  => 'no-action',
            'message' => 'No members expiring in 7 days'
        ], 200);
    }


    public function sendMailjetTemplate(Request $request)
{
    $data = $request->validate([
        'templateId' => 'required|integer',
        'memberIds'  => 'required|array',
    ]);

    // 1) Fetch the members
    $members = Member::whereIn('MemberID', $data['memberIds'])->get();

    // 2) Prepare Mailjet Client and messages
    $mj = new \Mailjet\Client(
        config('services.mailjet.key'),
        config('services.mailjet.secret'),
        true,
        ['version' => 'v3.1']
    );

    $messages = [];
    foreach ($members as $member) {
        // Only if the member has a valid email
        if ($member->Email) {
            $messages[] = [
                'From' => [
                    'Email' => config('services.mailjet.from.address'),
                    'Name'  => config('services.mailjet.from.name'),
                ],
                'To' => [
                    ['Email' => $member->Email, 'Name' => $member->FullName],
                ],
                'TemplateID'      => $data['templateId'],
                'TemplateLanguage' => true,
                'Subject'         => 'Gym Notification',
                'Variables' => [
                    'member_name' => $member->FullName,
                    // Add more placeholders if your template uses them
                ],
            ];
        }
    }

    if (!empty($messages)) {
        $body = ['Messages' => $messages];
        $response = $mj->post(\Mailjet\Resources::$Email, ['body' => $body]);

        if ($response->success()) {
            return response()->json(['status'=>'success', 'message'=>'Template emails sent.']);
        }
        return response()->json([
            'status'  => 'error',
            'message' => 'Mailjet error',
            'data'    => $response->getData(),
        ], 500);
    }

    return response()->json([
        'status'=>'no-action',
        'message'=>'No valid members or emails.'
    ]);
}

public function sendSemaphoreSMS(Request $request)
{
    $data = $request->validate([
        'numbers'    => 'required|string', // e.g. "09998887777,09171234567"
        'message'    => 'required|string',
        'senderName' => 'nullable|string',
    ]);

    // Grab from .env or config (e.g. config('services.semaphore.key'))
    $apiKey = config('services.semaphore.key'); 
    if (!$apiKey) {
        return response()->json(['status'=>'error','message'=>'Missing Semaphore API Key'], 500);
    }

    // Build POST fields
    // If user entered multiple numbers, we pass them as "number=0999...,0917..."
    // or we can just do string replacement if needed.
    $postData = [
        'apikey'     => $apiKey,
        'number'     => $data['numbers'],   // comma-separated
        'message'    => $data['message'],
        'sendername' => $data['senderName'] ?? 'SEMAPHORE'
    ];

    // Now we send cURL or Guzzle POST to https://api.semaphore.co/api/v4/messages
    try {
        $client = new \GuzzleHttp\Client();
        $response = $client->post('https://api.semaphore.co/api/v4/messages', [
            'form_params' => $postData,
        ]);

        $json = json_decode($response->getBody()->getContents(), true);

        // The Semaphore API typically returns an array of message objects.
        // If $json is not empty, we can check or log it
        if (is_array($json)) {
            // You can do extra checks here for status, e.g. "Queued", "Pending", etc.
            return response()->json([
                'status'   => 'success',
                'response' => $json,
            ]);
        } else {
            return response()->json([
                'status'=>'error',
                'message'=>'Unexpected Semaphore response format.',
                'raw' => $json
            ], 500);
        }
    } catch (\Exception $ex) {
        return response()->json([
            'status'  => 'error',
            'message' => $ex->getMessage(),
        ], 500);
    }
}


}
