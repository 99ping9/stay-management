"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateBusiness(id: number, data: any) {
    const supabase = await createClient();

    // Validate admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.role !== 'admin') {
        return { error: "권한이 없습니다." };
    }

    const { error } = await supabase
        .from("businesses")
        .update({
            name: data.name,
            owner_name: data.owner_name,
            contact_phone: data.contact_phone,
            email: data.email,
        })
        .eq("id", id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/admin");
    return { success: true };
}
