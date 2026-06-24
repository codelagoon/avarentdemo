import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// We use the service role key to bypass RLS since this is a server-to-server API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
  try {
    // Basic authentication (in production, validate a proper Bearer token)
    const authHeader = req.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    // For this prototype, we'll assume the Bearer token is the company_id
    const companyId = authHeader.replace("Bearer ", "").trim()

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

    // Insert the decision event
    const { data, error } = await supabase
      .from("decision_events")
      .insert({
        company_id: companyId,
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
      })
      .select("id")
      .single()

    if (error) {
      console.error("Database error inserting decision event:", error)
      return NextResponse.json({ error: "Failed to persist decision event" }, { status: 500 })
    }

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
