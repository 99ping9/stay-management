import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        console.log('[Admin Users API] Supabase URL exists:', !!supabaseUrl);
        console.log('[Admin Users API] Service Role Key exists:', !!serviceRoleKey);

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ error: 'Server configuration error (missing env vars)' }, { status: 500 });
        }

        const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

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

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ error: 'Server configuration error (missing env vars)' }, { status: 500 });
        }

        const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const { data, error } = await adminSupabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (error) {
            console.error('[Admin Users API] createUser error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ user: data.user });
    } catch (err: any) {
        console.error('[Admin Users API] POST exception:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
