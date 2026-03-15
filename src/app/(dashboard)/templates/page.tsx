"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Edit2, Trash2, Users } from "lucide-react";
import TemplateModal from "./TemplateModal";
import StaffManageModal from "./StaffManageModal";
import { toggleTemplateActiveAction } from "./actions";
import { useToast } from "@/components/ToastProvider";

export default function TemplatesPage() {
    const { showToast } = useToast();
    const supabase = createClient();
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>("");
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const storedRoomId = localStorage.getItem("selectedRoomId");

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data: business } = await supabase
            .from("businesses")
            .select("id")
            .eq("user_id", userData.user.id)
            .single();

        if (!business) return;

        // Fetch rooms for tabs
        const { data: roomsData } = await supabase
            .from("rooms")
            .select("*")
            .eq("business_id", business.id)
            .order("name");

        if (roomsData) {
            setRooms(roomsData);
            const targetRoomId = storedRoomId || (roomsData.length > 0 ? roomsData[0].id.toString() : "");
            if (targetRoomId) {
                setSelectedRoomId(targetRoomId);
                fetchTemplates(targetRoomId);
            }
        }
    };

    const fetchTemplates = async (roomId: string) => {
        const { data: tpls } = await supabase
            .from("message_templates")
            .select("*")
            .eq("room_id", parseInt(roomId));

        if (tpls) {
            const priority: Record<string, number> = { "checkin": 1, "staying": 2, "checkout": 3 };
            const sorted = [...tpls].sort((a, b) => {
                const pA = priority[a.trigger_type] || 99;
                const pB = priority[b.trigger_type] || 99;
                if (pA !== pB) return pA - pB;
                return (a.send_time || "").localeCompare(b.send_time || "");
            });
            setTemplates(sorted);
        } else {
            setTemplates([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRoomTabClick = (roomId: string) => {
        setSelectedRoomId(roomId);
        localStorage.setItem("selectedRoomId", roomId);
        setLoading(true);
        fetchTemplates(roomId);
    };

    const handleToggleActive = async (id: number, currentActive: boolean) => {
        const { error } = await toggleTemplateActiveAction(id, !currentActive);
        if (error) {
            showToast("상태 변경 실패: " + error, "error");
        } else {
            showToast(`상태가 ${!currentActive ? '활성화' : '비활성화'} 되었습니다.`, "success");
            fetchTemplates(selectedRoomId);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("정말 이 템플릿을 삭제하시겠습니까?")) return;
        const { error } = await supabase.from("message_templates").delete().eq("id", id);
        if (!error) {
            showToast("삭제되었습니다.", "success");
            fetchTemplates(selectedRoomId);
        } else {
            showToast("삭제 실패: " + error.message, "error");
        }
    };

    const getTriggerLabel = (type: string) => {
        switch (type) {
            case "checkin": return <span className="text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold">입실일</span>;
            case "checkout": return <span className="text-rose-700 bg-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold">퇴실일</span>;
            case "staying": return <span className="text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg text-xs font-bold">연박일</span>;
            default: return type;
        }
    };

    const getRecipientLabel = (type: string) => {
        if (type === "staff") {
            return <span className="text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-100">청소이모</span>;
        }
        return <span className="text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100">예약자</span>;
    };

    return (
        <div className="space-y-8 fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">문자서비스 관리</h1>
                    <p className="mt-2 text-gray-500">
                        숙소별로 자동 발송될 메시지의 내용과 시간을 설정하세요.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                {rooms.map((r) => (
                    <button
                        key={r.id}
                        onClick={() => handleRoomTabClick(r.id.toString())}
                        className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 whitespace-nowrap shadow-sm ${selectedRoomId === r.id.toString()
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                            }`}
                    >
                        {r.name}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                <div className="p-6 sm:px-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">
                        자동 발송 템플릿
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (!selectedRoomId) return showToast("숙소를 먼저 선택해주세요.", "info");
                                setIsStaffModalOpen(true);
                            }}
                            className="flex items-center gap-2 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
                        >
                            <Users className="w-4 h-4" />
                            이모님 관리
                        </button>
                        <button
                            onClick={() => {
                                if (!selectedRoomId) return showToast("숙소를 먼저 선택해주세요.", "info");
                                setEditingTemplate(null);
                                setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all hover:shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            새 메시지 추가
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-24 flex justify-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">기준일</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">수신자</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">발송시간</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">제목 / 내용 요약</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">상태</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">관리</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {templates.map((tpl) => (
                                    <tr key={tpl.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getTriggerLabel(tpl.trigger_type)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRecipientLabel(tpl.recipient_type)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {tpl.send_time.slice(0, 5)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-sm truncate">
                                            <span className="font-bold text-gray-900 mr-2">{tpl.title}</span>
                                            {tpl.content}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => handleToggleActive(tpl.id, tpl.is_active)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tpl.is_active
                                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                    }`}
                                            >
                                                {tpl.is_active ? "활성화" : "비활성화"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingTemplate(tpl);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="text-blue-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded-md hover:bg-blue-100 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tpl.id)}
                                                    className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {templates.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            등록된 템플릿이 없습니다. 새 메시지를 추가해주세요.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <TemplateModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    roomId={selectedRoomId}
                    initialData={editingTemplate}
                    onSuccess={() => fetchTemplates(selectedRoomId)}
                />
            )}

            {isStaffModalOpen && (
                <StaffManageModal
                    isOpen={isStaffModalOpen}
                    onClose={() => setIsStaffModalOpen(false)}
                    room={rooms.find(r => r.id.toString() === selectedRoomId)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
}
