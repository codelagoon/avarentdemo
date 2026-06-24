import { NextResponse } from "next/server"
import { isWorkOSConfigured } from "@/lib/workos/env"

/** Public auth configuration — client uses this instead of guessing from partial env. */
export async function GET() {
  return NextResponse.json({ workos_enabled: isWorkOSConfigured() })
}
