"use server";

import { createClient } from "@/lib/supabase/server";
import sharp from "sharp";

export async function saveTemplateAction(formData: FormData) {
    const supabase = await createClient();

    const id = formData.get("id") as string | null;
    const room_id = formData.get("room_id") as string;
    const trigger_type = formData.get("trigger_type") as string;
    const send_time = formData.get("send_time") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const image = formData.get("image") as File | null;
    let imageUrl = formData.get("existing_image_url") as string | null;
    const is_active = formData.get("is_active") === "true";
    const recipient_type = (formData.get("recipient_type") as string) || "guest";

    // Validate
    if (!room_id || !trigger_type || !send_time || !title || !content) {
        return { error: "필수 항목을 모두 입력해주세요." };
    }

    // Handle Image Upload if new image provided
    if (image && image.size > 0) {
        if (image.size > 1 * 1024 * 1024) {
            return { error: "이미지 크기는 1MB를 초과할 수 없습니다." };
        }
        try {
            // Convert browser File to Buffer
            const arrayBuffer = await image.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Resize logic: max 1000px width/height, optimization via quality compress
            const optimizedBuffer = await sharp(buffer)
                .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
                .jpeg({ quality: 85, mozjpeg: true })
                .toBuffer();

            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const filePath = `templates/${room_id}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("mms_images")
                .upload(filePath, optimizedBuffer, {
                    contentType: "image/jpeg",
                    upsert: true,
                });

            if (uploadError) {
                return { error: "이미지 업로드 실패: " + uploadError.message };
            }

            // Get Public URL
            const { data: publicUrlData } = supabase.storage
                .from("mms_images")
                .getPublicUrl(filePath);

            imageUrl = publicUrlData.publicUrl;
        } catch (err: any) {
            return { error: "이미지 처리 중 오류가 발생했습니다: " + err.message };
        }
    }

    const payload = {
        room_id: parseInt(room_id),
        trigger_type,
        recipient_type,
        send_time,
        title,
        content,
        image_url: imageUrl,
        is_active,
    };

    if (id) {
        // Update
        const { error: updateError } = await supabase
            .from("message_templates")
            .update(payload)
            .eq("id", parseInt(id));

        if (updateError) return { error: "수정 실패: " + updateError.message };
    } else {
        // Insert
        const { error: insertError } = await supabase
            .from("message_templates")
            .insert(payload);

        if (insertError) {
            // Handles the compound unique constraint gracefully
            if (insertError.code === "23505") { // PostgreSQL unique violation code
                return { error: "해당 기준일과 시간에 이미 템플릿이 존재합니다. 발송시간을 변경하거나 기존 템플릿을 수정해주세요." };
            }
            return { error: "등록 실패: " + insertError.message };
        }
    }

    return { success: true };
}

export async function toggleTemplateActiveAction(id: number, isActive: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("message_templates")
        .update({ is_active: isActive })
        .eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
}

export async function saveRoomStaffAction(roomId: number, staffMembers: any[]) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("rooms")
        .update({ staff_members: staffMembers })
        .eq("id", roomId);

    if (error) return { error: error.message };
    return { success: true };
}
