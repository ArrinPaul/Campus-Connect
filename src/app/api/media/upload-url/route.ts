import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 100 * 1024 * 1024
const MAX_FILE_SIZE = 25 * 1024 * 1024

// POST /api/media/upload-url
// Returns a pre-signed URL for direct binary upload to Supabase Storage
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const rawFilename = body.filename || body.fileName || `upload-${Date.now()}`
    const bucket = body.bucket === "avatars" ? "avatars" : "media"
    const fileSize = Number(body.fileSize || 0)
    const fileType = String(body.fileType || body.contentType || "")

    // Validate size limit based on bucket/type
    if (bucket === "avatars" && fileSize > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Avatar image exceeds 5MB limit" }, { status: 400 })
    }
    if (fileType.startsWith("video/") && fileSize > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: "Video exceeds 100MB limit" }, { status: 400 })
    }
    if (fileType.startsWith("image/") && fileSize > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image exceeds 10MB limit" }, { status: 400 })
    }
    if (fileSize > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: "File size exceeds maximum allowed limit" }, { status: 400 })
    }

    // Sanitize filename to alphanumeric and extension only
    const sanitizedFilename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, "_")
    const path = `${userId}/${Date.now()}-${sanitizedFilename}`

    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path)
    if (error) throw error

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path)

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      publicUrl: publicData.publicUrl,
      path,
      storageId: path,
    })
  } catch (err) {
    return internalError(err)
  }
}
