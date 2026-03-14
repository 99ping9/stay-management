"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "./actions";
import { Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, null);
    const router = useRouter();
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminPasswordInput, setAdminPasswordInput] = useState("");
    const [adminError, setAdminError] = useState("");

    const verifyAdminPassword = () => {
        if (adminPasswordInput === "dbsgusrn1!") {
            sessionStorage.setItem("isAdmin", "true");
            router.push("/admin/users");
        } else {
            setAdminError("비밀번호가 일치하지 않습니다.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50">
            {/* Background Gradient similar to old ChowonSMS */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--color-indigo-100)_0%,_var(--color-white)_50%,_var(--color-pink-100)_100%)] opacity-70"></div>

            <div className="w-full max-w-md p-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-600 tracking-tight">
                        통합숙소관리 시스템
                    </h1>
                </div>

                <form action={formAction} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="email">
                            이메일
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="admin@example.com"
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50/50 border-transparent focus:border-indigo-500 focus:bg-white ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="password">
                            비밀번호
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50/50 border-transparent focus:border-indigo-500 focus:bg-white ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm transition-all duration-200"
                            />
                        </div>
                    </div>

                    {state?.error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {state.error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isPending ? (
                            <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                        ) : null}
                        로그인
                    </button>
                </form>
            </div>

            {/* Admin Password Modal */}
            {showAdminLogin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">최고관리자 접속</h3>
                            <button onClick={() => { setShowAdminLogin(false); setAdminPasswordInput(""); setAdminError(""); }} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">관리자 비밀번호</label>
                                <input
                                    type="password"
                                    value={adminPasswordInput}
                                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            verifyAdminPassword();
                                        }
                                    }}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm transition-all outline-none"
                                    placeholder="비밀번호 입력"
                                    autoFocus
                                />
                            </div>

                            {adminError && <p className="text-red-500 text-sm">{adminError}</p>}

                            <button
                                type="button"
                                onClick={verifyAdminPassword}
                                className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-900 hover:bg-black shadow-md hover:shadow-lg transition-all"
                            >
                                접속
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Button */}
            <div className="fixed bottom-4 right-4 z-40">
                <button
                    type="button"
                    onClick={() => setShowAdminLogin(true)}
                    className="text-xs text-gray-400 hover:text-gray-700 font-medium px-3 py-1.5 rounded-full bg-white/50 hover:bg-white/80 transition-colors"
                >
                    관리자
                </button>
            </div>

            <footer className="absolute bottom-6 w-full text-center text-sm text-gray-500 font-medium z-30">
                <a href="https://www.biz-potential-consulting.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 transition-colors">
                    &copy; Biz-Potential-Consulting. All rights reserved.
                </a>
            </footer>
        </div>
    );
}
