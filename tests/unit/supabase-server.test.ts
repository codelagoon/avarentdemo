import { describe, expect, it } from "vitest"
import { hasSupabaseAuthCookie } from "@/lib/supabase/server"

describe("hasSupabaseAuthCookie", () => {
  it("detects Supabase auth session cookies", () => {
    expect(
      hasSupabaseAuthCookie([
        { name: "sb-abc-auth-token", value: "token" },
        { name: "other", value: "x" },
      ])
    ).toBe(true)
  })

  it("returns false when no auth cookie is present", () => {
    expect(hasSupabaseAuthCookie([{ name: "meridian_theme", value: "dark" }])).toBe(
      false
    )
  })
})
