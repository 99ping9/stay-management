"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, Plus, Settings, Trash2, Save, X as XIcon } from "lucide-react";

export default function AdminUsersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [error, setError] = useState("");

    // Form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");

    // Room management state
    const [selectedUserForRooms, setSelectedUserForRooms] = useState<any>(null);
    const [userRooms, setUserRooms] = useState<any[]>([]);
    const [isRoomsLoading, setIsRoomsLoading] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");
    const [newRoomColor, setNewRoomColor] = useState("#3b82f6");
    const [isAddingRoom, setIsAddingRoom] = useState(false);
    const [editingRoom, setEditingRoom] = useState<any>(null); // For options editor
    const [roomOptions, setRoomOptions] = useState<string[]>(Array(10).fill(""));
    const [isStaffEditorOpen, setIsStaffEditorOpen] = useState(false);
    const [staffMembers, setStaffMembers] = useState<{ name: string, phone: string }[]>([]);

    const presetColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e", "#0ea5e9", "#14b8a6", "#eab308", "#ec4899", "#64748b"];

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isAdmin = sessionStorage.getItem("isAdmin");
            if (isAdmin !== "true") {
                router.push("/");
            } else {
                fetchUsers();
            }
        }
    }, [router]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/users");
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setUsers(data.users || []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setFormSuccess("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setFormSuccess(`${email} 계정이 성공적으로 생성되었습니다.`);
            setEmail("");
            setPassword("");
            fetchUsers(); // Refresh list
        } catch (err: any) {
            setFormError(err.message || "Failed to create user");
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchUserRooms = async (userId: string) => {
        try {
            setIsRoomsLoading(true);
            const res = await fetch(`/api/admin/rooms?userId=${userId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setUserRooms(data.rooms || []);
        } catch (err: any) {
            alert(err.message || "설정된 숙소 정보를 불러오는데 실패했습니다.");
        } finally {
            setIsRoomsLoading(false);
        }
    };

    const handleAddRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserForRooms || !newRoomName.trim()) return;

        setIsAddingRoom(true);
        try {
            const res = await fetch("/api/admin/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: selectedUserForRooms.id,
                    userEmail: selectedUserForRooms.email,
                    roomName: newRoomName.trim(),
                    roomColor: newRoomColor
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setNewRoomName("");
            setNewRoomColor("#3b82f6");
            fetchUserRooms(selectedUserForRooms.id);
        } catch (err: any) {
            alert(err.message || "숙소를 추가하는데 실패했습니다.");
        } finally {
            setIsAddingRoom(false);
        }
    };

    const handleDeleteRoom = async (roomId: number) => {
        if (!confirm("정말 이 숙소를 삭제하시겠습니까? 관련 예약 및 템플릿도 모두 삭제될 수 있습니다.")) return;
        try {
            const res = await fetch(`/api/admin/rooms?roomId=${roomId}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            fetchUserRooms(selectedUserForRooms.id);
        } catch (err: any) {
            alert(err.message || "숙소를 삭제하는데 실패했습니다.");
        }
    };

    const handleOpenOptions = (room: any) => {
        setEditingRoom(room);
        const opts = [...(room.options || [])];
        while (opts.length < 10) opts.push("");
        setRoomOptions(opts);
    };

    const handleSaveOptions = async () => {
        if (!editingRoom) return;
        const filteredOptions = roomOptions.map(o => o.trim()).filter(o => o !== "");

        try {
            const res = await fetch("/api/admin/rooms", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: editingRoom.id,
                    options: filteredOptions
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert("저장되었습니다.");
            setEditingRoom(null);
            fetchUserRooms(selectedUserForRooms.id);
        } catch (err: any) {
            alert(err.message || "옵션을 저장하는데 실패했습니다.");
        }
    };

    const handleOpenStaff = (room: any) => {
        setEditingRoom(room);
        setStaffMembers(room.staff_members || []);
        setIsStaffEditorOpen(true);
    };

    const handleSaveStaff = async () => {
        if (!editingRoom) return;
        const filteredStaff = staffMembers
    .filter(s => s.name.trim() !== "" && s.phone.trim() !== "")
    .map(s => ({ ...s, phone: s.phone.replace(/[^0-9]/g, "") }));

        try {
            const res = await fetch("/api/admin/rooms", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: editingRoom.id,
                    staff_members: filteredStaff
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert("저장되었습니다.");
            setIsStaffEditorOpen(false);
            setEditingRoom(null);
            fetchUserRooms(selectedUserForRooms.id);
        } catch (err: any) {
            alert(err.message || "직원 정보를 저장하는데 실패했습니다.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <nav className="bg-gray-900 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center text-white gap-2">
                            <span className="text-xl font-bold tracking-tight">Super Admin</span>
                            <span className="text-gray-400 text-sm hidden sm:block">| 사용자 관리</span>
                        </div>
                        <button
                            onClick={() => router.push("/")}
                            className="text-gray-300 hover:text-white text-sm"
                        >
                            메인으로 돌아가기
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900">시스템 사용자 관리</h2>
                        <p className="mt-1 text-sm text-gray-600 font-medium">
                            ChowonSMS에 등록된 사용자(Business)의 계정을 조회하고 신규 계정을 생성할 수 있습니다.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 p-4 rounded-xl text-red-700 font-medium mb-6 animate-in fade-in">
                        오류: {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create User Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Plus className="h-5 w-5 text-indigo-500" /> 신규 사용자 추가
                            </h3>

                            <form onSubmit={handleCreateUser} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">이메일</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent transition-all shadow-sm text-sm"
                                        placeholder="user@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent transition-all shadow-sm text-sm"
                                        placeholder="최소 6자리 이상 영문/숫자"
                                    />
                                </div>

                                {formError && <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">{formError}</p>}
                                {formSuccess && <p className="text-sm text-indigo-700 bg-indigo-50 p-2 rounded-lg font-medium">{formSuccess}</p>}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all focus:ring-4 focus:ring-indigo-200 flex justify-center items-center gap-2 disabled:opacity-70 shadow-md hover:shadow-lg mt-2"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="h-5 w-5 animate-spin" /> 생성 중...</>
                                    ) : (
                                        "사용자 추가하기"
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[400px]">
                            {loading && users.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                                    <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
                                </div>
                            ) : null}

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="py-4 px-6 font-bold text-gray-600 text-sm">이메일</th>
                                            <th className="py-4 px-6 font-bold text-gray-600 text-sm w-1/4">가입일</th>
                                            <th className="py-4 px-6 font-bold text-gray-600 text-sm w-1/4">최근 로그인</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {users.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                                                onClick={() => { setSelectedUserForRooms(user); fetchUserRooms(user.id); }}
                                            >
                                                <td className="py-4 px-6 text-sm font-semibold text-gray-900 group-hover:text-indigo-600">{user.email}</td>
                                                <td className="py-4 px-6 text-sm text-gray-500 font-medium">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 px-6 text-sm text-gray-500 font-medium">
                                                    {user.last_sign_in_at
                                                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                                                        : <span className="text-gray-400 italic">기록 없음</span>}
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan={3} className="py-12 text-center text-gray-500 bg-gray-50/50">
                                                    등록된 사용자가 없습니다.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="mt-8 py-6 text-center text-sm text-gray-400 font-medium">
                <a href="https://www.biz-potential-consulting.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 transition-colors">
                    &copy; Biz-Potential-Consulting. All rights reserved.
                </a>
            </footer>

            {/* Rooms Management Modal */}
            {selectedUserForRooms && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">숙소 목록 관리</h3>
                                <p className="text-sm text-gray-500 mt-1">{selectedUserForRooms.email}</p>
                            </div>
                            <button onClick={() => { setSelectedUserForRooms(null); setUserRooms([]); setNewRoomName(""); setNewRoomColor("#3b82f6"); setEditingRoom(null); setIsStaffEditorOpen(false); }} className="text-gray-400 hover:text-gray-600 self-start">
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto mb-6 pr-2">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">등록된 숙소</h4>
                            {isRoomsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin h-6 w-6 text-indigo-500" />
                                </div>
                            ) : userRooms.length > 0 ? (
                                <ul className="space-y-2">
                                    {userRooms.map(room => (
                                        <li key={room.id} className="p-3 bg-gray-50 rounded-xl text-sm font-medium border border-gray-100 flex justify-between items-center text-gray-800 group">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: room.color || '#6B7280' }}></div>
                                                {room.name}
                                                {room.options?.length > 0 && (
                                                    <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded ml-1">
                                                        옵션 {room.options.length}
                                                    </span>
                                                )}
                                                {room.staff_members?.length > 0 && (
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded ml-1">
                                                        이모님 {room.staff_members.length}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 opacity-10 sm:opacity-10 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenStaff(room)}
                                                    className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors"
                                                    title="청소 이모님 관리"
                                                >
                                                    <Users className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenOptions(room)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                                                    title="옵션 관리"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRoom(room.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="숙소 삭제"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-sm text-gray-500">등록된 숙소가 없습니다.</p>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleAddRoom} className="border-t border-gray-100 pt-5">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">새 숙소 추가</label>
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={newRoomName}
                                        onChange={(e) => setNewRoomName(e.target.value)}
                                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent transition-all shadow-sm text-sm"
                                        placeholder="숙소 이름"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isAddingRoom || !newRoomName.trim()}
                                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 shadow-sm flex items-center gap-2 whitespace-nowrap focus:ring-4 focus:ring-indigo-100"
                                    >
                                        {isAddingRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : "추가"}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                    <span className="text-xs text-gray-500 font-medium mr-1">색상 지정:</span>
                                    {presetColors.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewRoomColor(color)}
                                            className={`w-6 h-6 rounded-full border-2 transition-all ${newRoomColor === color ? 'border-gray-800 scale-110 shadow-sm' : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'}`}
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Room Options Editor Sub-Modal */}
            {editingRoom && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">부가 옵션 설정</h3>
                                <p className="text-sm text-indigo-600 font-semibold mt-1">{editingRoom.name}</p>
                            </div>
                            <button onClick={() => setEditingRoom(null)} className="text-gray-400 hover:text-gray-600">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-2 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            <p className="text-xs text-gray-500 mb-4 font-medium">숙소별 제공하는 부가 옵션(바베큐, 조식 등)을 최대 10개까지 설정할 수 있습니다.</p>
                            {roomOptions.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2 group">
                                    <span className="text-xs text-gray-400 w-4 font-bold">{idx + 1}</span>
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...roomOptions];
                                            newOpts[idx] = e.target.value;
                                            setRoomOptions(newOpts);
                                        }}
                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                        placeholder="옵션 이름을 입력하세요 (예: 바베큐)"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setEditingRoom(null)}
                                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveOptions}
                                className="flex-2 py-3 px-8 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md"
                            >
                                <Save className="w-4 h-4" /> 저장하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Room Staff Editor Sub-Modal */}
            {isStaffEditorOpen && editingRoom && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">청소 이모님 관리</h3>
                                <p className="text-sm text-emerald-600 font-semibold mt-1">{editingRoom.name}</p>
                            </div>
                            <button onClick={() => { setIsStaffEditorOpen(false); setEditingRoom(null); }} className="text-gray-400 hover:text-gray-600">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            <p className="text-xs text-gray-500 mb-4 font-medium">숙소별 알림을 수신할 청소 이모님들을 등록하세요. (성함, 연락처)</p>
                            
                            {staffMembers.map((staff, idx) => (
                                <div key={idx} className="flex gap-2 items-center bg-gray-50 p-3 rounded-xl border border-gray-100 group relative">
                                    <input
                                        type="text"
                                        value={staff.name}
                                        onChange={(e) => {
                                            const newStaff = [...staffMembers];
                                            newStaff[idx].name = e.target.value;
                                            setStaffMembers(newStaff);
                                        }}
                                        className="w-1/3 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="성함"
                                    />
                                    <input
                                        type="text"
                                        value={staff.phone}
                                        onChange={(e) => {
                                            const newStaff = [...staffMembers];
                                            newStaff[idx].phone = e.target.value;
                                            setStaffMembers(newStaff);
                                        }}
                                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="010-0000-0000"
                                    />
                                    <button
                                        onClick={() => setStaffMembers(staffMembers.filter((_, i) => i !== idx))}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={() => setStaffMembers([...staffMembers, { name: "", phone: "" }])}
                                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-emerald-500 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> 이모님 추가
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setIsStaffEditorOpen(false); setEditingRoom(null); }}
                                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveStaff}
                                className="flex-2 py-3 px-8 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-md"
                            >
                                <Save className="w-4 h-4" /> 저장하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
