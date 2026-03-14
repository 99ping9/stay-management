"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Coins, TrendingUp } from "lucide-react";

export default function BillingPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        async function fetchBilling() {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) return;

            const { data: business } = await supabase
                .from("businesses")
                .select("id")
                .eq("user_id", userData.user.id)
                .single();

            if (!business) return;

            // Get current month's first day and last day
            const date = new Date();
            const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

            // Fetch all 'sent' messages this month for this business
            const { data: messages } = await supabase
                .from("scheduled_messages")
                .select(`
          id,
          reservation:reservations!inner (
            room:rooms(id, name)
          )
        `)
                .eq("reservation.business_id", business.id)
                .eq("status", "sent")
                .gte("sent_at", firstDay)
                .lte("sent_at", lastDay);

            if (messages) {
                setTotalCount(messages.length);

                // Group by room
                const roomCounts: Record<string, number> = {};
                messages.forEach((msg: any) => {
                    const roomName = msg.reservation?.room?.name || "알수없음";
                    roomCounts[roomName] = (roomCounts[roomName] || 0) + 1;
                });

                const statsArray = Object.keys(roomCounts).map((name) => ({
                    name,
                    count: roomCounts[name],
                }));

                setStats(statsArray.sort((a, b) => b.count - a.count));
            }

            setLoading(false);
        }
        fetchBilling();
    }, [supabase]);

    const currentMonth = new Date().getMonth() + 1;

    return (
        <div className="space-y-8 fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">청구내역</h1>
                    <p className="mt-2 text-gray-500">
                        이번 달({currentMonth}월) 발생한 문자 발송 통계입니다.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                    <Coins className="w-10 h-10 mb-6 opacity-80" />
                    <h2 className="text-indigo-100 text-lg font-semibold mb-1">이번 달 총 발송 건수</h2>
                    <div className="flex items-end gap-2">
                        <span className="text-5xl font-extrabold tracking-tight">{loading ? "-" : totalCount}</span>
                        <span className="text-indigo-200 text-xl font-medium mb-1">건</span>
                    </div>
                    <p className="mt-4 text-sm text-indigo-100 opacity-90">발송 완료(sent) 처리된 내역 기준</p>
                </div>

                <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-6 h-6 text-indigo-500" />
                        <h3 className="text-xl font-bold text-gray-900">숙소별 발송 통계</h3>
                    </div>

                    {loading ? (
                        <div className="h-40 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : stats.length === 0 ? (
                        <div className="h-40 flex items-center justify-center text-gray-500">
                            이번 달 발송 내역이 없습니다.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="flex items-center">
                                    <span className="w-32 text-sm font-semibold text-gray-700 truncate">{stat.name}</span>
                                    <div className="flex-1 ml-4 bg-gray-100 rounded-full h-4 overflow-hidden">
                                        <div
                                            className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${Math.max((stat.count / totalCount) * 100, 2)}%` }}
                                        ></div>
                                    </div>
                                    <span className="ml-4 w-12 text-right text-sm font-bold text-gray-900">{stat.count}건</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
