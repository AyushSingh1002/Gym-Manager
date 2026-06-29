import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "gymflow-super-secret-key-change-in-production"
)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: { id: string; email: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { id: string; email: string; role: string }
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getCurrentAdmin() {
  const session = await getSession()
  if (!session) return null
  const admin = await prisma.admin.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, phone: true, avatar: true },
  })
  return admin
}

export async function requireAuth() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    throw new Error("Unauthorized")
  }
  return admin
}

export async function logActivity(
  adminId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: string
) {
  await prisma.activityLog.create({
    data: { adminId, action, entity, entityId, details },
  })
}
