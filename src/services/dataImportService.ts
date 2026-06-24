import { toast } from "sonner"
import { ledgerService } from "./ledgerService"

// Simple ID generator instead of uuid
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export type LoanType = "mortgage" | "auto" | "personal" | "business" | "credit_card" | "student" | "home_equity"

export interface ImportedApplication {
  id: string
  applicantName: string
  applicantId: string
  age: number
  income: number
  creditScore: number
  loanAmount: number
  loanType: LoanType
  loanTypeLabel: string
  zipCode: string
  employmentYears: number
  employerName?: string
  debtToIncomeRatio?: number
  existingAccounts?: number
  timestamp?: string
}

export interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors: string[]
}

// CSV Parser for application data
export function parseApplicationsCSV(csvContent: string): ImportedApplication[] {
  const lines = csvContent.trim().split("\n")
  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row")
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""))
  const applications: ImportedApplication[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Handle quoted values with commas
    const values: string[] = []
    let current = ""
    let inQuotes = false
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const getValue = (name: string): string => {
      const idx = headers.indexOf(name.toLowerCase())
      return idx >= 0 ? values[idx]?.replace(/"/g, "") || "" : ""
    }

    const loanType = getValue("loantype") || getValue("loan_type") || "personal"
    const loanTypeLabel = getLoanTypeLabel(loanType as LoanType)

    applications.push({
      id: generateId(),
      applicantName: getValue("applicantname") || getValue("applicant_name") || getValue("name") || `Applicant ${i}`,
      applicantId: getValue("applicantid") || getValue("applicant_id") || `APP-${Date.now()}-${i}`,
      age: parseInt(getValue("age"), 10) || 35,
      income: parseInt(getValue("income"), 10) || 75000,
      creditScore: parseInt(getValue("creditscore"), 10) || parseInt(getValue("credit_score"), 10) || 700,
      loanAmount: parseInt(getValue("loanamount"), 10) || parseInt(getValue("loan_amount"), 10) || 50000,
      loanType: loanType as LoanType,
      loanTypeLabel,
      zipCode: getValue("zipcode") || getValue("zip_code") || "00000",
      employmentYears: parseInt(getValue("employmentyears"), 10) || parseInt(getValue("employment_years"), 10) || 5,
      employerName: getValue("employer") || getValue("employername"),
      debtToIncomeRatio: parseFloat(getValue("dti")) || parseFloat(getValue("debt_to_income")) || 0.3,
      existingAccounts: parseInt(getValue("existingaccounts"), 10) || 0,
      timestamp: getValue("timestamp") || new Date().toISOString(),
    })
  }

  return applications
}

function getLoanTypeLabel(type: LoanType): string {
  const labels: Record<LoanType, string> = {
    mortgage: "Mortgage Loan",
    auto: "Auto Loan",
    personal: "Personal Loan",
    business: "Business Loan",
    credit_card: "Credit Card",
    student: "Student Loan",
    home_equity: "Home Equity Line",
  }
  return labels[type] || "Personal Loan"
}

// Import applications to the ledger
export async function importApplications(applications: ImportedApplication[]): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    imported: 0,
    failed: 0,
    errors: [],
  }

  for (const app of applications) {
    try {
      // Calculate a fairness score based on credit score, DTI, etc.
      const fairnessScore = calculateFairnessScore(app)

      // Add to ledger (id, timestamp, hash, prevHash auto-generated)
      await ledgerService.add({
        eventType: "decision",
        applicantId: app.applicantId,
        applicantName: app.applicantName,
        decision: fairnessScore > 0.7 ? "approved" : fairnessScore > 0.5 ? "under_review" : "denied",
        modelVersion: "IMPORTED-v1.0",
        fairnessScore,
        message: `Imported ${app.loanTypeLabel} application - $${app.loanAmount.toLocaleString()}`,
      })

      result.imported++
    } catch (error) {
      result.failed++
      result.errors.push(`Failed to import ${app.applicantName}: ${error}`)
    }
  }

  if (result.imported > 0) {
    toast.success(`Imported ${result.imported} applications`)
  }
  if (result.failed > 0) {
    toast.error(`Failed to import ${result.failed} applications`)
  }

  return result
}

// Calculate fairness score based on application data
function calculateFairnessScore(app: ImportedApplication): number {
  // Base score from credit score (300-850 range)
  let score = (app.creditScore - 300) / 550 * 0.4 // 40% weight

  // Income factor (normalize around 75k)
  score += Math.min(app.income / 150000, 1) * 0.25 // 25% weight

  // Employment stability
  score += Math.min(app.employmentYears / 10, 1) * 0.15 // 15% weight

  // DTI penalty (lower is better)
  if (app.debtToIncomeRatio) {
    score -= app.debtToIncomeRatio * 0.2 // Up to 20% penalty
  }

  // Normalize to 0-1 range
  return Math.max(0, Math.min(1, score))
}

// Export sample CSV template
export function generateSampleCSV(): string {
  const headers = [
    "applicantName",
    "applicantId",
    "age",
    "income",
    "creditScore",
    "loanAmount",
    "loanType",
    "zipCode",
    "employmentYears",
    "employerName",
    "debtToIncomeRatio",
  ].join(",")

  const sampleRows = [
    ['"John Smith","APP-2026-001",32,85000,745,250000,"mortgage","90210",8,"Tech Corp",0.28'].join(","),
    ['"Jane Doe","APP-2026-002",28,65000,720,35000,"auto","10001",5,"Finance Inc",0.32'].join(","),
    ['"Bob Johnson","APP-2026-003",45,120000,780,50000,"personal","60614",15,"Healthcare LLC",0.25'].join(","),
    ['"Alice Brown","APP-2026-004",35,95000,710,150000,"business","77001",10,"Startup Co",0.30'].join(","),
  ]

  return [headers, ...sampleRows].join("\n")
}

// Download sample template
export function downloadSampleTemplate() {
  const csv = generateSampleCSV()
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "application-import-template.csv"
  a.click()
  URL.revokeObjectURL(url)
  toast.success("Sample template downloaded")
}
