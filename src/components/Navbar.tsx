"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminPasswordInput, setAdminPasswordInput] = useState("");
    const [adminError, setAdminError] = useState("");

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

    const navLinks = [
        { label: "예약/숙소 관리", href: "/reservations", color: "indigo" },
        { label: "문자 템플릿", href: "/templates", color: "pink" },
        { label: "문자발송내역", href: "/sms-logs", color: "green" },
        { label: "청구내역", href: "/billing", color: "emerald" },
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
                                    className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-600 hover:opacity-80 transition-opacity"
                                >
                                    통합숙소관리 시스템
                                </Link>
                            </div>
                            <div className="hidden sm:ml-10 sm:flex sm:space-x-8 overflow-x-auto">
                                {navLinks.map((link) => {
                                    const isActive = pathname.startsWith(link.href);

                                    // Color mapping for active states
                                    let activeColorClass = "bg-indigo-500";
                                    if (link.color === "pink") activeColorClass = "bg-pink-500";
                                    if (link.color === "green") activeColorClass = "bg-green-500";
                                    if (link.color === "emerald") activeColorClass = "bg-emerald-500";

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
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowAdminLogin(true)}
                                className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-indigo-50"
                            >
                                <Settings className="w-4 h-4" />
                                관리자
                            </button>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4" />
                                로그아웃
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
        </>
    );
}
