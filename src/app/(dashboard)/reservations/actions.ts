
"use server";

import crypto from "crypto";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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

export async function fetchReservationDataAction() {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "로그인이 필요합니다." };

    const { data: business } = await adminSupabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!business) return { error: "업체 정보를 찾을 수 없습니다." };

    // 숙소 목록과 예약 목록을 병렬로 동시에 호출하여 속도 개선
    const [roomsRes, reservationsRes] = await Promise.all([
        adminSupabase
            .from("rooms")
            .select("*")
            .eq("business_id", business.id)
            .order("name"),
        adminSupabase
            .from("reservations")
            .select(`
                *,
                room:rooms(name, color, options)
            `)
            .eq("business_id", business.id)
            .order("check_in", { ascending: false })
            .limit(500) // 너무 많은 데이터를 한꺼번에 불러오는 것 방지
    ]);

    if (roomsRes.error) console.error("Rooms fetch error:", roomsRes.error);
    if (reservationsRes.error) console.error("Reservations fetch error:", reservationsRes.error);

    return { 
        rooms: roomsRes.data || [], 
        reservations: reservationsRes.data || [],
        businessId: business.id
    };
}

export async function sendManualSmsAction(reservationId: number, templateId: string) {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "로그인이 필요합니다." };

    const { data: reservation, error: resError } = await adminSupabase
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

    const { data: template, error: tplError } = await adminSupabase
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

    const resData = reservation as any;
    let text = template.content || "";
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

    const results = [];
    for (const phone of recipients) {
        const solapiRes = await sendSolapiMessage(phone, senderNumber, text, template.title, template.image_url);
        results.push({ phone, ok: solapiRes.ok, result: solapiRes.result });
    }

    const allOk = results.every(r => r.ok);
    if (!allOk) {
        return { error: "일부 문자 발송에 실패했습니다.", details: results };
    }

    return { success: true };
}

export async function createReservationAction(formData: {
    room_id: string;
    guest_name: string;
    phone: string;
    check_in: string;
    check_out: string;
    memo: string;
    selected_options: string[];
}) {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "로그인이 필요합니다." };

    const { data: business } = await adminSupabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!business) return { error: "업체 정보를 찾을 수 없습니다." };

    // 1. Check for Duplicate/Overlapping Reservations
    const { data: overlapping } = await adminSupabase
        .from("reservations")
        .select("id")
        .eq("room_id", parseInt(formData.room_id))
        .lt("check_in", formData.check_out) // Existing check-in is before requested check-out
        .gt("check_out", formData.check_in) // Existing check-out is after requested check-in
        .maybeSingle();

    if (overlapping) {
        return { error: "해당 기간에 이미 예약이 존재합니다. 날짜를 확인해주세요." };
    }

    // 2. Create Reservation
    const { data: reservation, error: resError } = await adminSupabase
        .from("reservations")
        .insert({
            business_id: business.id,
            room_id: parseInt(formData.room_id),
            guest_name: formData.guest_name,
            phone: formData.phone.replace(/[^0-9]/g, ""),
            check_in: formData.check_in,
            check_out: formData.check_out,
            memo: formData.memo,
            selected_options: formData.selected_options,
        })
        .select()
        .single();

    if (resError || !reservation) {
        return { error: "예약 등록 실패: " + (resError?.message || "알 수 없는 오류") };
    }

    // 3. Fetch Active Templates for this room
    const { data: templates } = await adminSupabase
        .from("message_templates")
        .select("*")
        .eq("room_id", reservation.room_id)
        .eq("is_active", true);

    if (templates && templates.length > 0) {
        const messagesToSchedule: any[] = [];
        const now = new Date();
        const checkIn = new Date(reservation.check_in);
        const checkOut = new Date(reservation.check_out);

        templates.forEach(tpl => {
            if (tpl.trigger_type === 'checkin') {
                // Schedule for check-in day
                const scheduledAtDate = new Date(`${reservation.check_in}T${tpl.send_time}+09:00`);
                if (scheduledAtDate > now) {
                    messagesToSchedule.push({
                        reservation_id: reservation.id,
                        template_id: tpl.id,
                        scheduled_at: scheduledAtDate.toISOString(),
                        status: 'pending'
                    });
                }
            } else if (tpl.trigger_type === 'checkout') {
                // Schedule for check-out day
                const scheduledAtDate = new Date(`${reservation.check_out}T${tpl.send_time}+09:00`);
                if (scheduledAtDate > now) {
                    messagesToSchedule.push({
                        reservation_id: reservation.id,
                        template_id: tpl.id,
                        scheduled_at: scheduledAtDate.toISOString(),
                        status: 'pending'
                    });
                }
            } else if (tpl.trigger_type === 'multinight') {
                // Schedule for every day between check-in and check-out (exclusive)
                let current = new Date(checkIn);
                current.setDate(current.getDate() + 1);
                
                while (current < checkOut) {
                    const dateStr = current.toISOString().split('T')[0];
                    const scheduledAtDate = new Date(`${dateStr}T${tpl.send_time}+09:00`);
                    if (scheduledAtDate > now) {
                        messagesToSchedule.push({
                            reservation_id: reservation.id,
                            template_id: tpl.id,
                            scheduled_at: scheduledAtDate.toISOString(),
                            status: 'pending'
                        });
                    }
                    current.setDate(current.getDate() + 1);
                }
            }
        });

        if (messagesToSchedule.length > 0) {
            const { error: scheduleError } = await adminSupabase.from("scheduled_messages").insert(messagesToSchedule);
            if (scheduleError) {
                console.error("Scheduling error:", scheduleError);
            }
        }
    }

    return { success: true };
}
