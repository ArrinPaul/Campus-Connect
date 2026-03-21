import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/server"

export async function GET() {
  const { userId } = await auth()
  return NextResponse.json({ userId })
}
