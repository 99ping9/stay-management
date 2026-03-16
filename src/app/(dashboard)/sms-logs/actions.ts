
"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function fetchSmsLogsAction() {
    console.time("Performance: fetchSmsLogs");
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    console.time("1. auth.getUser");
    const { data: { user } } = await supabase.auth.getUser();
    console.timeEnd("1. auth.getUser");

    if (!user) return { error: "로그인이 필요합니다." };

    console.time("2. fetch business");
    const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .single();
    console.timeEnd("2. fetch business");

    if (!business) return { error: "업체 정보를 찾을 수 없습니다." };

    console.time("3. fetch scheduled_messages (Heavy Join)");
    // Use adminSupabase to bypass RLS on scheduled_messages
    const { data, error } = await adminSupabase
        .from("scheduled_messages")
        .select(`
            id,
            status,
            scheduled_at,
            sent_at,
            error_message,
            reservation:reservations!inner ( guest_name, phone, business_id, room:rooms(name) ),
            template:message_templates ( title, trigger_type, recipient_type )
        `)
        .eq("reservation.business_id", business.id)
        .order("scheduled_at", { ascending: false })
        .limit(100);
    console.timeEnd("3. fetch scheduled_messages (Heavy Join)");

    if (error) {
        console.timeEnd("Performance: fetchSmsLogs");
        return { error: error.message };
    }

    console.timeEnd("Performance: fetchSmsLogs");
    return { data };
}
