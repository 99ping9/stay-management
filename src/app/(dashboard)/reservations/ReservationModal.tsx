"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, MessageSquare, X } from "lucide-react";
import { sendManualSmsAction } from "./actions";
import { useToast } from "@/components/ToastProvider";

export default function ReservationModal({
    reservation,
    onClose,
    onUpdate,
}: {
    reservation: any;
    onClose: () => void;
    onUpdate: () => void;
}) {
    const { showToast } = useToast();
    const supabase = createClient();
    const [formData, setFormData] = useState({
        guest_name: reservation.guest_name || "",
        phone: reservation.phone || "",
        check_in: reservation.check_in || "",
        check_out: reservation.check_out || "",
        memo: reservation.memo || "",
        selected_options: reservation.selected_options || [],
    });
    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState("");

    useEffect(() => {
        const fetchTemplates = async () => {
            if (!reservation.room_id) {
                setIsLoadingTemplates(false);
                return;
            }
            const { data } = await supabase
                .from("message_templates")
                .select("id, title, trigger_type, send_time")
                .eq("room_id", reservation.room_id);

            if (data) {
                const priority: Record<string, number> = { "checkin": 1, "staying": 2, "checkout": 3 };
                const sorted = [...data].sort((a, b) => {
                    const pA = priority[a.trigger_type] || 99;
                    const pB = priority[b.trigger_type] || 99;
                    if (pA !== pB) return pA - pB;
                    return (a.send_time || "").localeCompare(b.send_time || "");
                });
                setTemplates(sorted);
            }
            setIsLoadingTemplates(false);
        };
        fetchTemplates();
    }, [reservation.room_id, supabase]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const { error } = await supabase
            .from("reservations")
            .update({
                ...formData,
                phone: formData.phone.replace(/[^0-9]/g, "")
            })
            .eq("id", reservation.id);
        setIsSaving(false);

        if (error) {
            showToast("수정 실패: " + error.message, "error");
        } else {
            showToast("예약이 수정되었습니다.", "success");
            onUpdate();
            onClose();
        }
    };

    const handleDelete = async () => {
        if (!confirm("정말 이 예약을 삭제하시겠습니까? 관련 알림 발송도 모두 취소됩니다.")) return;
        setIsDeleting(true);
        const { error } = await supabase.from("reservations").delete().eq("id", reservation.id);
        setIsDeleting(false);

        if (error) {
            showToast("삭제 실패: " + error.message, "error");
        } else {
            showToast("삭제되었습니다.", "success");
            onUpdate();
            onClose();
        }
    };

    const handleManualSms = async () => {
        if (!selectedTemplate) {
            showToast("발송할 템플릿(종류)을 선택해주세요.", "info");
            return;
        }
        if (!confirm("정말로 문자를 즉시 발송하시겠습니까?")) return;

        setIsSending(true);
        const res = await sendManualSmsAction(reservation.id, selectedTemplate);
        setIsSending(false);

        if (res.error) {
            showToast("발송 실패: " + res.error, "error");
        } else {
            showToast("문자가 성공적으로 발송되었습니다.", "success");
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-gray-100 relative">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <h3 className="text-2xl font-bold text-gray-900 mb-6">예약 상세 정보</h3>
                <p className="text-sm text-indigo-600 font-semibold mb-6">
                    숙소: {reservation.room?.name || reservation.room_name}
                </p>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">예약자 이름</label>
                            <input
                                type="text"
                                name="guest_name"
                                value={formData.guest_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 border-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">전화번호</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 border-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">입실일</label>
                            <input
                                type="date"
                                name="check_in"
                                value={formData.check_in}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 border-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">퇴실일</label>
                            <input
                                type="date"
                                name="check_out"
                                value={formData.check_out}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 border-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">메모</label>
                        <textarea
                            name="memo"
                            rows={3}
                            value={formData.memo}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 border-none transition-all resize-none"
                        />
                    </div>

                    {/* Options Toggle Section in Modal */}
                    {(() => {
                        const roomOptions = reservation.room?.options || [];
                        if (roomOptions.length === 0) return null;

                        return (
                            <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                <label className="block text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3">선택 옵션 관리</label>
                                <div className="flex flex-wrap gap-2">
                                    {roomOptions.map((opt: string) => {
                                        const isSelected = formData.selected_options.includes(opt);
                                        return (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => {
                                                    const newOpts = isSelected
                                                        ? formData.selected_options.filter((o: string) => o !== opt)
                                                        : [...formData.selected_options, opt];
                                                    setFormData({ ...formData, selected_options: newOpts });
                                                }}
                                                className={`
                                                    px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                                                    ${isSelected
                                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                                        : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                                                    }
                                                `}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    <div className="pt-6 mt-6 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-pink-500" />
                            문자 수동 즉시 발송
                        </h4>
                        <div className="flex gap-2">
                            <select
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-pink-500 border-none transition-all"
                            >
                                <option value="">템플릿 선택...</option>
                                {isLoadingTemplates ? (
                                    <option value="" disabled>불러오는 중...</option>
                                ) : templates.length > 0 ? (
                                    templates.map(t => (
                                        <option key={t.id} value={t.id.toString()}>
                                            [{t.trigger_type === 'checkin' ? '입실' : t.trigger_type === 'checkout' ? '퇴실' : '연박'}] {t.title}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>등록된 템플릿 없음</option>
                                )}
                            </select>
                            <button
                                type="button"
                                onClick={handleManualSms}
                                disabled={isSending}
                                className="px-6 border border-transparent text-sm font-bold rounded-xl text-white bg-pink-600 hover:bg-pink-700 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
                            >
                                {isSending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "전송"}
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            수동 발송 시 스케줄러와 무관하게 즉시 메시지가 전송됩니다.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 mt-2">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-6 py-3 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center min-w-[100px]"
                        >
                            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "삭제"}
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center min-w-[124px]"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "수정 저장"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
