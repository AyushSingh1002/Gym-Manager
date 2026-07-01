import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { JWT, COOKIE_CONFIG, MEMBER_COOKIE_MAX_AGE } from "./constants"

const JWT_SECRET = new TextEncoder().encode(JWT.MEMBER_SECRET)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createMemberToken(payload: { id: string; phone: string }) {
  return new SignJWT({ ...payload, type: "member" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT.MEMBER_EXPIRY)
    .sign(JWT_SECRET)
}

export async function verifyMemberToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.type !== "member") return null
    return payload as { id: string; phone: string; type: string }
  } catch {
    return null
  }
}

export async function getMemberSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(JWT.MEMBER_COOKIE)?.value
  if (!token) return null
  return verifyMemberToken(token)
}

export async function getCurrentMember() {
  const session = await getMemberSession()
  if (!session) return null
  const member = await prisma.member.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      memberId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      photo: true,
      status: true,
      isActive: true,
      goal: true,
      joinDate: true,
      memberships: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          plan: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
    },
  })
  return member
}

export async function requireMemberAuth() {
  const member = await getCurrentMember()
  if (!member) {
    throw new Error("Unauthorized")
  }
  if (!member.isActive || member.status === "CANCELLED") {
    throw new Error("Forbidden")
  }
  return member
}

export async function setMemberCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(JWT.MEMBER_COOKIE, token, {
    ...COOKIE_CONFIG,
    maxAge: MEMBER_COOKIE_MAX_AGE,
  })
}

export async function clearMemberCookie() {
  const cookieStore = await cookies()
  cookieStore.set(JWT.MEMBER_COOKIE, "", {
    ...COOKIE_CONFIG,
    maxAge: 0,
  })
}
