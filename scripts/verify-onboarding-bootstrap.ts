/**
 * Verifies admin onboarding bootstrap against the configured Supabase project.
 * Run: npx tsx --env-file=.env.local scripts/verify-onboarding-bootstrap.ts
 */
import { createOrganizationAsAdmin, createMembershipAsAdmin } from "../src/domains/identity/membershipDomain"
import { seedWorkflowDataIfEmptyAsAdmin } from "../src/domains/workflows/supabaseWorkflowRepository"
import { THREAT_EVENTS, LEDGER_ENTRIES } from "../src/data/mockData"

const testUserId = process.env.ONBOARDING_TEST_USER_ID
if (!testUserId) {
  console.error("Set ONBOARDING_TEST_USER_ID to an auth.users id without org membership")
  process.exit(1)
}

const orgName = `Bootstrap Test ${Date.now()}`

try {
  const organization = await createOrganizationAsAdmin({
    name: orgName,
    created_by: testUserId,
    primary_use_case: "mortgage",
    compliance_needs: ["fair_lending"],
  })

  const membership = await createMembershipAsAdmin({
    user_id: testUserId,
    organization_id: organization.organization_id,
    role: "ADMIN",
  })

  const seed = await seedWorkflowDataIfEmptyAsAdmin(
    organization.organization_id,
    THREAT_EVENTS.slice(0, 3),
    LEDGER_ENTRIES.slice(0, 3)
  )

  console.log(JSON.stringify({ ok: true, organization, membership, seed }, null, 2))
} catch (error) {
  console.error("Bootstrap failed:", error instanceof Error ? error.message : error)
  process.exit(1)
}
