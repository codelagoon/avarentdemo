import { NextRequest, NextResponse } from "next/server"
import { authkit, handleAuthkitHeaders } from "@workos-inc/authkit-nextjs"
import { isWorkOSConfigured } from "@/lib/workos/env"

/**
 * Composable AuthKit middleware for SPA architecture.
 * Does NOT redirect unauthenticated users — login gate is client-side at `/`.
 */
export async function middleware(request: NextRequest) {
  if (!isWorkOSConfigured()) {
    return NextResponse.next()
  }

  const { headers } = await authkit(request)
  return handleAuthkitHeaders(request, headers)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
