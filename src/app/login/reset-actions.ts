"use server";

import { createClient } from "@/lib/supabase/server";

export async function resetPasswordAction(email: string) {
    if (!email) return { error: "이메일을 입력해주세요." };

    const supabase = await createClient();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login/callback?next=/profile/reset-password`,
    });

    if (error) {
        return { error: "비밀번호 재설정 이메일 발송 중 오류가 발생했습니다: " + error.message };
    }

    return { success: true };
}
