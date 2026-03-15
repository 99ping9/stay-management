"use server";

import { createClient } from "@/lib/supabase/server";

export async function changePasswordAction(formData: {
    currentPassword: string;
    newPassword: string;
}) {
    const supabase = await createClient();

    // 1. Double check the user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return { error: "로그인이 필요합니다." };

    // 2. To verify the "current password", we attempt to sign in again
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.currentPassword,
    });

    if (signInError) {
        return { error: "현재 비밀번호가 일치하지 않습니다." };
    }

    // 3. Update the password
    const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
    });

    if (updateError) {
        return { error: "비밀번호 변경 중 오류가 발생했습니다: " + updateError.message };
    }

    return { success: true };
}
