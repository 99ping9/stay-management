"use server";

import { createClient } from "@/lib/supabase/server";

export async function resetPasswordAction(email: string) {
    if (!email) return { error: "이메일을 입력해주세요." };

    const supabase = await createClient();

    // NEXT_PUBLIC_APP_URL 환경변수에 실서버 URL을 설정해야 함
    // 예: https://staymanagement.biz-potential-consulting.com
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/login/callback?next=/profile/reset-password`,
    });

    if (error) {
        return { error: "비밀번호 재설정 이메일 발송 중 오류가 발생했습니다: " + error.message };
    }

    return { success: true };
}
