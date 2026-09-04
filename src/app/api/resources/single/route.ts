import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getResourceById } from "@/server/db/content"

// GET /api/resources/single?id=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id") || searchParams.get("resourceId")
    if (!id) return NextResponse.json({ error: "Resource ID required" }, { status: 400 })

    const resource = await getResourceById(id)
    if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 })

    return NextResponse.json(resource)
  } catch (err) {
    return internalError(err)
  }
}
