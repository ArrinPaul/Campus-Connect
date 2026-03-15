import { NextResponse } from "next/server"

const notImplemented = () =>
  NextResponse.json(
    {
      error: "Not implemented",
      message: "Endpoint scaffolded during backend migration. Implement business logic as needed.",
    },
    { status: 501 }
  )

export async function GET() {
  return notImplemented()
}

export async function POST() {
  return notImplemented()
}

export async function PATCH() {
  return notImplemented()
}

export async function DELETE() {
  return notImplemented()
}