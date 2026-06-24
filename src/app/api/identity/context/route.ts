import { NextResponse } from "next/server"
import { resolveApplicationContext } from "@/lib/identity/resolve-context"

/** Returns the resolved identity context (including unauthenticated empty state). */
export async function GET() {
  const context = await resolveApplicationContext()
  return NextResponse.json(context)
}
