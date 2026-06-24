import { getSignInUrl } from "@workos-inc/authkit-nextjs"
import { NextRequest, NextResponse } from "next/server"
import { isWorkOSConfigured } from "@/lib/workos/env"

export async function GET(request: NextRequest) {
  if (!isWorkOSConfigured()) {
    return NextResponse.json(
      { error: "WorkOS is not configured" },
      { status: 503 }
    )
  }

  const screenHint = request.nextUrl.searchParams.get("screen_hint")
  const signInUrl = await getSignInUrl({
    ...(screenHint === "sign-up" ? { screenHint: "sign-up" as const } : {}),
  })

  return NextResponse.redirect(signInUrl)
}
