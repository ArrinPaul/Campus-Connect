import { NextResponse } from "next/server"

// GET /api/health — Liveness probe
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      version: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}
