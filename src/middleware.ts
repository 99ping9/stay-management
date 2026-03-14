import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Routes configuration
    const pathname = request.nextUrl.pathname;
    const isDashboardRoute = pathname.startsWith('/reservations') ||
        pathname.startsWith('/templates') ||
        pathname.startsWith('/billing') ||
        pathname === '/';

    const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/users';

    if (!user && (isDashboardRoute || isAdminRoute)) {
        // Redirect unauthenticated users to the login page
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Admin section protection: Check if the user role is 'admin' from metadata or a separate query
    // For simplicity, assuming user_metadata structure has role inside it
    if (user && isAdminRoute) {
        const role = user.user_metadata?.role;
        if (role !== 'admin') {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }
    }

    // Redirect authenticated users away from login
    if (user && pathname === '/login') {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
