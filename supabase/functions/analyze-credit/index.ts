// Supabase Edge Function for AI credit analysis
// Proxies requests to OpenRouter and NVIDIA NIM to avoid CORS issues

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// API keys from environment variables
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || ""
const NVIDIA_API_KEY = Deno.env.get("NVIDIA_API_KEY") || ""

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"

// Free models on OpenRouter
const OPENROUTER_FREE_MODELS = [
  "google/gemma-2-9b-it:free",
  "microsoft/phi-3-mini-4k-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "gryphe/mythomist-7b:free",
]

interface CreditApplication {
  applicantName: string
  applicantId: string
  age: number
  income: number
  creditScore: number
  loanAmount: number
  loanType: string
  employmentYears: number
  zipCode: string
  debtToIncomeRatio?: number
}

function buildPrompt(app: CreditApplication): string {
  return `Credit Application Analysis:

Applicant: ${app.applicantName} (ID: ${app.applicantId})
Age: ${app.age}
Annual Income: $${app.income.toLocaleString()}
Credit Score: ${app.creditScore}
Loan Amount: $${app.loanAmount.toLocaleString()}
Loan Type: ${app.loanType}
Employment: ${app.employmentYears} years
Zip Code: ${app.zipCode}
${app.debtToIncomeRatio ? `Debt-to-Income: ${(app.debtToIncomeRatio * 100).toFixed(1)}%` : ""}

Please analyze this application and provide a credit decision ensuring fair lending compliance (no bias based on zip code, demographics, or other protected characteristics).

Respond in JSON format:
{
  "decision": "approved" | "denied" | "under_review",
  "confidence": 0.0-1.0,
  "reasoning": "explanation of decision with specific factors",
  "fairnessScore": 0.0-1.0,
  "riskFactors": ["factor1", "factor2"]
}`
}

async function callOpenRouter(app: CreditApplication, apiKey: string): Promise<Response | null> {
  const prompt = buildPrompt(app)

  for (const model of OPENROUTER_FREE_MODELS) {
    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://avarent-meridian.app",
          "X-Title": "AVARENT Meridian",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "You are a fair lending credit decision AI. Analyze applicant data and provide decisions in JSON format with: decision (approved/denied/under_review), confidence (0-1), reasoning, fairnessScore (0-1), riskFactors (array). Consider credit score, income, DTI, employment stability, and fair lending compliance.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 500,
        }),
      })

      if (response.ok) {
        return response
      }
    } catch (e) {
      console.log(`OpenRouter model ${model} failed:`, e)
    }
  }

  return null
}

async function callNVIDIA(app: CreditApplication, apiKey: string): Promise<Response | null> {
  const prompt = buildPrompt(app)

  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          {
            role: "system",
            content: "You are a fair lending credit decision AI. Analyze applicant data and provide decisions in JSON format with: decision (approved/denied/under_review), confidence (0-1), reasoning, fairnessScore (0-1), riskFactors (array).",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    })

    return response.ok ? response : null
  } catch (e) {
    console.log("NVIDIA call failed:", e)
    return null
  }
}

function localFallbackDecision(app: CreditApplication) {
  let score = 0
  score += ((app.creditScore - 300) / 550) * 0.4
  score += Math.min(app.income / 150000, 1) * 0.25
  score += Math.min(app.employmentYears / 10, 1) * 0.15
  if (app.debtToIncomeRatio) score -= app.debtToIncomeRatio * 0.2

  score = Math.max(0, Math.min(1, score))

  const decision = score > 0.75 ? "approved" : score < 0.4 ? "denied" : "under_review"

  return {
    decision,
    confidence: 0.6 + (score * 0.3),
    reasoning: `Local model: Credit score ${app.creditScore}, Income $${app.income.toLocaleString()}`,
    fairnessScore: score,
    riskFactors: score < 0.5 ? ["Low credit score", "High debt-to-income"] : [],
    modelUsed: "Local Rule-Based Fallback",
    provider: "local",
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }

  try {
    const app: CreditApplication = await req.json()

    // Try OpenRouter first (free models)
    let response = await callOpenRouter(app, OPENROUTER_API_KEY)
    let provider = "openrouter"

    // Fallback to NVIDIA
    if (!response && NVIDIA_API_KEY) {
      response = await callNVIDIA(app, NVIDIA_API_KEY)
      provider = "nvidia"
    }

    // Final fallback to local
    if (!response) {
      const result = localFallbackDecision(app)
      return new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    let result: any
    try {
      result = JSON.parse(content)
    } catch {
      // Extract from text if not valid JSON
      const decision = content?.toLowerCase().includes("approve") ? "approved" : 
                       content?.toLowerCase().includes("deny") ? "denied" : "under_review"
      result = {
        decision,
        confidence: 0.75,
        reasoning: content?.substring(0, 200) || "AI analysis completed",
        fairnessScore: 0.8,
        riskFactors: [],
      }
    }

    return new Response(
      JSON.stringify({
        ...result,
        provider,
        modelUsed: provider === "openrouter" ? "OpenRouter Free Model" : "Llama 3.1 8B",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message,
        decision: "under_review",
        confidence: 0.5,
        reasoning: "Error processing request",
        fairnessScore: 0.5,
        riskFactors: ["Processing error"],
        provider: "error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
})
