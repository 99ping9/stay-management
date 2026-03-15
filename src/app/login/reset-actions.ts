"use server";

import { createClient } from "@/lib/supabase/server";

export async function resetPasswordAction(email: string) {
    if (!email) return { error: "이메일을 입력해주세요." };

    const supabase = await createClient();
    
    // Get headers to determine the current domain
    const { headers } = await import('next/headers');
    const headerList = await headers();
    const host = headerList.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/login/callback?next=/profile/reset-password`,
    });

    if (error) {
        return { error: "비밀번호 재설정 이메일 발송 중 오류가 발생했습니다: " + error.message };
    }

    return { success: true };
}
