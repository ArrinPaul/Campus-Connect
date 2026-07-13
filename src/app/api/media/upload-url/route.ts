import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"

// POST /api/media/upload-url
// Returns a pre-signed URL for direct upload to storage (Cloudinary / S3 compatible)
// Adapt this endpoint to your chosen storage provider
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { filename, bucket = 'media' } = await req.json().catch(() => ({}))
    if (!filename) return NextResponse.json({ error: "Filename required" }, { status: 400 })

    const path = `${userId}/${Date.now()}-${filename}`
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path)

    if (error) throw error

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path)

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      publicUrl: publicData.publicUrl,
      path
    })
  } catch (err) {
    return internalError(err)
  }
}
