import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { requireAuth } from "@/lib/auth"
import { rateLimitMiddleware } from "@/lib/rate-limit"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const { allowed, headers } = rateLimitMiddleware(request, 10, 60000)
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers })
    }

    const admin = await requireAuth()

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, PDF" },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
    const filePath = path.join(uploadDir, uniqueName)
    await writeFile(filePath, buffer)

    const url = `/uploads/${uniqueName}`

    return NextResponse.json({ url, name: file.name, size: file.size }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
