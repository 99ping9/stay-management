"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Key, Loader2 } from "lucide-react";
import { changePasswordAction } from "@/app/(dashboard)/profile/actions";
import { useToast } from "./ToastProvider";

export default function Navbar() {
    const { showToast } = useToast();
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminPasswordInput, setAdminPasswordInput] = useState("");
    const [adminError, setAdminError] = useState("");

    // Password Change State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pwdForm, setPwdForm] = useState({
        current: "",
        new: "",
        confirm: ""
    });
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdError, setPwdError] = useState("");

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };
    const verifyAdminPassword = () => {
        if (adminPasswordInput === "dbsgusrn1!") {
            sessionStorage.setItem("isAdmin", "true");
            router.push("/admin/users");
            setShowAdminLogin(false);
            setAdminPasswordInput("");
            setAdminError("");
        } else {
            setAdminError("비밀번호가 일치하지 않습니다.");
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwdError("");

        if (pwdForm.new !== pwdForm.confirm) {
            setPwdError("새 비밀번호가 일치하지 않습니다.");
            return;
        }

        if (pwdForm.new.length < 6) {
            setPwdError("비밀번호는 최소 6자 이상이어야 합니다.");
            return;
        }

        setPwdLoading(true);
        const res = await changePasswordAction({
            currentPassword: pwdForm.current,
            newPassword: pwdForm.new
        });

        if (res.error) {
            setPwdError(res.error);
        } else {
            showToast("비밀번호가 성공적으로 변경되었습니다.", "success");
            setShowPasswordModal(false);
            setPwdForm({ current: "", new: "", confirm: "" });
        }
        setPwdLoading(false);
    };

    const navLinks = [
        { label: "예약/숙소 관리", href: "/reservations", color: "blue" },
        { label: "문자 템플릿", href: "/templates", color: "blue" },
        { label: "문자발송내역", href: "/sms-logs", color: "blue" },
        { label: "청구내역", href: "/billing", color: "blue" },
    ];

    return (
        <>
            <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link
                                    href="/"
                                    className="text-lg sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500 hover:opacity-80 transition-opacity truncate max-w-[200px] sm:max-w-none"
                                >
                                    통합숙소관리 시스템
                                </Link>
                            </div>
                            <div className="hidden sm:ml-10 sm:flex sm:space-x-8 overflow-x-auto">
                                {navLinks.map((link) => {
                                    const isActive = pathname.startsWith(link.href);

                                    // Color mapping for active states
                                    let activeColorClass = "bg-blue-500";

                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 relative group
                      ${isActive
                                                    ? "border-transparent text-gray-900 font-semibold"
                                                    : "border-transparent text-gray-500 hover:text-gray-900"
                                                }
                    `}
                                        >
                                            {link.label}
                                            <span
                                                className={`absolute bottom-0 left-0 w-full h-0.5 transform transition-transform duration-200 ${activeColorClass} ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                                                    }`}
                                            ></span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <button
                                onClick={() => setShowAdminLogin(true)}
                                className="inline-flex items-center gap-1 sm:gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium p-2 sm:px-3 sm:py-2 rounded-lg hover:bg-blue-50"
                            >
                                <Settings className="w-5 h-5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">관리자</span>
                            </button>
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="inline-flex items-center gap-1 sm:gap-2 text-gray-500 hover:text-amber-600 transition-colors text-sm font-medium p-2 sm:px-3 sm:py-2 rounded-lg hover:bg-amber-50"
                            >
                                <Key className="w-5 h-5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">비밀번호 변경</span>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center gap-1 sm:gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm font-medium p-2 sm:px-3 sm:py-2 rounded-lg hover:bg-red-50"
                            >
                                <LogOut className="w-5 h-5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">로그아웃</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Admin Password Modal */}
            {showAdminLogin && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
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
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all outline-none"
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
            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">비밀번호 변경</h3>
                            <button onClick={() => { setShowPasswordModal(false); setPwdError(""); setPwdForm({ current: "", new: "", confirm: "" }); }} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">현재 비밀번호</label>
                                <input
                                    type="password"
                                    required
                                    value={pwdForm.current}
                                    onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all outline-none"
                                    placeholder="기존 비밀번호"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">새 비밀번호</label>
                                <input
                                    type="password"
                                    required
                                    value={pwdForm.new}
                                    onChange={(e) => setPwdForm({ ...pwdForm, new: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all outline-none"
                                    placeholder="새 비밀번호 (6자 이상)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">새 비밀번호 확인</label>
                                <input
                                    type="password"
                                    required
                                    value={pwdForm.confirm}
                                    onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all outline-none"
                                    placeholder="비밀번호 재입력"
                                />
                            </div>

                            {pwdError && <p className="text-red-500 text-sm">{pwdError}</p>}

                            <button
                                type="submit"
                                disabled={pwdLoading}
                                className="w-full py-3 px-4 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {pwdLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "변경하기"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

