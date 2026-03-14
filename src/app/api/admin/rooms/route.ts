import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'userId 파라미터가 필요합니다.' }, { status: 400 });
    }

    try {
        // Find business for user
        const { data: business } = await supabaseAdmin
            .from('businesses')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!business) {
            return NextResponse.json({ rooms: [] });
        }

        const { data: rooms, error } = await supabaseAdmin
            .from('rooms')
            .select('*')
            .eq('business_id', business.id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ rooms });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId, userEmail, roomName, roomColor } = await request.json();

        if (!userId || !roomName) {
            return NextResponse.json({ error: 'userId와 roomName은 필수입니다.' }, { status: 400 });
        }

        // 1. Get or create business for the user
        let { data: business } = await supabaseAdmin
            .from('businesses')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!business) {
            // Create a default business record since rooms require a business_id
            const { data: newBusiness, error: bError } = await supabaseAdmin
                .from('businesses')
                .insert({
                    user_id: userId,
                    name: userEmail?.split('@')[0] + '의 업체',
                    owner_name: '관리자 생성',
                    contact_phone: '000-0000-0000',
                    email: userEmail || 'unknown@example.com'
                })
                .select()
                .single();

            if (bError) throw bError;
            business = newBusiness;
        }

        // 2. Insert room
        const { data: room, error: rError } = await supabaseAdmin
            .from('rooms')
            .insert({
                business_id: business!.id,
                name: roomName,
                color: roomColor || null
            })
            .select()
            .single();

        if (rError) throw rError;

        return NextResponse.json({ room });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { roomId, name, color, options, staff_members } = await request.json();

        if (!roomId) {
            return NextResponse.json({ error: 'roomId가 필요합니다.' }, { status: 400 });
        }

        const { data: room, error } = await supabaseAdmin
            .from('rooms')
            .update({
                name,
                color,
                options,
                staff_members
            })
            .eq('id', roomId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ room });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('roomId');

        if (!roomId) {
            return NextResponse.json({ error: 'roomId 파라미터가 필요합니다.' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('rooms')
            .delete()
            .eq('id', roomId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
