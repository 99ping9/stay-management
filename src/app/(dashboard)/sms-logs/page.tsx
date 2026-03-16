"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { fetchSmsLogsAction } from "./actions";

export default function SmsLogsPage() {
    const supabase = createClient();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchLogs() {
            setLoading(true);
            setError(null);
            const res = await fetchSmsLogsAction();
            if (res.error) {
                setError(res.error);
            } else if (res.data) {
                setLogs(res.data);
            }
            setLoading(false);
        }
        fetchLogs();
    }, [supabase]);

    const getStatusBadge = (status: string, errorMessage?: string) => {
        switch (status) {
            case "sent":
                return (
                    <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold">
                        <CheckCircle2 className="w-3 h-3" /> 발송완료
                    </span>
                );
            case "failed":
                return (
                    <div className="group relative flex justify-center">
                        <span 
                            className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold cursor-help"
                        >
                            <XCircle className="w-3 h-3" /> 발송실패
                        </span>
                        {errorMessage && (
                            <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 w-64 p-3 bg-slate-900 text-white text-[11px] rounded-xl shadow-2xl pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-200">
                                <div className="font-black text-red-400 mb-1 uppercase tracking-wider text-[9px]">Failure Reason</div>
                                <div className="leading-relaxed opacity-90">{errorMessage}</div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900" />
                            </div>
                        )}
                    </div>
                );
            case "pending":
            default:
                return (
                    <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-xs font-bold">
                        <Clock className="w-3 h-3" /> 대기중
                    </span>
                );
        }
    };

    return (
        <div className="space-y-8 fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">문자발송내역</h1>
                    <p className="mt-2 text-gray-500">
                        최근 등록된 발송 스케줄 및 처리 결과를 확인합니다.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-100">
                        에러 발생: {error}
                    </div>
                )}
                {loading ? (
                    <div className="py-24 flex justify-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">숙소명</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">예약자 / 수신처</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">문자 종류</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">상태</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">스케줄 시간 (처리시간)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {log.reservation?.room?.name || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.template?.recipient_type === 'staff' ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-emerald-600 mb-1 bg-emerald-50 px-2 py-0.5 rounded w-fit italic">CLEANING STAFF</span>
                                                    <div className="text-sm font-bold text-gray-900">{log.reservation?.guest_name} 건 청소알림</div>
                                                    <div className="text-xs text-gray-500">등록된 모든 이모님께 발송</div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="text-sm font-bold text-gray-900">{log.reservation?.guest_name || "-"}</div>
                                                    <div className="text-sm text-gray-500">{log.reservation?.phone || "-"}</div>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {log.template?.title || log.template?.trigger_type || "수동발송/알수없음"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center flex justify-center mt-2.5">
                                            {getStatusBadge(log.status, log.error_message)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                            <div className="text-gray-900 font-medium">
                                                {new Date(log.scheduled_at).toLocaleString('ko-KR')}
                                            </div>
                                            {log.sent_at && (
                                                <div className="text-xs text-gray-400 mt-1">
                                                    완료: {new Date(log.sent_at).toLocaleTimeString('ko-KR')}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            발송 내역이 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
