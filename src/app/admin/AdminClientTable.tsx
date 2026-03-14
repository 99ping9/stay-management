"use client";

import { useState } from "react";
import { Edit2, Save, X } from "lucide-react";
import { updateBusiness } from "./actions";
import { useToast } from "@/components/ToastProvider";

export default function AdminClientTable({ initialBusinesses }: { initialBusinesses: any[] }) {
    const { showToast } = useToast();
    const [businesses, setBusinesses] = useState(initialBusinesses);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const handleEdit = (b: any) => {
        setEditingId(b.id);
        setEditForm({ ...b });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSave = async (id: number) => {
        setLoading(true);
        const res = await updateBusiness(id, editForm);
        if (res.error) {
            showToast("수정 실패: " + res.error, "error");
        } else {
            showToast("수정되었습니다.", "success");
            setBusinesses(businesses.map((b) => (b.id === id ? { ...b, ...editForm } : b)));
            setEditingId(null);
        }
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">업체명</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">대표자</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">연락처</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">이메일</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">관리</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {businesses.map((b) => {
                            const isEditing = editingId === b.id;
                            return (
                                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {isEditing ? (
                                            <input
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                className="border border-gray-300 rounded px-2 py-1 w-full outline-none focus:border-indigo-500"
                                            />
                                        ) : (
                                            b.name
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {isEditing ? (
                                            <input
                                                value={editForm.owner_name}
                                                onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                                                className="border border-gray-300 rounded px-2 py-1 w-full outline-none focus:border-indigo-500"
                                            />
                                        ) : (
                                            b.owner_name
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {isEditing ? (
                                            <input
                                                value={editForm.contact_phone}
                                                onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                                                className="border border-gray-300 rounded px-2 py-1 w-full outline-none focus:border-indigo-500"
                                            />
                                        ) : (
                                            b.contact_phone
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {isEditing ? (
                                            <input
                                                value={editForm.email}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                className="border border-gray-300 rounded px-2 py-1 w-full outline-none focus:border-indigo-500"
                                            />
                                        ) : (
                                            b.email
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                        {isEditing ? (
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleSave(b.id)}
                                                    disabled={loading}
                                                    className="text-green-600 hover:text-green-900 bg-green-50 p-1.5 rounded-md hover:bg-green-100 transition-colors"
                                                >
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    disabled={loading}
                                                    className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md hover:bg-red-100 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEdit(b)}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded-md hover:bg-indigo-100 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {businesses.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                                    등록된 업체가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
