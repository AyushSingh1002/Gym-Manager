import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_MEMBER_ROUTES = ["/member/login", "/member/signup"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_MEMBER_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/member")) {
    const token = request.cookies.get("member_session")?.value

    if (!token) {
      const loginUrl = new URL("/member/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/member/:path*"],
}
