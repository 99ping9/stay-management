import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const adminSupabase = await createAdminClient();
        const { data: { users }, error } = await adminSupabase.auth.admin.listUsers();

        if (error) {
            console.error('[Admin API] listUsers error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const serializedUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at
        }));

        // Sort by created_at DESC
        serializedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return NextResponse.json({ users: serializedUsers });
    } catch (err: any) {
        console.error('[Admin API] GET exception:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });
        }

        const adminSupabase = await createAdminClient();
        const { data, error } = await adminSupabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (error) {
            console.error('[Admin API] createUser error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ user: data.user });
    } catch (err: any) {
        console.error('[Admin API] POST exception:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
