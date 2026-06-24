import { NextResponse } from "next/server"
import { resolveApplicationContext } from "@/lib/identity/resolve-context"

export async function GET() {
  const context = await resolveApplicationContext()

  if (!context.workos_user_id && !context.user_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json(context)
}
