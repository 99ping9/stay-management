"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Sparkles, Calendar as CalendarIcon } from "lucide-react";
import CalendarView from "../reservations/CalendarView";
import { fetchReservationDataAction } from "../reservations/actions";

export default function BillingPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState<any[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const fetchData = async () => {
        setLoading(true);
        const res = await fetchReservationDataAction();
        if (!res.error) {
            setRooms(res.rooms || []);
            setReservations(res.reservations || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter reservations that have check_out in the current visible month
    const cleaningStats = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        
        const monthlyReservations = reservations.filter(res => {
            const checkOutDate = new Date(res.check_out);
            return checkOutDate.getFullYear() === year && checkOutDate.getMonth() === month;
        });

        const stats: Record<number, number> = {};
        rooms.forEach((room) => {
            stats[room.id] = monthlyReservations.filter(res => res.room_id === room.id).length;
        });

        return stats;
    }, [reservations, rooms, currentMonth]);

    const totalCleanings = Object.values(cleaningStats).reduce((acc, curr) => acc + curr, 0);

    return (
        <div className="space-y-8 fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">청구내역</h1>
                    <p className="mt-2 text-gray-500">
                        퇴실일 기준 청소 횟수 및 정산 내역을 확인하세요.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Statistics Part */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                        <Sparkles className="w-10 h-10 mb-6 opacity-80" />
                        <h2 className="text-blue-100 text-lg font-semibold mb-1">이번 달 총 청소 횟수</h2>
                        <div className="flex items-end gap-2">
                            <span className="text-5xl font-extrabold tracking-tight">{loading ? "-" : totalCleanings}</span>
                            <span className="text-blue-200 text-xl font-medium mb-1">회</span>
                        </div>
                        <p className="mt-4 text-sm text-blue-100 opacity-90">선택된 달의 퇴실 건수 기준</p>
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                            숙소별 청소 현황
                        </h3>
                        
                        {loading ? (
                            <div className="py-10 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                            </div>
                        ) : rooms.length === 0 ? (
                            <p className="text-gray-400 text-center py-10">등록된 숙소가 없습니다.</p>
                        ) : (
                            <div className="space-y-5">
                                {rooms.map(room => (
                                    <div key={room.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: room.color || '#6366f1' }}></div>
                                            <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{room.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-gray-900">{cleaningStats[room.id] || 0}</span>
                                            <span className="text-sm text-gray-400 font-medium">회</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Calendar Part */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 min-h-[600px]">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-blue-500" />
                            <h3 className="text-xl font-bold text-gray-900">예약 및 퇴실 달력</h3>
                        </div>
                    </div>
                    
                    {loading ? (
                        <div className="h-[500px] flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="billing-calendar-wrapper">
                           <CalendarView 
                             reservations={reservations} 
                             onEventClick={() => {}}
                             onDatesSet={setCurrentMonth}
                           />
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .billing-calendar-wrapper .fc .fc-toolbar-title {
                    font-size: 1.25rem !important;
                    font-weight: 700 !important;
                }
                .billing-calendar-wrapper .fc .fc-button {
                    background-color: #f3f4f6 !important;
                    border: none !important;
                    color: #374151 !important;
                    font-weight: 600 !important;
                    text-transform: capitalize !important;
                    padding: 0.5rem 1rem !important;
                    border-radius: 0.75rem !important;
                }
                .billing-calendar-wrapper .fc .fc-button:hover {
                    background-color: #e5e7eb !important;
                }
                .billing-calendar-wrapper .fc .fc-button-active {
                    background-color: #0e8ce4 !important;
                    color: white !important;
                }
            `}</style>
        </div>
    );
}

