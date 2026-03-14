"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "이메일과 비밀번호를 입력해주세요." };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        let errorMessage = "로그인에 실패했습니다.";
        if (error.message === "Invalid login credentials") {
            errorMessage = "이메일 또는 비밀번호가 틀렸습니다.";
        } else if (error.message.includes("API key")) {
            errorMessage = "시스템 설정 오류가 발생했습니다. (API Key 확인 필요)";
        } else {
            errorMessage = `로그인 실패: ${error.message}`;
        }
        return { error: errorMessage };
    }

    redirect("/");
}
