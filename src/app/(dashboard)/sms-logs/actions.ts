
"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function fetchSmsLogsAction() {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "로그인이 필요합니다." };

    const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!business) return { error: "업체 정보를 찾을 수 없습니다." };

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
            template:message_templates ( title, trigger_type )
        `)
        .eq("reservation.business_id", business.id)
        .order("scheduled_at", { ascending: false })
        .limit(100);

    if (error) {
        return { error: error.message };
    }

    return { data };
}
