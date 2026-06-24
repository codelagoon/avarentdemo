import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { DecisionRepository } from "@/repositories/DecisionRepository"
import { createHash } from "crypto"
import { getPostHogClient } from "@/lib/posthog-server"

export const dynamic = "force-dynamic"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key"
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
  try {
    // API Key Authentication (replaces insecure Bearer token UUID)
    const apiKey = req.headers.get("X-API-Key") || req.headers.get("x-api-key")
    if (!apiKey) {
      return NextResponse.json({ error: "Missing X-API-Key header" }, { status: 401 })
    }

    // Hash the incoming key to match the database
    const keyHash = createHash("sha256").update(apiKey).digest("hex")

    // Lookup the key in the database using service role (bypassing RLS since the caller isn't an authenticated user yet)
    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("company_id, revoked_at")
      .eq("key_hash", keyHash)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 401 })
    }

    if (keyData.revoked_at) {
      return NextResponse.json({ error: "API Key has been revoked" }, { status: 401 })
    }

    const companyId = keyData.company_id
    
    // Asynchronously update last_used_at (fire and forget)
    supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("key_hash", keyHash).then()
    const decisionRepository = new DecisionRepository(companyId)

    // Parse the request body
    const body = await req.json()
    
    // Simple validation (you'd use zod in a real app)
    if (!body.applicant_id || !body.applicant_name || !body.outcome) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const {
      applicant_id,
      applicant_name,
      credit_score,
      income,
      loan_amount,
      debt_to_income,
      outcome,
      primary_score,
      fairness_score,
      tower,
      shap_features,
      top_reasons,
      circuit_breaker_triggered,
      latency_ms,
      model_version
    } = body

    // Insert the decision event using the repository
    const data = await decisionRepository.insert({
      applicant_id,
      applicant_name,
      credit_score,
      income,
      loan_amount,
      debt_to_income,
      outcome,
      primary_score,
      fairness_score,
      tower,
      shap_features: shap_features || [],
      top_reasons: top_reasons || [],
      circuit_breaker_triggered: circuit_breaker_triggered || false,
      latency_ms,
      model_version: model_version || "v1.0.0"
    } as any)

    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: companyId,
      event: "decision_ingested",
      properties: {
        company_id: companyId,
        outcome,
        has_circuit_breaker: circuit_breaker_triggered || false,
        model_version: model_version || "v1.0.0",
        loan_amount,
        latency_ms,
      },
    })

    return NextResponse.json({
      status: "success",
      message: "Decision event ingested successfully",
      event_id: data.id
    }, { status: 201 })

  } catch (err) {
    console.error("Error processing decision event:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
