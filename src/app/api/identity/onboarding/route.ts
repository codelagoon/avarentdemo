import { NextResponse } from "next/server"
import { ensureSupabaseUserLinked } from "@/lib/identity/resolve-context"
import {
  createMembershipAsAdmin,
  createOrganizationAsAdmin,
} from "@/domains/identity/membershipDomain"
import { THREAT_EVENTS, LEDGER_ENTRIES } from "@/data/mockData"
import { seedWorkflowDataIfEmptyAsAdmin } from "@/domains/workflows/supabaseWorkflowRepository"
import type { Company } from "@/services/companyService"
import { getPostHogClient } from "@/lib/posthog-server"

export interface OnboardingRequestBody {
  companyName: string
  shortName?: string
  email?: string
  phone?: string
  address?: string
  industry?: Company["industry"]
  size?: Company["size"]
  regulatoryBody?: Company["regulatoryBody"]
  primaryUseCase?: Company["primaryUseCase"]
  dataVolumeEstimate?: Company["dataVolumeEstimate"]
  complianceNeeds?: string[]
}

export async function POST(request: Request) {
  const context = await ensureSupabaseUserLinked()

  if (!context.user_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (context.organization_id) {
    return NextResponse.json(
      { error: "User already belongs to an organization" },
      { status: 409 }
    )
  }

  let body: OnboardingRequestBody
  try {
    body = (await request.json()) as OnboardingRequestBody
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!body.companyName?.trim()) {
    return NextResponse.json({ error: "companyName is required" }, { status: 400 })
  }

  try {
    const organization = await createOrganizationAsAdmin({
      name: body.companyName.trim(),
      short_name: body.shortName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      industry: body.industry,
      size: body.size,
      regulatory_body: body.regulatoryBody,
      primary_use_case: body.primaryUseCase,
      data_volume_estimate: body.dataVolumeEstimate,
      compliance_needs: body.complianceNeeds,
      created_by: context.user_id,
    })

    const membership = await createMembershipAsAdmin({
      user_id: context.user_id,
      organization_id: organization.organization_id,
      role: "ADMIN",
    })

    await seedWorkflowDataIfEmptyAsAdmin(
      organization.organization_id,
      THREAT_EVENTS.slice(0, 12),
      LEDGER_ENTRIES.slice(0, 12)
    )

    const posthog = getPostHogClient()
    if (posthog) {
      posthog.capture({
        distinctId: context.user_id,
        event: "organization_onboarded",
        properties: {
          organization_id: organization.organization_id,
          company_name: body.companyName.trim(),
          industry: body.industry,
          size: body.size,
          primary_use_case: body.primaryUseCase,
          regulatory_body: body.regulatoryBody,
          data_volume_estimate: body.dataVolumeEstimate,
          compliance_needs: body.complianceNeeds,
        },
      })
    }

    return NextResponse.json({
      organization,
      membership,
      context: {
        user_id: context.user_id,
        organization_id: organization.organization_id,
        organization_name: organization.name,
        role: membership.role,
        needs_onboarding: false,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Onboarding failed"
    console.error("[onboarding]", message, error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
