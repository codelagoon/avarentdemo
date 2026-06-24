/**
 * @deprecated Import from `@/lib/supabase/client` instead.
 * Retained for backward compatibility during Phase 1.5 migration.
 */
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export function getSupabaseClient() {
  return getSupabaseBrowserClient()
}
