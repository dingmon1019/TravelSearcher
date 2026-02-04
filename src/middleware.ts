import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Update session and get current user
  const { supabaseResponse } = await updateSession(request)

  // Auth requirement removed as per user request
  /*
  if (request.nextUrl.pathname.startsWith('/search')) {
    if (!user) {
      // Redirect to login if not authenticated
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }
  */

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
