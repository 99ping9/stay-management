"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function ResetPasswordPage() {
    const { showToast } = useToast();
    const router = useRouter();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword.length < 6) {
            showToast("비밀번호는 최소 6자리 이상이어야 합니다.", "info");
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast("비밀번호가 일치하지 않습니다.", "info");
            return;
        }

        setLoading(true);
        const supabase = createClient();
        
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        setLoading(false);

        if (error) {
            showToast("비밀번호 변경 중 오류가 발생했습니다: " + error.message, "error");
        } else {
            setSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        }
    };

    if (success) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white text-center max-w-md w-full animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">변경 완료!</h2>
                    <p className="text-gray-600 leading-relaxed">
                        비밀번호가 성공적으로 변경되었습니다.<br />
                        3초 후 로그인 페이지로 이동합니다.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white p-8 sm:p-12 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-300/5 rounded-full blur-3xl" />
                    
                    <div className="relative">
                        <div className="flex justify-center mb-8">
                            <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200">
                                <Sparkles className="w-8 h-8" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-black text-center text-gray-900 mb-2 tracking-tight">새 비밀번호 설정</h1>
                        <p className="text-center text-gray-500 mb-10 text-lg">기억하기 쉬운 새로운 비밀번호를 입력해주세요.</p>

                        <form onSubmit={handleReset} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">새 비밀번호</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="block w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-gray-900 transition-all outline-none text-lg"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">비밀번호 확인</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-gray-900 transition-all outline-none text-lg"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <><Loader2 className="w-6 h-6 animate-spin" /> 처리 중...</>
                                ) : (
                                    "비밀번호 변경하기"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
