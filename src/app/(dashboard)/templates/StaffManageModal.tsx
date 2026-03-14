"use client";

import { useState, useEffect } from "react";
import { Loader2, X, Plus, Trash2, Save, Users } from "lucide-react";
import { saveRoomStaffAction } from "./actions";
import { useToast } from "@/components/ToastProvider";

export default function StaffManageModal({
    isOpen,
    onClose,
    room,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    room: any;
    onSuccess: () => void;
}) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [staffMembers, setStaffMembers] = useState<{ name: string; phone: string }[]>([]);

    useEffect(() => {
        if (room) {
            setStaffMembers(room.staff_members || []);
        }
    }, [room]);

    const handleSave = async () => {
        const filteredStaff = staffMembers
            .filter(s => s.name.trim() !== "" && s.phone.trim() !== "")
            .map(s => ({ ...s, phone: s.phone.replace(/[^0-9]/g, "") }));
        setLoading(true);
        const res = await saveRoomStaffAction(room.id, filteredStaff);
        setLoading(false);

        if (res.error) {
            showToast("저장 실패: " + res.error, "error");
        } else {
            showToast("저장되었습니다.", "success");
            onSuccess();
            onClose();
        }
    };

    if (!isOpen || !room) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">청소 이모님 관리</h2>
                            <p className="text-xs text-emerald-600 font-bold mt-0.5">{room.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 mb-2">
                            이 숙소의 알림을 수신할 청소 이모님들의 성합과 연락처를 등록하세요.
                        </p>

                        {staffMembers.map((staff, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 group relative">
                                <input
                                    type="text"
                                    value={staff.name}
                                    onChange={(e) => {
                                        const newStaff = [...staffMembers];
                                        newStaff[idx].name = e.target.value;
                                        setStaffMembers(newStaff);
                                    }}
                                    className="w-1/3 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="성함"
                                />
                                <input
                                    type="text"
                                    value={staff.phone}
                                    onChange={(e) => {
                                        const newStaff = [...staffMembers];
                                        newStaff[idx].phone = e.target.value;
                                        setStaffMembers(newStaff);
                                    }}
                                    className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="010-0000-0000"
                                />
                                <button
                                    onClick={() => setStaffMembers(staffMembers.filter((_, i) => i !== idx))}
                                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => setStaffMembers([...staffMembers, { name: "", phone: "" }])}
                            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-emerald-500 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all text-sm font-bold flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> 이모님 추가하기
                        </button>
                    </div>
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
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center min-w-[120px] justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> 저장하기</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
