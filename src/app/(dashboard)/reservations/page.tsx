"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Loader2, Calendar as CalendarIcon, ClipboardList, CheckCircle2, Clock, X, MessageSquare, Trash2, Edit2, ChevronDown } from "lucide-react";
import CalendarView from "./CalendarView";
import ReservationModal from "./ReservationModal";
import { useToast } from "@/components/ToastProvider";
import { createReservationAction, fetchReservationDataAction } from "./actions";

export default function ReservationsPage() {
    const { showToast } = useToast();
    const supabase = createClient();
    const [rooms, setRooms] = useState<any[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter State
    const [selectedRoomFilters, setSelectedRoomFilters] = useState<string[]>([]);
    const [selectedRes, setSelectedRes] = useState<any | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State for "New Reservation" modal-like view
    const [formData, setFormData] = useState({
        room_id: "",
        guest_name: "",
        phone: "",
        check_in: "",
        check_out: "",
        memo: "",
        selected_options: [] as string[],
    });

    const fetchData = async () => {
        setLoading(true);
        const res = await fetchReservationDataAction();
        
        if (res.error) {
            console.error(res.error);
        } else {
            setRooms(res.rooms || []);
            setReservations(res.reservations || []);

            if (res.rooms && res.rooms.length > 0) {
                if (!formData.room_id) {
                    setFormData(prev => ({ ...prev, room_id: res.rooms[0].id.toString() }));
                }
                if (selectedRoomFilters.length === 0) {
                    setSelectedRoomFilters(res.rooms.map(r => r.id.toString()));
                }
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateReservation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!formData.room_id || !formData.check_in || !formData.check_out || !formData.phone) {
            showToast("필수 항목을 모두 입력해주세요.", "info");
            setIsSubmitting(false);
            return;
        }

        const res = await createReservationAction(formData);
        setIsSubmitting(false);

        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("예약이 등록되었습니다.", "success");
            setFormData(prev => ({ ...prev, guest_name: "", phone: "", check_in: "", check_out: "", memo: "", selected_options: [] }));
            setShowAddModal(false);
            fetchData();
        }
    };

    return (
        <div className="space-y-8 fade-in pb-20">
            {/* 1. Header & Room Legends (Matching Image 1) */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">예약 캘린더</h1>
                </div>

                <div className="flex flex-wrap gap-2">
                    {rooms.map(room => {
                        const isSelected = selectedRoomFilters.includes(room.id.toString());
                        return (
                            <button
                                key={room.id}
                                onClick={() => {
                                    if (isSelected) {
                                        setSelectedRoomFilters(selectedRoomFilters.filter(id => id !== room.id.toString()));
                                    } else {
                                        setSelectedRoomFilters([...selectedRoomFilters, room.id.toString()]);
                                    }
                                }}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm border
                                    ${isSelected 
                                        ? "bg-white border-blue-100 ring-2 ring-blue-500/10" 
                                        : "bg-gray-50 border-gray-100 text-gray-400 opacity-60"}
                                `}
                            >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: room.color || '#3b82f6' }}></span>
                                <span className={isSelected ? "text-blue-700" : "text-gray-500"}>{room.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Calendar Card (Matching Image 1) */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-gray-100/50 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500/20 via-blue-500 to-blue-500/20"></div>
                {loading ? (
                    <div className="h-[500px] flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <CalendarView
                        reservations={reservations.filter(r => selectedRoomFilters.includes(r.room_id.toString()))}
                        onEventClick={setSelectedRes}
                    />
                )}
            </div>

            {/* 3. Summary Section Header (Matching Image 1) */}
            <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl shadow-sm">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">최근 예약 현황</h2>
                </div>
                
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    새 예약
                </button>
            </div>

            {/* 4. Table Card (Matching Image 1) */}
            <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-gray-100/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">예약자</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">숙소</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">체크인</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">체크아웃</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">상태</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {reservations.slice(0, 10).map((res) => (
                                <tr key={res.id} onClick={() => setSelectedRes(res)} className="group hover:bg-blue-50/30 transition-colors cursor-pointer">
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-black text-slate-900">{res.guest_name}</div>
                                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">{res.phone}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: res.room?.color || '#3b82f6' }}></div>
                                            <span className="text-sm font-bold text-slate-700">{res.room?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-bold text-slate-600">{res.check_in}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-bold text-slate-600">{res.check_out}</div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-black">
                                            예약확정
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {reservations.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-medium">
                                        등록된 예약 정보가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Adding Reservation */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 sm:p-10">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">새 예약 등록</h2>
                                    <p className="text-sm text-gray-400 mt-1 font-medium italic">New Reservation Details</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateReservation} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest pl-1">성명</label>
                                        <input
                                            type="text"
                                            name="guest_name"
                                            value={formData.guest_name}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-900"
                                            placeholder="홍길동"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest pl-1">
                                            연락처 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-900"
                                            placeholder="010-0000-0000"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest pl-1">
                                        숙소 배정 <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <select
                                            name="room_id"
                                            value={formData.room_id}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-900 appearance-none pr-12 cursor-pointer"
                                            required
                                        >
                                            {rooms.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </div>

                                {/* Dynamic Options Section */}
                                {(() => {
                                    const selectedRoom = rooms.find(r => r.id.toString() === formData.room_id);
                                    if (!selectedRoom || !selectedRoom.options || selectedRoom.options.length === 0) return null;

                                    return (
                                        <div className="space-y-3 pt-2">
                                            <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest pl-1">추가 옵션</label>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedRoom.options.map((opt: string) => {
                                                    const isSelected = formData.selected_options.includes(opt);
                                                    return (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => {
                                                                const newOpts = isSelected
                                                                    ? formData.selected_options.filter(o => o !== opt)
                                                                    : [...formData.selected_options, opt];
                                                                setFormData({ ...formData, selected_options: newOpts });
                                                            }}
                                                            className={`
                                                                px-4 py-2 rounded-xl text-xs font-bold transition-all border
                                                                ${isSelected
                                                                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                                                                    : "bg-gray-50 border-transparent text-gray-500 hover:bg-white hover:border-gray-200"
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

                                <div className="grid grid-cols-2 gap-6 pt-2">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                            체크인 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="check_in"
                                            value={formData.check_in}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 transition-all font-black cursor-pointer"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                            체크아웃 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="check_out"
                                            value={formData.check_out}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 transition-all font-black cursor-pointer"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">메모</label>
                                    <textarea
                                        name="memo"
                                        value={formData.memo}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-600 resize-none"
                                        placeholder="공유할 내용을 입력하세요."
                                    />
                                </div>

                                <div className="pt-8">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "등록 완료"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedRes && (
                <ReservationModal
                    reservation={selectedRes}
                    onClose={() => setSelectedRes(null)}
                    onUpdate={fetchData}
                />
            )}
        </div>
    );
}
