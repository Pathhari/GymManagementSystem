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
    $data = $request->validate([
        'staffIds' => 'required|array',
        'subject'  => 'required|string|max:100',
        'message'  => 'required|string|max:2000',
    ]);

    // Determine sender's name from authenticated user (adjust logic as needed)
    $senderName = 'System';
    if ($user = auth('staff')->user() ?? auth('admin')->user() ?? auth('owner')->user()) {
        $senderName = $user->name;
    }

    foreach ($data['staffIds'] as $staffId) {
        Notification::create([
            'MemberID'           => null,
            'EventTrigger'       => 'StaffNotice',
            'Subject'            => $data['subject'],           // Save subject
            'Message'            => $data['message'],           // Save message separately
            'Sender'             => $senderName,                // Save sender's name
            'NotificationMethod' => 'Internal',
            'SentDate'           => now(),
            'Status'             => 'Sent',
        ]);
    }

    return response()->json(['status' => 'success', 'message' => 'Staff notifications sent.'], 200);
}

public function getStaffNotifications(Request $request)
{
    $notifications = Notification::where('EventTrigger', 'StaffNotice')
                        ->orderBy('NotificationID', 'desc')
                        ->get();
    return response()->json($notifications);
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
        // 1) Fetch members expiring in 7 days
        $expiringSoon = Member::whereBetween('MembershipEndDate', [now(), now()->addDays(7)])->get();
    
        if ($expiringSoon->isEmpty()) {
            return response()->json([
                'status'  => 'no-action',
                'message' => 'No members expiring in 7 days.'
            ], 200);
        }
    
        // 2) Initialize Mailjet Client
        $mj = new Client(
            config('services.mailjet.api_key'),
            config('services.mailjet.secret_key'),
            true,
            ['version' => 'v3.1']
        );
    
        // 3) Build the messages array for all expiring members
        $messages = [];
        foreach ($expiringSoon as $member) {
            if (!empty($member->Email)) {
                $memberName = !empty($member->FullName) ? $member->FullName : 'Valued Member';
                $msg = [
                    'From' => [
                        'Email' => config('services.mailjet.from.address'),
                        'Name'  => config('services.mailjet.from.name'),
                    ],
                    'To' => [
                        ['Email' => $member->Email, 'Name' => $memberName],
                    ],
                    'TemplateID'       => 6731692, // Your Mailjet Template ID
                    'TemplateLanguage' => true,
                    'Subject'          => 'CONTNENTAL GYM PAYMENT DUE',
                    'Variables'        => [
                        'member_name' => $memberName,
                        'expiry_date' => \Carbon\Carbon::parse($member->MembershipEndDate)->format('F j, Y'),
                    ],
                ];
                $messages[] = $msg;
            }
        }
    
        if (empty($messages)) {
            return response()->json([
                'status'  => 'no-action',
                'message' => 'No valid email recipients found.'
            ], 200);
        }
    
        // 4) Chunk messages into batches of 50 to comply with Mailjet’s limits.
        $chunks = array_chunk($messages, 50);
        $overallSuccess = 0;
        $overallFailed  = 0;
        $responses      = [];
    
        foreach ($chunks as $chunk) {
            $body = ['Messages' => $chunk];
            $response = $mj->post(Resources::$Email, ['body' => $body]);
            $responseData = $response->getData();
            
            // Count successes and failures from each chunk response
            foreach ($responseData['Messages'] as $msg) {
                if (isset($msg['Status']) && strtolower($msg['Status']) === 'success') {
                    $overallSuccess++;
                } else {
                    $overallFailed++;
                }
            }
            $responses[] = $responseData;
        }
    
        $status = ($overallFailed === 0) ? 'success' : 'partial';
    
        return response()->json([
            'status'  => $status,
            'message' => "Expiry reminder emails sent! Success: {$overallSuccess}, Failed: {$overallFailed}",
            'responses' => $responses,
        ], 200);
    }


    public function sendExpiringMembershipReminderForSelected(Request $request)
{
    $data = $request->validate([
        'memberIds' => 'required|array',
    ]);

    // Fetch only the selected members that are expiring in the next 7 days.
    $expiringMembers = Member::whereIn('MemberID', $data['memberIds'])
        ->whereBetween('MembershipEndDate', [now(), now()->addDays(7)])
        ->get();

    if ($expiringMembers->isEmpty()) {
        return response()->json([
            'status'  => 'no-action',
            'message' => 'No selected members are expiring in 7 days.'
        ], 200);
    }

    // Initialize Mailjet Client
    $mj = new \Mailjet\Client(
        config('services.mailjet.api_key'),
        config('services.mailjet.secret_key'),
        true,
        ['version' => 'v3.1']
    );

    // Build the messages array
    $messages = [];
    foreach ($expiringMembers as $member) {
        if (!empty($member->Email)) {
            $memberName = $member->FullName ?: 'Valued Member';
            $messages[] = [
                'From' => [
                    'Email' => config('services.mailjet.from.address'),
                    'Name'  => config('services.mailjet.from.name'),
                ],
                'To' => [
                    ['Email' => $member->Email, 'Name' => $memberName],
                ],
                'TemplateID'       => 6731692, // Your Mailjet Template ID for expiry reminder
                'TemplateLanguage' => true,
                'Subject'          => 'CONTNENTAL GYM PAYMENT DUE',
                'Variables'        => [
                    'member_name' => $memberName,
                    'expiry_date' => \Carbon\Carbon::parse($member->MembershipEndDate)->format('F j, Y'),
                ],
            ];
        }
    }

    if (empty($messages)) {
        return response()->json([
            'status'  => 'no-action',
            'message' => 'No valid email recipients found among selected members.'
        ], 200);
    }

    // Send emails in chunks to respect Mailjet limits
    $chunks = array_chunk($messages, 50);
    $overallSuccess = 0;
    $overallFailed  = 0;
    foreach ($chunks as $chunk) {
        $body = ['Messages' => $chunk];
        $response = $mj->post(\Mailjet\Resources::$Email, ['body' => $body]);
        $responseData = $response->getData();
        foreach ($responseData['Messages'] as $msg) {
            if (isset($msg['Status']) && strtolower($msg['Status']) === 'success') {
                $overallSuccess++;
            } else {
                $overallFailed++;
            }
        }
    }
    
    $status = ($overallFailed === 0) ? 'success' : 'partial';
    
    return response()->json([
        'status'  => $status,
        'message' => "Expiry reminder emails sent for selected members! Success: {$overallSuccess}, Failed: {$overallFailed}",
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
    
        // 2) Create a Notification row for each member with a valid email
        $localNotifs = [];
        foreach ($members as $member) {
            if (!empty($member->Email)) {
                $notif = Notification::create([
                    'MemberID'           => $member->MemberID,
                    'EventTrigger'       => 'MailjetBatch',
                    'Message'            => "Mailjet template #{$data['templateId']} queued.",
                    'NotificationMethod' => 'Email',
                    'SentDate'           => null,
                    'Status'             => 'Queued',
                ]);
                $localNotifs[$member->Email] = $notif;
            }
        }
    
        if (count($localNotifs) === 0) {
            return response()->json([
                'status'  => 'no-action',
                'message' => 'No valid members or emails.',
            ]);
        }
    
        // 3) Prepare Mailjet client using the correct configuration keys
        $mj = new \Mailjet\Client(
            config('services.mailjet.api_key'),
            config('services.mailjet.secret_key'),
            true,
            ['version' => 'v3.1']
        );
    
        // 4) Build the array of messages
        $messages = [];
        foreach ($localNotifs as $email => $notif) {
            $memberId = $notif->MemberID;
            $member   = $members->firstWhere('MemberID', $memberId);
    
            $messages[] = [
                'From' => [
                    'Email' => config('services.mailjet.from.address'),
                    'Name'  => config('services.mailjet.from.name'),
                ],
                'To' => [
                    ['Email' => $email, 'Name' => $member->FullName],
                ],
                'TemplateID'       => $data['templateId'],
                'TemplateLanguage' => true,
                'Subject'          => 'Gym Notification',
                'Variables'       => [
                    'member_name' => $member->FullName,
                ],
            ];
        }
    
        // 5) Call the Mailjet API
        $body = ['Messages' => $messages];
        $response = $mj->post(\Mailjet\Resources::$Email, ['body' => $body]);
    
        if (!$response->success()) {
            foreach ($localNotifs as $notif) {
                $notif->update([
                    'Status'  => 'Failed',
                    'Message' => 'Mailjet request error. Could not send batch.',
                    'SentDate'=> now(),
                ]);
            }
    
            return response()->json([
                'status'  => 'error',
                'message' => 'Mailjet API error on the entire request.',
                'data'    => $response->getData(),
            ], 500);
        }
    
        // 6) Parse partial results from Mailjet
        $responseData = $response->getData();
        $allMessages  = $responseData['Messages'] ?? [];
    
        foreach ($allMessages as $msg) {
            $msgStatus = $msg['Status']; 
            $msgTo     = $msg['To'];
    
            foreach ($msgTo as $rcpt) {
                $rcptEmail = $rcpt['Email'];
                $messageId = $rcpt['MessageUUID'] ?? null;
    
                if (isset($localNotifs[$rcptEmail])) {
                    $notif = $localNotifs[$rcptEmail];
                    $finalStatus = ($msgStatus === 'success') ? 'Sent' : 'Failed';
                    $notif->update([
                        'Status'  => $finalStatus,
                        'Message' => ($finalStatus === 'Sent')
                            ? "Mailjet Template #{$data['templateId']} delivered. (MsgID: $messageId)"
                            : "Mailjet Template #{$data['templateId']} failed.",
                        'SentDate' => now(),
                    ]);
                }
            }
        }
    
        // Count successes and failures
        $successCount = Notification::whereIn('NotificationID', array_values(array_map(fn($n) => $n->NotificationID, $localNotifs)))
                            ->where('Status', 'Sent')
                            ->count();
        $failCount = count($localNotifs) - $successCount;
        $status = ($failCount === 0) ? 'success' : 'partial';
    
        return response()->json([
            'status'         => $status,
            'message'        => "Mailjet sending complete. Success: {$successCount}, Failed: {$failCount}",
            'success_count'  => $successCount,
            'failed_count'   => $failCount,
            'mailjet_detail' => $responseData,
        ]);
    }
    
    

    public function sendSemaphoreSMS(Request $request)
    {
        $data = $request->validate([
            'numbers'    => 'required|string', // Example: "09998887777,09171234567"
            'message'    => 'required|string',
            'senderName' => 'nullable|string',
        ]);
    
        // ✅ Auto-format phone numbers to correct format (09xxxxxx → 639xxxxxx)
        $numbersArray = array_map(function ($number) {
            $cleanNumber = preg_replace('/\D/', '', $number); // Remove non-numeric characters
            if (substr($cleanNumber, 0, 2) === '09') {
                $cleanNumber = '63' . substr($cleanNumber, 1);
            }
            return $cleanNumber;
        }, explode(',', $data['numbers']));
    
        if (empty($numbersArray)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No valid phone numbers provided'
            ], 422);
        }
    
        // ✅ Insert into notifications log with "Queued" status
        $notifs = [];
        foreach ($numbersArray as $phone) {
            $notifs[$phone] = Notification::create([
                'MemberID'           => null, 
                'EventTrigger'       => 'SemaphoreBatch',
                'Message'            => 'Queued SMS to ' . $phone,
                'NotificationMethod' => 'SMS',
                'SentDate'           => null,
                'Status'             => 'Queued',
            ]);
        }
    
        // ✅ Check API key
        $apiKey = config('services.semaphore.key');
        if (!$apiKey) {
            foreach ($notifs as $row) {
                $row->update([
                    'Status'  => 'Failed',
                    'Message' => "Missing SEMAPHORE_API_KEY in config!",
                    'SentDate'=> now(),
                ]);
            }
            return response()->json([
                'status'  => 'error',
                'message' => 'Missing Semaphore API Key'
            ], 500);
        }
    
      
        $senderName = "Contnental"; 
        $postData = [
            'apikey'     => $apiKey,
            'number'     => implode(',', $numbersArray),
            'message'    => $data['message'],
            'sendername' => $senderName,
        ];
    
        try {
            $client = new \GuzzleHttp\Client();
            $response = $client->post('https://api.semaphore.co/api/v4/messages', [
                'form_params' => $postData,
            ]);
    
            $json = json_decode($response->getBody()->getContents(), true);

            // ✅ Log full Semaphore API response before processing
            \Log::info('Semaphore API Raw Response:', $json);
            
            // ✅ Check if response is valid
            if (!is_array($json)) {
                foreach ($notifs as $row) {
                    $row->update([
                        'Status'  => 'Failed',
                        'Message' => "Invalid JSON from Semaphore",
                        'SentDate'=> now(),
                    ]);
                }
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Unexpected Semaphore response format.',
                    'raw'     => $json
                ], 500);
            }
            
    
            // ✅ Update notification status based on API response
            foreach ($json as $item) {
                $recipient = $item['recipient'];
                $status    = $item['status'] ?? 'Unknown';
                $messageId = $item['message_id'] ?? null;
    
                if (isset($notifs[$recipient])) {
                    $notif = $notifs[$recipient];
    
                    // ✅ Handle status properly
                    if ($status === 'Queued' || $status === 'Pending') {
                        $finalStatus = 'Pending'; // Awaiting delivery
                    } elseif ($status === 'Sent') {
                        $finalStatus = 'Sent';
                    } else {
                        $finalStatus = 'Failed';
                    }
    
                    // ✅ Update database
                    $notif->update([
                        'Status'  => $finalStatus,
                        'Message' => "Semaphore: $status (MsgID: $messageId) for {$recipient}",
                        'SentDate'=> now(),
                    ]);
                }
            }
    
            // ✅ Count sent and failed messages
            $successCount = Notification::whereIn(
                'NotificationID', 
                array_values(array_map(fn($n) => $n->NotificationID, $notifs))
            )->where('Status', 'Sent')->count();
    
            $failCount = count($notifs) - $successCount;
    
            // ✅ Return response
            return response()->json([
                'status'       => $failCount === 0 ? 'success' : 'partial',
                'message'      => "Semaphore request done. Success: $successCount, Failed: $failCount",
                'successCount' => $successCount,
                'failCount'    => $failCount,
                'response'     => $json,
            ]);
    
        } catch (\Exception $ex) {
            // ✅ Log the exact error
            \Log::error('Semaphore API Error: ' . $ex->getMessage());
    
            // ✅ Update database as failed
            foreach ($notifs as $row) {
                $row->update([
                    'Status'  => 'Failed',
                    'Message' => $ex->getMessage(),
                    'SentDate'=> now(),
                ]);
            }
    
            return response()->json([
                'status'  => 'error',
                'message' => 'Error sending SMS via Semaphore: ' . $ex->getMessage(),
            ], 500);
        }
    }
    
    
    public function notifyCoachOfBookingMailjet(Request $request)
    {
        $data = $request->validate([
            'coach_id'      => 'required|exists:coaches,CoachID',
            'coach_name'    => 'required|string|max:255',
            'coach_email'   => 'required|email',
            'member_name'   => 'required|string|max:255',
            'session_name'  => 'required|string|max:255',
            'start_time'    => 'required|date_format:Y-m-d H:i:s',
            'end_time'      => 'required|date_format:Y-m-d H:i:s',
        ]);
    
        // 1) Prepare a Mailjet Client
        $mj = new Client(
            config('services.mailjet.api_key'),
            config('services.mailjet.secret_key'),
            true,
            ['version' => 'v3.1']
        );        
    
        // 2) Build the message array
        //    If you already have a dedicated “Coach Booking” Template in Mailjet,
        //    set its ID and pass placeholders in `Variables`.
        $templateID = 9999999; // <--- put your actual Mailjet template ID here
    
        $body = [
            'Messages' => [
                [
                    'From' => [
                        'Email' => config('services.mailjet.from.address'), // e.g. "no-reply@yourdomain.com"
                        'Name'  => config('services.mailjet.from.name'),    // e.g. "Gym Booking"
                    ],
                    'To' => [
                        [
                            'Email' => $data['coach_email'],
                            'Name'  => $data['coach_name'],
                        ]
                    ],
                    'TemplateID'      => $templateID,
                    'TemplateLanguage' => true,
                    'Subject'         => 'New Booking For You',
                    'Variables' => [
                        // These correspond to placeholders in your Mailjet template,
                        // like {{var:coach_name}}, {{var:member_name}}, etc.
                        'coach_name'   => $data['coach_name'],
                        'member_name'  => $data['member_name'],
                        'session_name' => $data['session_name'],
                        'start_time'   => $data['start_time'],
                        'end_time'     => $data['end_time'],
                    ],
                ]
            ]
        ];
    
        // 3) Send request
        $response = $mj->post(Resources::$Email, ['body' => $body]);
    
        // 4) Evaluate response
        if ($response->success()) {
            // Optionally store a row in your notifications table
            // so you have a log that the coach was notified by email.
            \App\Models\Notification::create([
                'MemberID'           => null, // or store the coach if you want
                'EventTrigger'       => 'CoachBookedMailjet',
                'Message'            => "Coach #{$data['coach_id']} => Booked email sent to {$data['coach_email']}",
                'NotificationMethod' => 'Email',
                'SentDate'           => now(),
                'Status'             => 'Sent',
            ]);
    
            return response()->json([
                'status'  => 'success',
                'message' => 'Coach booking email sent via Mailjet.',
            ]);
        }
    
        // If the response is not successful, handle it:
        return response()->json([
            'status'  => 'error',
            'message' => 'Mailjet error when sending to coach.',
            'data'    => $response->getData(),
        ], 500);
    }

}
