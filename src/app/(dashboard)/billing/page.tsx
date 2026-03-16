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

            {/* 1. Calendar Part (Top Full Width) */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-gray-100/50 min-h-[600px] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500/20 via-blue-500 to-blue-500/20"></div>
                <div className="flex items-center justify-between mb-8 px-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">예약 및 퇴실 달력</h3>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2. Total Cleaning Stats (Bottom Left) */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden h-full flex flex-col justify-center">
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
                        <Sparkles className="w-12 h-12 mb-8 text-blue-200" />
                        <h2 className="text-blue-100 text-lg font-bold mb-2">이번 달 총 청소 횟수</h2>
                        <div className="flex items-end gap-3">
                            <span className="text-7xl font-black tracking-tighter">{loading ? "-" : totalCleanings}</span>
                            <span className="text-blue-200 text-2xl font-bold mb-2">회</span>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-sm text-blue-100/80 font-medium">
                            <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></div>
                            선택된 달의 퇴실 건수 기준
                        </div>
                    </div>
                </div>

                {/* 3. Room Stats (Bottom Right) */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-gray-100/50">
                    <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
                        <div className="w-2.5 h-8 bg-blue-500 rounded-full shadow-lg shadow-blue-500/20"></div>
                        숙소별 청소 현황
                    </h3>
                    
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="text-gray-400 text-center py-20 font-medium italic">등록된 숙소가 없습니다.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                            {rooms.map(room => (
                                <div key={room.id} className="flex items-center justify-between group p-6 rounded-3xl bg-gray-50/50 hover:bg-blue-50/50 transition-all border border-transparent hover:border-blue-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: room.color || '#3b82f6' }}></div>
                                        <span className="text-lg font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{room.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl font-black text-slate-900">{cleaningStats[room.id] || 0}</span>
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest pt-2">회</span>
                                    </div>
                                </div>
                            ))}
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

