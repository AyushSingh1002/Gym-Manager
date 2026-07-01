import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ADMIN_COOKIE = "session"
const MEMBER_COOKIE = "member_session"
const PUBLIC_ROUTES = ["/member/login", "/member/signup"]

const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || ""
const JWT_MEMBER_SECRET = process.env.JWT_MEMBER_SECRET || process.env.JWT_SECRET || ""

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[]

function verifyTokenSimple(token: string, secret: string): boolean {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return false
    const payload = JSON.parse(atob(parts[1]))
    const exp = payload.exp
    if (exp && Date.now() >= exp * 1000) return false
    return true
  } catch {
    return false
  }
}

function isApiStateChange(pathname: string, method: string): boolean {
  if (!pathname.startsWith("/api/")) return false
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  const response = NextResponse.next()

  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")

  if (isApiStateChange(pathname, method)) {
    const origin = request.headers.get("origin")
    const referer = request.headers.get("referer")

    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
    }

    if (!origin && referer) {
      try {
        const refererOrigin = new URL(referer).origin
        if (!ALLOWED_ORIGINS.includes(refererOrigin)) {
          return NextResponse.json({ error: "Invalid referer" }, { status: 403 })
        }
      } catch {
        return NextResponse.json({ error: "Invalid referer" }, { status: 403 })
      }
    }
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    return response
  }

  if (pathname.startsWith("/member")) {
    const token = request.cookies.get(MEMBER_COOKIE)?.value

    if (!token || !verifyTokenSimple(token, JWT_MEMBER_SECRET)) {
      const loginUrl = new URL("/member/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (pathname.startsWith("/admin") || pathname === "/dashboard") {
    const token = request.cookies.get(ADMIN_COOKIE)?.value

    if (!token || !verifyTokenSimple(token, JWT_ADMIN_SECRET)) {
      const loginUrl = new URL("/auth/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: ["/member/:path*", "/admin/:path*", "/dashboard/:path*", "/api/:path*"],
}
