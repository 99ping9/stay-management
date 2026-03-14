"use client";

import { useState } from "react";
import { Loader2, X, Image as ImageIcon, Clock, Check } from "lucide-react";
import { saveTemplateAction } from "./actions";
import { useToast } from "@/components/ToastProvider";

export default function TemplateModal({
    isOpen,
    onClose,
    roomId,
    initialData,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    roomId: string;
    initialData: any | null;
    onSuccess: () => void;
}) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);
    const [titleLength, setTitleLength] = useState(initialData?.title?.length || 0);
    const [sendTime, setSendTime] = useState(initialData?.send_time?.slice(0, 5) || "09:00");
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    const getAmPm = (time: string) => {
        const h = parseInt(time.split(":")[0]);
        return h >= 12 ? "PM" : "AM";
    };

    const getHour12 = (time: string) => {
        const h = parseInt(time.split(":")[0]);
        const h12 = h % 12;
        return h12 === 0 ? 12 : h12;
    };

    const getMinute = (time: string) => time.split(":")[1];

    const handleTimeChange = (part: "ampm" | "hour" | "min", val: string) => {
        const [hStr, mStr] = sendTime.split(":");
        let h = parseInt(hStr);
        let m = mStr;

        if (part === "ampm") {
            if (val === "AM" && h >= 12) h -= 12;
            if (val === "PM" && h < 12) h += 12;
        } else if (part === "hour") {
            const h12 = parseInt(val);
            const isPm = h >= 12;
            h = isPm ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
        } else {
            m = val;
        }

        setSendTime(`${h.toString().padStart(2, "0")}:${m}`);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        formData.append("room_id", roomId);
        if (initialData) {
            formData.append("id", initialData.id.toString());
            formData.append("existing_image_url", initialData.image_url || "");
        }

        const res = await saveTemplateAction(formData);

        if (res.error) {
            setError(res.error);
            setLoading(false);
        } else {
            showToast("저장되었습니다.", "success");
            onSuccess();
            onClose();
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Blurred overlay */}
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900">
                        {initialData ? "메시지 템플릿 수정" : "새 메시지 템플릿 추가"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                    <form id="templateForm" onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">기준일</label>
                                <select
                                    name="trigger_type"
                                    defaultValue={initialData?.trigger_type || "checkin"}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm transition-all"
                                >
                                    <option value="checkin">입실일</option>
                                    <option value="checkout">퇴실일</option>
                                    <option value="staying">연박일</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">수신 대상</label>
                                <select
                                    name="recipient_type"
                                    defaultValue={initialData?.recipient_type || "guest"}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm transition-all font-bold text-gray-700"
                                >
                                    <option value="guest">👤 예약자 (게스트)</option>
                                    <option value="staff">🧹 청소 이모님 (스태프)</option>
                                </select>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">발송 시간</label>
                                <button
                                    type="button"
                                    onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent hover:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-left text-sm transition-all flex items-center justify-between shadow-sm"
                                >
                                    <span className="font-medium text-gray-900">
                                        {getAmPm(sendTime) === "AM" ? "오전" : "오후"} {getHour12(sendTime)}시 {getMinute(sendTime)}분
                                    </span>
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                </button>
                                <input type="hidden" name="send_time" value={sendTime} />

                                {isTimePickerOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[55]" onClick={() => setIsTimePickerOpen(false)} />
                                        <div className="absolute left-0 top-full mt-2 z-[60] bg-white rounded-2xl shadow-2xl border border-gray-100 flex p-2 h-72 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {/* AM/PM */}
                                            <div className="flex flex-col overflow-y-auto custom-scrollbar-hide border-r border-gray-100 pr-1">
                                                {["AM", "PM"].map(v => (
                                                    <button
                                                        key={v}
                                                        type="button"
                                                        onClick={() => handleTimeChange("ampm", v)}
                                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors mb-1 ${getAmPm(sendTime) === v ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-indigo-50'}`}
                                                    >
                                                        {v === "AM" ? "오전" : "오후"}
                                                    </button>
                                                ))}
                                            </div>
                                            {/* Hour */}
                                            <div className="flex flex-col overflow-y-auto custom-scrollbar-hide border-r border-gray-100 px-1">
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                                    <button
                                                        key={h}
                                                        type="button"
                                                        onClick={() => handleTimeChange("hour", h.toString())}
                                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors mb-1 ${getHour12(sendTime) === h ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-indigo-50'}`}
                                                    >
                                                        {h}시
                                                    </button>
                                                ))}
                                            </div>
                                            {/* Minute */}
                                            <div className="flex flex-col overflow-y-auto custom-scrollbar-hide pl-1 min-w-[80px]">
                                                {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => handleTimeChange("min", m)}
                                                        className={`px-6 py-2 text-xs font-bold rounded-lg transition-colors mb-1 ${getMinute(sendTime) === m ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-indigo-50'}`}
                                                    >
                                                        {m}분
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">발송 상태</label>
                                <select
                                    name="is_active"
                                    defaultValue={initialData?.is_active?.toString() ?? "true"}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm transition-all"
                                >
                                    <option value="true">활성화 (자동 발송)</option>
                                    <option value="false">비활성화 (발송 안함)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">메시지 제목</label>
                            <input
                                type="text"
                                name="title"
                                defaultValue={initialData?.title || ""}
                                onChange={(e) => setTitleLength(e.target.value.length)}
                                placeholder="예: [숙소명] 입실 안내"
                                maxLength={15}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm transition-all"
                            />
                            <p className={`mt-1 text-xs text-right font-medium transition-colors ${titleLength >= 15 ? 'text-red-500' : 'text-gray-400'
                                }`}>
                                {titleLength} / 15자 이내
                            </p>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-semibold text-gray-700">메시지 내용</label>
                                <div className="flex flex-wrap gap-1.5 justify-end">
                                    {[
                                        { label: "예약자명", code: "#{예약자명}" },
                                        { label: "숙소명", code: "#{숙소명}" },
                                        { label: "입실일", code: "#{입실일}" },
                                        { label: "퇴실일", code: "#{퇴실일}" },
                                        { label: "선택옵션", code: "#{선택옵션}", primary: true },
                                    ].map(tag => (
                                        <button
                                            key={tag.code}
                                            type="button"
                                            onClick={() => {
                                                const textarea = document.getElementById("tplContent") as HTMLTextAreaElement;
                                                if (!textarea) return;
                                                const start = textarea.selectionStart;
                                                const end = textarea.selectionEnd;
                                                const text = textarea.value;
                                                const before = text.substring(0, start);
                                                const after = text.substring(end);
                                                textarea.value = before + tag.code + after;
                                                textarea.focus();
                                                textarea.selectionStart = textarea.selectionEnd = start + tag.code.length;
                                            }}
                                            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${tag.primary
                                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                                }`}
                                        >
                                            {tag.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                id="tplContent"
                                name="content"
                                defaultValue={initialData?.content || ""}
                                required
                                rows={6}
                                placeholder="예: 안녕하세요 #{예약자명}님, #{숙소명}입니다. 선택하신 옵션(#{선택옵션}) 확인해주세요."
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">첨부 이미지 (선택, MMS)</label>
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        name="image"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all border border-gray-200 rounded-xl"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        이미지 업로드 시 자동으로 최적화(리사이징)되어 저장됩니다. (1MB 이하 권장)
                                    </p>
                                </div>
                                {imagePreview ? (
                                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-lg bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                                        <ImageIcon className="w-6 h-6 text-gray-300" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        form="templateForm"
                        disabled={loading}
                        className="px-8 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center min-w-[120px] justify-center"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "저장"}
                    </button>
                </div>
            </div>
        </div>
    );
}
