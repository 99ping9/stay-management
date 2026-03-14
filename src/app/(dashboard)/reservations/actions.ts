"use server";

import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

function getSolapiAuthHeader(apiKey: string, apiSecret: string) {
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(16).toString("hex");
    const signature = crypto.createHmac("sha256", apiSecret).update(date + salt).digest("hex");
    return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

async function sendSolapiMessage(to: string, from: string, text: string, subjectTitle: string) {
    const apiKey = process.env.SOLAPI_API_KEY!;
    const apiSecret = process.env.SOLAPI_API_SECRET!;
    const authHeader = getSolapiAuthHeader(apiKey, apiSecret);

    const messagePayload = {
        message: {
            to: to.replace(/[^0-9]/g, ""),
            from: from.replace(/[^0-9]/g, ""),
            text,
            subject: subjectTitle,
            type: "SMS",
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

export async function sendManualSmsAction(reservationId: number, templateId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "로그인이 필요합니다." };
    }

    // Fetch reservation with room and business info
    const { data: reservation, error: resError } = await supabase
        .from("reservations")
        .select(`
            *,
            room:rooms (
                name,
                staff_members
            ),
            business:businesses (*)
        `)
        .eq("id", reservationId)
        .single();

    if (resError || !reservation) {
        return { error: "예약 정보를 찾을 수 없습니다." };
    }

    // Fetch the template
    const { data: template, error: tplError } = await supabase
        .from("message_templates")
        .select("*")
        .eq("id", parseInt(templateId))
        .single();

    if (tplError || !template) {
        return { error: "템플릿 정보를 찾을 수 없습니다." };
    }

    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;
    const senderNumber = process.env.SOLAPI_SENDER_NUMBER;

    if (!apiKey || !apiSecret || !senderNumber) {
        return { error: "솔라피 설정이 서버에 구성되지 않았습니다." };
    }

    // --- Dynamic Placeholder Replacement ---
    const resData = reservation as any;
    let text = template.content || "";
    const optList = (resData.selected_options || []).join(", ");
    const replacements: Record<string, string> = {
        "#{예약자명}": resData.guest_name || "",
        "#{숙소명}": resData.room?.name || "",
        "#{입실일}": resData.check_in || "",
        "#{퇴실일}": resData.check_out || "",
        "#{선택옵션}": optList.length > 0 ? optList : "없음",
    };

    Object.entries(replacements).forEach(([key, val]) => {
        text = text.split(key).join(val);
    });
    // ----------------------------------------

    // Determine recipients
    let recipients: string[] = [];
    if (template.recipient_type === 'staff') {
        const staff = resData.room?.staff_members || [];
        recipients = staff.map((s: any) => s.phone).filter(Boolean);
    } else {
        recipients = [resData.phone].filter(Boolean);
    }

    if (recipients.length === 0) {
        return { error: "수신자 전화번호가 없습니다." };
    }

    // Send to all recipients
    const results = [];
    for (const phone of recipients) {
        const solapiRes = await sendSolapiMessage(phone, senderNumber, text, template.title);
        results.push({ phone, ok: solapiRes.ok, result: solapiRes.result });
    }

    const allOk = results.every(r => r.ok);
    if (!allOk) {
        return { error: "일부 문자 발송에 실패했습니다.", details: results };
    }

    return { success: true };
}
