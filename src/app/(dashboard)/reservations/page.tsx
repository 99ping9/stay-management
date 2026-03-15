"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CalendarPlus, Loader2 } from "lucide-react";
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
    const [businessId, setBusinessId] = useState<number>(0);

    // Filter State
    const [selectedRoomFilters, setSelectedRoomFilters] = useState<string[]>([]);

    // Modal State
    const [selectedRes, setSelectedRes] = useState<any | null>(null);

    // Form State
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
            setBusinessId(res.businessId || 0);

            const roomId = localStorage.getItem("selectedRoomId");
            if (res.rooms && res.rooms.length > 0) {
                if (roomId && !formData.room_id) {
                    setFormData(prev => ({ ...prev, room_id: roomId }));
                } else if (!formData.room_id) {
                    setFormData(prev => ({ ...prev, room_id: res.rooms[0].id.toString() }));
                }
                setSelectedRoomFilters(res.rooms.map(r => r.id.toString()));
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
        if (!formData.room_id || !formData.check_in || !formData.check_out || !formData.phone) {
            showToast("필수 항목을 모두 입력해주세요.", "info");
            return;
        }

        const res = await createReservationAction(formData);
 
        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("예약이 등록되었습니다.", "success");
            // Reset form (keep room_id)
            setFormData(prev => ({ ...prev, guest_name: "", phone: "", check_in: "", check_out: "", memo: "", selected_options: [] }));
            fetchData(); // Refresh calendar
        }
    };

    return (
        <div className="space-y-8 fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">예약 현황</h1>
                    <p className="mt-2 text-gray-500">
                        오늘의 입실 고객과 전체 스케줄을 한눈에 확인하세요.
                    </p>
                </div>
            </div>

            {/* Reservation Form */}
            <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
                <div className="px-6 py-6 sm:p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="text-blue-600 mr-2">
                            <CalendarPlus className="w-6 h-6" />
                        </span>
                        새 예약 등록
                    </h3>

                    <form onSubmit={handleCreateReservation}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">예약자 이름</label>
                                <input
                                    type="text"
                                    name="guest_name"
                                    value={formData.guest_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all"
                                    placeholder="홍길동"
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">전화번호<span className="text-red-500 ml-1">*</span></label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all"
                                    placeholder="01012345678"
                                    required
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">숙소 선택<span className="text-red-500 ml-1">*</span></label>
                                <select
                                    name="room_id"
                                    value={formData.room_id}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all"
                                    required
                                >
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">입실일<span className="text-red-500 ml-1">*</span></label>
                                <input
                                    type="date"
                                    name="check_in"
                                    value={formData.check_in}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all text-gray-600"
                                    required
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">퇴실일<span className="text-red-500 ml-1">*</span></label>
                                <input
                                    type="date"
                                    name="check_out"
                                    value={formData.check_out}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all text-gray-600"
                                    required
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">메모 (선택)</label>
                                <input
                                    type="text"
                                    name="memo"
                                    value={formData.memo}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all"
                                    placeholder="특이사항 입력"
                                />
                            </div>
                        </div>

                        {/* Dynamic Options Section - Moved below dates */}
                        {(() => {
                            const selectedRoom = rooms.find(r => r.id.toString() === formData.room_id);
                            if (!selectedRoom || !selectedRoom.options || selectedRoom.options.length === 0) return null;

                            return (
                                <div className="mt-8 p-6 bg-indigo-50/50 rounded-2xl border border-blue-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <h4 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                        추가 옵션 선택
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedRoom.options.map((opt: string) => {
                                            const isSelected = formData.selected_options.includes(opt);
                                            return (
                                                <label
                                                    key={opt}
                                                    className={`
                                                        flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all shadow-sm
                                                        ${isSelected
                                                            ? "bg-blue-600 border-blue-600 text-white shadow-indigo-200"
                                                            : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-gray-50"
                                                        }
                                                    `}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            const newOpts = e.target.checked
                                                                ? [...formData.selected_options, opt]
                                                                : formData.selected_options.filter(o => o !== opt);
                                                            setFormData({ ...formData, selected_options: newOpts });
                                                        }}
                                                    />
                                                    <span className="text-sm font-bold">{opt}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="mt-8 flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center px-8 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
                            >
                                예약 등록하기
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Room Filter */}
            <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-5 sm:px-8 sm:py-6">
                <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                    <h3 className="text-lg font-bold text-gray-900">숙소 필터</h3>
                </div>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={selectedRoomFilters.length === rooms.length && rooms.length > 0}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedRoomFilters(rooms.map(r => r.id.toString()));
                                } else {
                                    setSelectedRoomFilters([]);
                                }
                            }}
                        />
                        <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">전체 선택</span>
                    </label>
                    {rooms.map(room => (
                        <label key={room.id} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                checked={selectedRoomFilters.includes(room.id.toString())}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedRoomFilters([...selectedRoomFilters, room.id.toString()]);
                                    } else {
                                        setSelectedRoomFilters(selectedRoomFilters.filter(id => id !== room.id.toString()));
                                    }
                                }}
                            />
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: room.color || '#6B7280' }}></div>
                                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{room.name}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Calendar Area */}
            <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-6 sm:p-8">
                {loading ? (
                    <div className="h-[600px] flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <CalendarView
                        reservations={reservations.filter(r => selectedRoomFilters.includes(r.room_id.toString()))}
                        onEventClick={setSelectedRes}
                    />
                )}
            </div>

            {/* Detail Modal with Manual SMS Button */}
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
