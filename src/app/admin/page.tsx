import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Edit2, Save, Trash2, X } from "lucide-react";
import AdminClientTable from "./AdminClientTable";

export default async function AdminPage() {
    const supabase = await createClient();

    // Validate admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <h1 className="text-2xl text-red-500 font-bold">접근 권한이 없습니다 (Admin Only)</h1>
            </div>
        );
    }

    // Fetch businesses
    const { data: businesses, error } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <nav className="bg-indigo-600 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center text-white">
                            <span className="text-xl font-bold tracking-tight">ChowonSMS Admin</span>
                        </div>
                        <div className="text-indigo-100 text-sm">최고관리자 모드</div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">등록 업체 관리</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        시스템에 등록된 모든 업체 정보(Business)를 수정하거나 관리합니다.
                    </p>
                </div>

                {error ? (
                    <div className="bg-red-50 p-4 rounded-xl text-red-700 font-medium">
                        데이터를 불러오는 중 오류가 발생했습니다: {error.message}
                    </div>
                ) : (
                    <AdminClientTable initialBusinesses={businesses || []} />
                )}
            </main>
        </div>
    );
}
