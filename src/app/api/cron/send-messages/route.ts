
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

function getByteLength(str: string) {
    let length = 0;
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        if (charCode <= 127) length += 1;
        else length += 2;
    }
    return length;
}

async function uploadFileToSolapi(imageUrl: string) {
    const apiKey = process.env.SOLAPI_API_KEY!;
    const apiSecret = process.env.SOLAPI_API_SECRET!;
    const authHeader = getSolapiAuthHeader(apiKey, apiSecret);

    console.log(`[Solapi] Fetching image from: ${imageUrl}`);
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error(`이미지 다운로드 실패 (${imageRes.status})`);
    
    const buffer = await imageRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    console.log(`[Solapi] Uploading image to Solapi (Size: ${buffer.byteLength} bytes)`);
    const uploadRes = await fetch("https://api.solapi.com/storage/v1/files", {
        method: "POST",
        headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            file: base64,
            type: "MMS"
        })
    });

    const uploadResult = await uploadRes.json();
    if (!uploadRes.ok) {
        console.error("[Solapi] Upload Error:", uploadResult);
        throw new Error(`Solapi 업로드 에러: ${uploadResult.errorMessage || JSON.stringify(uploadResult)}`);
    }
    return uploadResult.fileId;
}

async function sendSolapiMessage(to: string, from: string, text: string, subjectTitle: string, imageUrl?: string) {
    const apiKey = process.env.SOLAPI_API_KEY!;
    const apiSecret = process.env.SOLAPI_API_SECRET!;
    const authHeader = getSolapiAuthHeader(apiKey, apiSecret);

    let imageId = undefined;
    if (imageUrl) {
        try {
            imageId = await uploadFileToSolapi(imageUrl);
        } catch (err) {
            console.error("Image upload failed:", err);
        }
    }

    const byteLen = getByteLength(text);
    const messagePayload: any = {
        message: {
            to: to.replace(/[^0-9]/g, ""),
            from: from.replace(/[^0-9]/g, ""),
            text,
        }
    };

    if (imageId) {
        // MMS Case
        messagePayload.message.type = "MMS";
        messagePayload.message.subject = subjectTitle;
        messagePayload.message.imageId = imageId;
    } else if (byteLen > 90) {
        // LMS Case
        messagePayload.message.type = "LMS";
        messagePayload.message.subject = subjectTitle;
    } else {
        // SMS Case
        messagePayload.message.type = "SMS";
        // Omit subject for SMS
    }

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
        const { searchParams } = new URL(request.url);
        const authHeader = request.headers.get('authorization');
        const queryKey = searchParams.get('key');
        
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && queryKey !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const testNow = searchParams.get("test_now");
        let now: string;
        if (testNow) {
            // ISO 형식인데 타임존(? 또는 +)이 없으면 한국 시간(+09:00)으로 간주합니다.
            // 사용자가 T10:00:00Z 라고 입력하면 UTC로 인식하고, T10:00:00 이라고만 하면 KST로 인식하게 합니다.
            if (testNow.includes('T') && !testNow.includes('Z') && !testNow.includes('+')) {
                now = new Date(`${testNow}+09:00`).toISOString();
            } else {
                now = testNow;
            }
        } else {
            now = new Date().toISOString();
        }

        const nowKst = new Date(new Date(now).getTime() + (9 * 60 * 60 * 1000)).toISOString().replace('Z', '+09:00');


        // Fetch pending messages scheduled strictly before now
        const { data: pendingMessages, error: fetchError } = await (supabase
            .from("scheduled_messages")
            .select(`
                id,
                scheduled_at,
                reservation:reservations (
                    id,
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
                    id,
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
            return NextResponse.json({ message: "No pending messages.", checked_at: now, checked_at_kst: nowKst });
        }

        const results = [];
        const senderNumber = process.env.SOLAPI_SENDER_NUMBER || "";

        for (const msg of pendingMessages) {
            const resData = msg.reservation;
            const tplData = msg.template;
            const adminPhone = resData?.business?.contact_phone;
            let text = tplData?.content || "";
            const title = tplData?.title || "알림톡";
            const recipientType = tplData?.recipient_type || 'guest';

            if (!resData || !text || !senderNumber) {
                await supabase.from("scheduled_messages").update({
                    status: "failed",
                    error_message: "Missing essential data",
                    sent_at: new Date().toISOString()
                }).eq("id", msg.id);
                continue;
            }

            // --- Dynamic Placeholder Replacement ---
            const optList = (resData.selected_options || []).join(", ");
            const replacements: Record<string, string> = {
                // New System Placeholders
                "#{예약자명}": resData.guest_name || "",
                "#{숙소명}": resData.room?.name || "",
                "#{입실일}": resData.check_in || "",
                "#{퇴실일}": resData.check_out || "",
                "#{선택옵션}": optList.length > 0 ? optList : "없음",
                // Legacy Chowon Placeholders
                "{name}": resData.guest_name || "손님",
                "{accommodation}": resData.room?.name || "",
                "{checkin}": resData.check_in || "",
                "{checkout}": resData.check_out || "",
            };

            Object.entries(replacements).forEach(([key, val]) => {
                text = text.split(key).join(val);
            });

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

            let allOk = true;
            const errors = [];

            for (const phone of recipients) {
                const solapiResponse = await sendSolapiMessage(phone, senderNumber, text, title, tplData?.image_url);
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

                if (adminPhone) {
                    await sendSolapiMessage(
                        adminPhone,
                        senderNumber,
                        `[알림] 발송 실패\n예약자: ${resData.guest_name}\n오류내용은 로그를 확인해주세요.`,
                        "발송실패"
                    );
                }
                results.push({ id: msg.id, status: "failed", errors });
            }
        }

        return NextResponse.json({ processed: pendingMessages.length, results, checked_at: now, checked_at_kst: nowKst });

    } catch (error: any) {
        console.error("Cron exception:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
