import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { addCertification, getPortfolio, deleteCertification } from "@/server/db/misc"

// GET /api/portfolio/certifications — Fetch portfolio certifications
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    let userId = searchParams.get("userId") || searchParams.get("user_id")

    if (!userId) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id || null
    }

    if (!userId) {
      return NextResponse.json({ error: "userId parameter required" }, { status: 400 })
    }

    const portfolio = await getPortfolio(userId)
    return NextResponse.json(portfolio.certifications, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/portfolio/certifications — Add portfolio certification
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    if (!body.title || !body.issuer) {
      return NextResponse.json({ error: "Title and issuer are required" }, { status: 400 })
    }

    const cert = await addCertification(user.id, {
      title: body.title,
      issuer: body.issuer,
      date_obtained: body.date_obtained,
      credential_url: body.credential_url,
    })

    return NextResponse.json(cert, { status: 201 })
  } catch (err) {
    return internalError(err)
  }
}

// DELETE /api/portfolio/certifications — Delete portfolio certification
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const body = await req.json().catch(() => ({}))
    const certId = body.id || searchParams.get("id")

    if (!certId) {
      return NextResponse.json({ error: "Certification ID is required" }, { status: 400 })
    }

    await deleteCertification(certId, user.id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}