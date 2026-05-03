// AI Model Service using OpenRouter (primary) and NVIDIA NIM (fallback)
// OpenRouter: Uses free models only
// NVIDIA NIM: Fallback for when OpenRouter is unavailable

import { toast } from "sonner"

// API Configuration - Set these in your .env file or environment variables
// VITE_OPENROUTER_API_KEY=your_key_here
// VITE_NVIDIA_API_KEY=your_key_here

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ""
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY || ""
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"

// For demo purposes, you can paste your keys here temporarily
// (Remove before committing to git)
const DEMO_OPENROUTER_KEY = "" // Paste key here for testing only
const DEMO_NVIDIA_KEY = "" // Paste key here for testing only

// Free models on OpenRouter (as of 2024)
const OPENROUTER_FREE_MODELS: Record<string, string> = {
  // Free tier models
  "google/gemma-2-9b-it:free": "Gemma 2 9B",
  "microsoft/phi-3-mini-4k-instruct:free": "Phi-3 Mini",
  "meta-llama/llama-3.1-8b-instruct:free": "Llama 3.1 8B",
  "nousresearch/hermes-3-llama-3.1-405b:free": "Hermes 3 405B",
  "gryphe/mythomist-7b:free": "MythoMist 7B",
}

// NVIDIA NIM Models
const NVIDIA_MODELS: Record<string, string> = {
  "meta/llama-3.1-8b-instruct": "Llama 3.1 8B",
  "meta/llama-3.1-70b-instruct": "Llama 3.1 70B",
  "mistralai/mistral-7b-instruct-v0.3": "Mistral 7B",
  "nvidia/nemotron-4-340b-instruct": "Nemotron 4 340B",
}

export interface ModelResponse {
  decision: "approved" | "denied" | "under_review"
  confidence: number
  reasoning: string
  fairnessScore: number
  riskFactors: string[]
  modelUsed: string
  provider: "openrouter" | "nvidia" | "local"
  latency: number
}

export interface ApplicationData {
  applicantName: string
  applicantId: string
  age: number
  income: number
  creditScore: number
  loanAmount: number
  loanType: string
  employmentYears: number
  debtToIncomeRatio?: number
  existingAccounts?: number
  zipCode: string
  employerName?: string
}

// Primary: OpenRouter with free models
async function callOpenRouter(app: ApplicationData, model: string = "google/gemma-2-9b-it:free"): Promise<ModelResponse | null> {
  const startTime = Date.now()

  const prompt = buildCreditDecisionPrompt(app)

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEMO_OPENROUTER_KEY || OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "AVARENT Sentinel",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are a fair lending credit decision AI. Analyze the applicant data and provide a credit decision with fairness considerations.

Respond in JSON format:
{
  "decision": "approved" | "denied" | "under_review",
  "confidence": 0.0-1.0,
  "reasoning": "explanation of decision with specific factors",
  "fairnessScore": 0.0-1.0,
  "riskFactors": ["factor1", "factor2"]
}

Consider:
- Credit score and history
- Income and debt-to-income ratio
- Employment stability
- Loan amount vs income
- Fair lending compliance (no bias based on protected classes)`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.warn("OpenRouter API error:", error)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return null
    }

    const result = JSON.parse(content)
    const latency = Date.now() - startTime

    return {
      decision: normalizeDecision(result.decision),
      confidence: clamp(result.confidence, 0, 1),
      reasoning: result.reasoning || "Decision based on applicant profile analysis",
      fairnessScore: clamp(result.fairnessScore, 0, 1),
      riskFactors: result.riskFactors || [],
      modelUsed: OPENROUTER_FREE_MODELS[model as keyof typeof OPENROUTER_FREE_MODELS] || model,
      provider: "openrouter",
      latency,
    }
  } catch (error) {
    console.warn("OpenRouter call failed:", error)
    return null
  }
}

// Fallback: NVIDIA NIM
async function callNVIDIA(app: ApplicationData, model: string = "meta/llama-3.1-8b-instruct"): Promise<ModelResponse | null> {
  const startTime = Date.now()

  const prompt = buildCreditDecisionPrompt(app)

  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEMO_NVIDIA_KEY || NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are a fair lending credit decision AI. Analyze applicant data and provide a decision in JSON format with: decision (approved/denied/under_review), confidence (0-1), reasoning, fairnessScore (0-1), riskFactors (array). Consider credit score, income, DTI, employment stability, and fair lending compliance.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.warn("NVIDIA API error:", error)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return null
    }

    // Try to parse JSON from the response
    let result: any
    try {
      // First try direct JSON parse
      result = JSON.parse(content)
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                       content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        // Fallback: create result from text
        result = parseTextResponse(content, app)
      }
    }

    const latency = Date.now() - startTime

    return {
      decision: normalizeDecision(result.decision),
      confidence: clamp(result.confidence, 0, 1),
      reasoning: result.reasoning || "Decision based on applicant profile",
      fairnessScore: clamp(result.fairnessScore, 0, 1),
      riskFactors: result.riskFactors || [],
      modelUsed: NVIDIA_MODELS[model as keyof typeof NVIDIA_MODELS] || model,
      provider: "nvidia",
      latency,
    }
  } catch (error) {
    console.warn("NVIDIA call failed:", error)
    return null
  }
}

// Local fallback when both APIs fail
function localFallbackDecision(app: ApplicationData): ModelResponse {
  // Simple rule-based fallback
  let score = 0

  // Credit score (40% weight)
  score += ((app.creditScore - 300) / 550) * 0.4

  // Income factor (25% weight) - normalize around 75k
  score += Math.min(app.income / 150000, 1) * 0.25

  // Employment stability (15% weight)
  score += Math.min(app.employmentYears / 10, 1) * 0.15

  // DTI penalty (20% weight)
  if (app.debtToIncomeRatio) {
    score -= app.debtToIncomeRatio * 0.2
  }

  // Loan amount vs income ratio
  const loanToIncome = app.loanAmount / app.income
  if (loanToIncome > 5) {
    score -= 0.1
  }

  score = clamp(score, 0, 1)

  let decision: "approved" | "denied" | "under_review"
  if (score > 0.75) {
    decision = "approved"
  } else if (score < 0.4) {
    decision = "denied"
  } else {
    decision = "under_review"
  }

  return {
    decision,
    confidence: 0.6 + (score * 0.3),
    reasoning: `Local model: Credit score ${app.creditScore}, Income $${app.income.toLocaleString()}, Employment ${app.employmentYears} years`,
    fairnessScore: score,
    riskFactors: score < 0.5 ? ["Low credit score", "High debt-to-income"] : [],
    modelUsed: "Local Rule-Based Fallback",
    provider: "local",
    latency: 0,
  }
}

// Main function: Try OpenRouter first, then NVIDIA, then local
export async function getAIDecision(app: ApplicationData): Promise<ModelResponse> {
  // Try OpenRouter free models first
  const openRouterModels = Object.keys(OPENROUTER_FREE_MODELS)

  for (const model of openRouterModels) {
    const result = await callOpenRouter(app, model)
    if (result) {
      toast.success(`AI Decision: ${OPENROUTER_FREE_MODELS[model]}`, {
        description: `${result.decision.toUpperCase()} (${(result.confidence * 100).toFixed(0)}% confidence)`,
      })
      return result
    }
  }

  // Fallback to NVIDIA NIM
  toast.info("OpenRouter unavailable, trying NVIDIA NIM...")

  const nvidiaModels = Object.keys(NVIDIA_MODELS)
  for (const model of nvidiaModels) {
    const result = await callNVIDIA(app, model)
    if (result) {
      toast.success(`AI Decision: ${NVIDIA_MODELS[model]}`, {
        description: `${result.decision.toUpperCase()} (${(result.confidence * 100).toFixed(0)}% confidence)`,
      })
      return result
    }
  }

  // Final fallback to local rules
  toast.warning("AI APIs unavailable, using local model", {
    description: "Check API keys in production",
  })

  return localFallbackDecision(app)
}

// Helper functions
function buildCreditDecisionPrompt(app: ApplicationData): string {
  return `Credit Application Analysis:

Applicant: ${app.applicantName} (ID: ${app.applicantId})
Age: ${app.age}
Annual Income: $${app.income.toLocaleString()}
Credit Score: ${app.creditScore}
Loan Amount: $${app.loanAmount.toLocaleString()}
Loan Type: ${app.loanType}
Employment: ${app.employmentYears} years at ${app.employerName || "Current Employer"}
Zip Code: ${app.zipCode}
${app.debtToIncomeRatio ? `Debt-to-Income: ${(app.debtToIncomeRatio * 100).toFixed(1)}%` : ""}
${app.existingAccounts ? `Existing Accounts: ${app.existingAccounts}` : ""}

Please analyze this application and provide a credit decision ensuring fair lending compliance (no bias based on zip code, demographics, or other protected characteristics).`
}

function normalizeDecision(decision: string): "approved" | "denied" | "under_review" {
  const d = decision?.toLowerCase() || ""
  if (d.includes("approve")) return "approved"
  if (d.includes("deny") || d.includes("reject")) return "denied"
  return "under_review"
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value || 0))
}

function parseTextResponse(text: string, _app: ApplicationData): any {
  // Extract decision from text if JSON parsing fails
  const lower = text.toLowerCase()

  let decision = "under_review"
  if (lower.includes("approve")) decision = "approved"
  else if (lower.includes("deny")) decision = "denied"

  // Extract confidence/fairness mentions
  const confidenceMatch = text.match(/confidence[:\s]+(\d+\.?\d*)/i)
  const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.75

  const fairnessMatch = text.match(/fairness[:\s]+(\d+\.?\d*)/i)
  const fairnessScore = fairnessMatch ? parseFloat(fairnessMatch[1]) : 0.8

  return {
    decision,
    confidence,
    reasoning: text.substring(0, 200),
    fairnessScore,
    riskFactors: [],
  }
}

// Get available models info
export function getAvailableModels() {
  return {
    primary: {
      provider: "OpenRouter",
      models: Object.entries(OPENROUTER_FREE_MODELS).map(([id, name]) => ({ id, name })),
      note: "Free tier models - no API costs",
    },
    fallback: {
      provider: "NVIDIA NIM",
      models: Object.entries(NVIDIA_MODELS).map(([id, name]) => ({ id, name })),
      note: "Fallback if OpenRouter unavailable",
    },
  }
}

// Check API health
export async function checkAPIHealth(): Promise<{ openrouter: boolean; nvidia: boolean }> {
  const results = { openrouter: false, nvidia: false }

  // Check OpenRouter (lightweight models endpoint)
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: { "Authorization": `Bearer ${DEMO_OPENROUTER_KEY || OPENROUTER_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    })
    results.openrouter = response.ok
  } catch {
    results.openrouter = false
  }

  // Check NVIDIA
  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/models`, {
      headers: { "Authorization": `Bearer ${DEMO_NVIDIA_KEY || NVIDIA_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    })
    results.nvidia = response.ok
  } catch {
    results.nvidia = false
  }

  return results
}
