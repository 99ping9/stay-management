import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Using Service Role Key to bypass RLS in the background CRON job
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getSolapiAuthHeader(apiKey: string, apiSecret: string) {
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(16).toString("hex");
    const signature = crypto.createHmac("sha256", apiSecret).update(date + salt).digest("hex");
    return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

async function sendSolapiMessage(to: string, from: string, text: string, subjectTitle: string, imageUrl?: string) {
    const apiKey = process.env.SOLAPI_API_KEY!;
    const apiSecret = process.env.SOLAPI_API_SECRET!;

    const authHeader = getSolapiAuthHeader(apiKey, apiSecret);

    // Note: if MMS, Solapi v4 requires imageId upload first.
    // For simplicity in this implementation, if imageUrl exists and is a URL, 
    // you need to either fetch the image and upload to solapi storage to get an image ID,
    // or use an alternative method. Since Solapi requires file upload for MMS:
    // We'll leave the image ID logic as a TODO or implement a basic text SMS logic here.
    // MVP: Text SMS/LMS

    const messagePayload = {
        message: {
            to: to.replace(/[^0-9]/g, ""),
            from: from.replace(/[^0-9]/g, ""),
            text,
            subject: subjectTitle,
            type: "SMS", // Solapi auto-detects LMS if text is long, but explicit types can be set
        }
    };

    const response = await fetch("https://api.solapi.com/messages/v4/send", {
        method: "POST",
        headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(messagePayload),
    });

    const result = await response.json();
    return { ok: response.ok, result };
}

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const testNow = searchParams.get("test_now");
        const now = testNow || new Date().toISOString();

        // Fetch pending messages scheduled strictly before now
        const { data: pendingMessages, error: fetchError } = await (supabase
            .from("scheduled_messages")
            .select(`
        id,
        scheduled_at,
        reservation:reservations (
          guest_name,
          phone,
          check_in,
          check_out,
          selected_options,
          room:rooms (
            name,
            staff_members
          ),
          business:businesses (
            contact_phone
          )
        ),
        template:message_templates (
          title,
          content,
          image_url,
          recipient_type
        )
      `)
            .eq("status", "pending")
            .lte("scheduled_at", now)
            .limit(50) as any);

        if (fetchError) {
            console.error("Cron fetch error:", fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!pendingMessages || pendingMessages.length === 0) {
            return NextResponse.json({ message: "No pending messages." });
        }

        const results = [];
        const senderNumber = process.env.SOLAPI_SENDER_NUMBER || "";

        for (const msg of pendingMessages) {
            const resData = msg.reservation;
            const tplData = msg.template;
            const adminPhone = resData?.business?.contact_phone;
            let text = tplData?.content || "";
            const title = tplData?.title;
            const recipientType = tplData?.recipient_type || 'guest';

            if (!resData || !text || !senderNumber) {
                await supabase.from("scheduled_messages").update({
                    status: "failed",
                    error_message: "Missing reservation, text, or senderNumber",
                    sent_at: new Date().toISOString()
                }).eq("id", msg.id);
                continue;
            }

            // --- Dynamic Placeholder Replacement ---
            const optList = (resData.selected_options || []).join(", ");
            const replacements: Record<string, string> = {
                "#{예약자명}": resData.guest_name || "",
                "#{숙소명}": resData.room?.name || "",
                "#{입실일}": resData.check_in || "",
                "#{퇴실일}": resData.check_out || "",
                "#{선택옵션}": optList.length > 0 ? optList : "없음",
            };

            // Process all placeholders
            Object.entries(replacements).forEach(([key, val]) => {
                text = text.split(key).join(val);
            });
            // ----------------------------------------

            // Determine recipient phone numbers
            let recipients: string[] = [];
            if (recipientType === 'staff') {
                const staff = resData.room?.staff_members || [];
                recipients = staff.map((s: any) => s.phone).filter(Boolean);
            } else {
                recipients = [resData.phone].filter(Boolean);
            }

            if (recipients.length === 0) {
                await supabase.from("scheduled_messages").update({
                    status: "failed",
                    error_message: "No recipients found",
                    sent_at: new Date().toISOString()
                }).eq("id", msg.id);
                continue;
            }

            // Try sending SMS via Solapi for each recipient
            let allOk = true;
            const errors = [];

            for (const phone of recipients) {
                const solapiResponse = await sendSolapiMessage(phone, senderNumber, text, title);
                if (!solapiResponse.ok) {
                    allOk = false;
                    errors.push({ phone, error: solapiResponse.result });
                }
            }

            if (allOk) {
                await supabase.from("scheduled_messages").update({
                    status: "sent",
                    sent_at: new Date().toISOString()
                }).eq("id", msg.id);
                results.push({ id: msg.id, status: "sent" });
            } else {
                await supabase.from("scheduled_messages").update({
                    status: "failed",
                    error_message: JSON.stringify(errors),
                    sent_at: new Date().toISOString()
                }).eq("id", msg.id);

                // Fallback: Notify Admin about Failure
                if (adminPhone) {
                    await sendSolapiMessage(
                        adminPhone,
                        senderNumber,
                        `[ChowonSMS 시스템알림]\n문자 발송 실패!\n예약자: ${resData.guest_name}\n대상: ${recipientType}\n오류: 확인 요망`,
                        "발송실패 알림"
                    );
                }
                results.push({ id: msg.id, status: "failed", errors });
            }
        }

        return NextResponse.json({ processed: pendingMessages.length, results, checked_at: now });

    } catch (error: any) {
        console.error("Cron exception:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
