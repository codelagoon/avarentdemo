export const BANK_NAME = "First National Bank"
export const BANK_SHORT = "FNB"

export type ThreatSeverity = "critical" | "high" | "medium" | "low"
export type DecisionStatus = "approved" | "denied" | "under_review" | "escalated"
export type LedgerEventType = "decision" | "intervention" | "proof_signed" | "alert" | "audit"

export interface LedgerEntry {
  id: string
  timestamp: string
  eventType: LedgerEventType
  applicantId: string
  applicantName: string
  hash: string
  prevHash: string
  decision?: DecisionStatus
  interventionType?: string
  severity?: ThreatSeverity
  modelVersion: string
  fairnessScore: number
  message: string
  nodeCount?: number
}

export interface ThreatEvent {
  id: string
  timestamp: string
  applicantId: string
  applicantName: string
  severity: ThreatSeverity
  attackVector: string
  proxyVariables: string[]
  confidence: number
  blocked: boolean
  modelScore: number
  zipCode?: string
  description: string
  /** Linked Command Center finding (e.g. FN-204) for deep-link navigation */
  findingId?: string
  /** Feature-level label for aggregate monitoring surfaces (no PII) */
  signalLabel?: string
}

export interface EmergingRiskSignal {
  id: string
  featureName: string
  technicalTerm: string
  correlation: number
  sampleSize: number
  severity: ThreatSeverity
  description: string
  findingId?: string
  investigationId?: string
  timestamp: string
}

export interface MonitoringAlert {
  id: string
  title: string
  detail: string
  severity: ThreatSeverity
  relativeTime: string
  asOf: string
  findingId?: string
  investigationId?: string
}

export interface FairnessMetric {
  group: string
  approvalRate: number
  denialRate: number
  avgScore: number
  sampleSize: number
  disparateImpact: number
  lift: number
}

export interface UserRole {
  id: string
  name: string
  email: string
  role: string
  department: string
  lastAccess: string
  status: "active" | "inactive" | "suspended"
  mfaEnabled: boolean
  permissions: string[]
}

// Realistic SHA-256-like hashes
export const generateHash = (seed: string): string => {
  const chars = "0123456789abcdef"
  let hash = ""
  let s = seed
  for (let i = 0; i < 64; i++) {
    const idx = (s.charCodeAt(i % s.length) * (i + 7) * 31) % 16
    hash += chars[idx]
    s = hash
  }
  return hash
}

const LEDGER_ENTRIES_RAW: LedgerEntry[] = [
  {
    id: "EVT-20260429-0001",
    timestamp: "2026-04-29T14:23:11.847Z",
    eventType: "proof_signed",
    applicantId: "APP-2026-084721",
    applicantName: "Marcus T. Williams",
    hash: "a3f8c2e1d9b047563f2a8c1e4b09d7f5a3e8c2d1b047563f2a8c1e4b09d7f5a",
    prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
    decision: "approved",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.97,
    message: "Good-faith mortgage application — causal proof bundle signed",
    nodeCount: 12,
  },
  {
    id: "EVT-20260429-0002",
    timestamp: "2026-04-29T14:24:33.120Z",
    eventType: "intervention",
    applicantId: "APP-2026-084722",
    applicantName: "Darnell R. Johnson",
    hash: "b7d4e9f2c1a08347b7d4e9f2c1a08347b7d4e9f2c1a08347b7d4e9f2c1a0834",
    prevHash: "a3f8c2e1d9b047563f2a8c1e4b09d7f5a3e8c2d1b047563f2a8c1e4b09d7f5a",
    interventionType: "ZIP_CODE_PROXY_SEVERED",
    severity: "medium",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.89,
    message: "Proxy variable ZIP_CODE detected and causally severed from credit score path",
    nodeCount: 8,
  },
  {
    id: "EVT-20260429-0003",
    timestamp: "2026-04-29T14:25:09.654Z",
    eventType: "alert",
    applicantId: "APP-2026-084723",
    applicantName: "Priya K. Sharma",
    hash: "c2f1a8b309e47d65c2f1a8b309e47d65c2f1a8b309e47d65c2f1a8b309e47d6",
    prevHash: "b7d4e9f2c1a08347b7d4e9f2c1a08347b7d4e9f2c1a08347b7d4e9f2c1a0834",
    severity: "high",
    decision: "escalated",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.61,
    message: "ALERT: 3-strike proxy attack pattern — escalated to compliance review",
    nodeCount: 15,
  },
  {
    id: "EVT-20260429-0004",
    timestamp: "2026-04-29T14:26:44.221Z",
    eventType: "decision",
    applicantId: "APP-2026-084724",
    applicantName: "Robert A. Chen",
    hash: "d9e3f7c2b1a04568d9e3f7c2b1a04568d9e3f7c2b1a04568d9e3f7c2b1a0456",
    prevHash: "c2f1a8b309e47d65c2f1a8b309e47d65c2f1a8b309e47d65c2f1a8b309e47d6",
    decision: "approved",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.94,
    message: "Auto-loan application approved — causal fairness check passed",
    nodeCount: 9,
  },
  {
    id: "EVT-20260429-0005",
    timestamp: "2026-04-29T14:27:18.890Z",
    eventType: "intervention",
    applicantId: "APP-2026-084725",
    applicantName: "Latoya M. Davis",
    hash: "e1c4a7b2d9f0368e1c4a7b2d9f0368e1c4a7b2d9f0368e1c4a7b2d9f0368e1c",
    prevHash: "d9e3f7c2b1a04568d9e3f7c2b1a04568d9e3f7c2b1a04568d9e3f7c2b1a0456",
    interventionType: "NEIGHBORHOOD_PROXY_SEVERED",
    severity: "high",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.82,
    message: "Neighborhood_code linked to protected class — do-calculus intervention applied",
    nodeCount: 11,
  },
  {
    id: "EVT-20260429-0006",
    timestamp: "2026-04-29T14:28:02.341Z",
    eventType: "proof_signed",
    applicantId: "APP-2026-084726",
    applicantName: "James W. Thompson",
    hash: "f5b8d1e3c2a09476f5b8d1e3c2a09476f5b8d1e3c2a09476f5b8d1e3c2a0947",
    prevHash: "e1c4a7b2d9f0368e1c4a7b2d9f0368e1c4a7b2d9f0368e1c4a7b2d9f0368e1c",
    decision: "approved",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.96,
    message: "Small business loan — proof bundle signed, regulatory archive ready",
    nodeCount: 14,
  },
  {
    id: "EVT-20260429-0007",
    timestamp: "2026-04-29T14:28:55.712Z",
    eventType: "audit",
    applicantId: "SYS-AUDIT",
    applicantName: "System Audit",
    hash: "04a9b7c3e2f18564d04a9b7c3e2f18564d04a9b7c3e2f18564d04a9b7c3e2f1",
    prevHash: "f5b8d1e3c2a09476f5b8d1e3c2a09476f5b8d1e3c2a09476f5b8d1e3c2a0947",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 1.0,
    message: "Scheduled fairness audit — disparate impact ratio within CFPB bounds (0.89)",
    nodeCount: 0,
  },
  {
    id: "EVT-20260429-0008",
    timestamp: "2026-04-29T14:30:12.421Z",
    eventType: "decision",
    applicantId: "APP-2026-084727",
    applicantName: "Wei L. Zhang",
    hash: "a7f3e9c2b8d10457a7f3e9c2b8d10457a7f3e9c2b8d10457a7f3e9c2b8d1045",
    prevHash: "04a9b7c3e2f18564d04a9b7c3e2f18564d04a9b7c3e2f18564d04a9b7c3e2f1",
    decision: "approved",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.95,
    message: "Personal loan approved — all proxy checks passed",
    nodeCount: 10,
  },
  {
    id: "EVT-20260429-0009",
    timestamp: "2026-04-29T14:31:45.892Z",
    eventType: "intervention",
    applicantId: "APP-2026-084728",
    applicantName: "Maria J. Santos",
    hash: "c9e5b1d4f7a20863c9e5b1d4f7a20863c9e5b1d4f7a20863c9e5b1d4f7a2086",
    prevHash: "a7f3e9c2b8d10457a7f3e9c2b8d10457a7f3e9c2b8d10457a7f3e9c2b8d1045",
    interventionType: "INCOME_PROXY_SEVERED",
    severity: "medium",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.88,
    message: "Income variable flagged as proxy for protected class — severed",
    nodeCount: 9,
  },
  {
    id: "EVT-20260429-0010",
    timestamp: "2026-04-29T14:33:08.234Z",
    eventType: "proof_signed",
    applicantId: "APP-2026-084729",
    applicantName: "James R. Morrison",
    hash: "d2f8c5a1e9b40672d2f8c5a1e9b40672d2f8c5a1e9b40672d2f8c5a1e9b4067",
    prevHash: "c9e5b1d4f7a20863c9e5b1d4f7a20863c9e5b1d4f7a20863c9e5b1d4f7a2086",
    decision: "approved",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.94,
    message: "Business line of credit — causal proof signed",
    nodeCount: 11,
  },
  {
    id: "EVT-20260429-0011",
    timestamp: "2026-04-29T14:34:52.678Z",
    eventType: "alert",
    applicantId: "APP-2026-084730",
    applicantName: "Angela K. Patel",
    hash: "e4a7d3f8c1b50984e4a7d3f8c1b50984e4a7d3f8c1b50984e4a7d3f8c1b5098",
    prevHash: "d2f8c5a1e9b40672d2f8c5a1e9b40672d2f8c5a1e9b40672d2f8c5a1e9b4067",
    severity: "high",
    decision: "escalated",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.67,
    message: "Multiple proxy variables detected — application escalated for review",
    nodeCount: 14,
  },
  {
    id: "EVT-20260429-0012",
    timestamp: "2026-04-29T14:36:15.123Z",
    eventType: "decision",
    applicantId: "APP-2026-084731",
    applicantName: "Robert T. Chen",
    hash: "f6c9e2b5a8d10735f6c9e2b5a8d10735f6c9e2b5a8d10735f6c9e2b5a8d1073",
    prevHash: "e4a7d3f8c1b50984e4a7d3f8c1b50984e4a7d3f8c1b50984e4a7d3f8c1b5098",
    decision: "denied",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.45,
    message: "Application denied — insufficient credit history, no proxy factors",
    nodeCount: 8,
  },
  {
    id: "EVT-20260429-0013",
    timestamp: "2026-04-29T14:37:44.567Z",
    eventType: "intervention",
    applicantId: "APP-2026-084732",
    applicantName: "Lisa M. Anderson",
    hash: "a8e3f7c2d9b10548a8e3f7c2d9b10548a8e3f7c2d9b10548a8e3f7c2d9b1054",
    prevHash: "f6c9e2b5a8d10735f6c9e2b5a8d10735f6c9e2b5a8d10735f6c9e2b5a8d1073",
    interventionType: "ADDRESS_BLOCK_SEVERED",
    severity: "medium",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.91,
    message: "Mailing address block severed — correlated with protected class",
    nodeCount: 10,
  },
  {
    id: "EVT-20260429-0014",
    timestamp: "2026-04-29T14:39:22.891Z",
    eventType: "proof_signed",
    applicantId: "APP-2026-084733",
    applicantName: "David S. Park",
    hash: "c5b8e1d4f7a30962c5b8e1d4f7a30962c5b8e1d4f7a30962c5b8e1d4f7a3096",
    prevHash: "a8e3f7c2d9b10548a8e3f7c2d9b10548a8e3f7c2d9b10548a8e3f7c2d9b1054",
    decision: "approved",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.96,
    message: "Mortgage refinance — proof bundle signed with full causal chain",
    nodeCount: 13,
  },
  {
    id: "EVT-20260429-0015",
    timestamp: "2026-04-29T14:41:05.432Z",
    eventType: "audit",
    applicantId: "SYS-AUDIT",
    applicantName: "System Audit",
    hash: "d7f4a2c9e8b50673d7f4a2c9e8b50673d7f4a2c9e8b50673d7f4a2c9e8b5067",
    prevHash: "c5b8e1d4f7a30962c5b8e1d4f7a30962c5b8e1d4f7a30962c5b8e1d4f7a3096",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.98,
    message: "Adversarial stress test passed — all detection controls operational",
    nodeCount: 0,
  },
  {
    id: "EVT-20260429-0016",
    timestamp: "2026-04-29T14:42:38.765Z",
    eventType: "decision",
    applicantId: "APP-2026-084734",
    applicantName: "Jennifer L. Wong",
    hash: "e9c6b3f1a8d20749e9c6b3f1a8d20749e9c6b3f1a8d20749e9c6b3f1a8d2074",
    prevHash: "d7f4a2c9e8b50673d7f4a2c9e8b50673d7f4a2c9e8b50673d7f4a2c9e8b5067",
    decision: "approved",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.92,
    message: "Auto loan approved — fairness score above threshold",
    nodeCount: 9,
  },
  {
    id: "EVT-20260429-0017",
    timestamp: "2026-04-29T14:44:12.098Z",
    eventType: "intervention",
    applicantId: "APP-2026-084735",
    applicantName: "Michael R. Thompson",
    hash: "b4d7f2c5a9e30851b4d7f2c5a9e30851b4d7f2c5a9e30851b4d7f2c5a9e3085",
    prevHash: "e9c6b3f1a8d20749e9c6b3f1a8d20749e9c6b3f1a8d20749e9c6b3f1a8d2074",
    interventionType: "EMPLOYER_SEVERED",
    severity: "high",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.84,
    message: "Employer variable identified as proxy — causal intervention applied",
    nodeCount: 12,
  },
  {
    id: "EVT-20260429-0018",
    timestamp: "2026-04-29T14:45:55.321Z",
    eventType: "proof_signed",
    applicantId: "APP-2026-084736",
    applicantName: "Sarah N. Johnson",
    hash: "f8a5c1e3b7d40962f8a5c1e3b7d40962f8a5c1e3b7d40962f8a5c1e3b7d4096",
    prevHash: "b4d7f2c5a9e30851b4d7f2c5a9e30851b4d7f2c5a9e30851b4d7f2c5a9e3085",
    decision: "approved",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.97,
    message: "Home equity loan — all fairness checks passed, proof signed",
    nodeCount: 11,
  },
  {
    id: "EVT-20260429-0019",
    timestamp: "2026-04-29T14:47:28.654Z",
    eventType: "alert",
    applicantId: "APP-2026-084737",
    applicantName: "Kevin B. Martinez",
    hash: "c3e8b5f2a6d10738c3e8b5f2a6d10738c3e8b5f2a6d10738c3e8b5f2a6d1073",
    prevHash: "f8a5c1e3b7d40962f8a5c1e3b7d40962f8a5c1e3b7d40962f8a5c1e3b7d4096",
    severity: "critical",
    decision: "escalated",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.52,
    message: "Critical: Multi-vector proxy attack detected — immediate escalation",
    nodeCount: 16,
  },
  {
    id: "EVT-20260429-0020",
    timestamp: "2026-04-29T14:49:01.987Z",
    eventType: "decision",
    applicantId: "APP-2026-084738",
    applicantName: "Amanda C. Rodriguez",
    hash: "a6d4f9c1b8e30572a6d4f9c1b8e30572a6d4f9c1b8e30572a6d4f9c1b8e3057",
    prevHash: "c3e8b5f2a6d10738c3e8b5f2a6d10738c3e8b5f2a6d10738c3e8b5f2a6d1073",
    decision: "under_review",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.78,
    message: "Application under manual review — edge case fairness flags",
    nodeCount: 10,
  },
  {
    id: "EVT-20260429-0021",
    timestamp: "2026-04-29T14:50:35.420Z",
    eventType: "intervention",
    applicantId: "APP-2026-084739",
    applicantName: "Christopher L. Kim",
    hash: "e7b3a8f4c2d50961e7b3a8f4c2d50961e7b3a8f4c2d50961e7b3a8f4c2d5096",
    prevHash: "a6d4f9c1b8e30572a6d4f9c1b8e30572a6d4f9c1b8e30572a6d4f9c1b8e3057",
    interventionType: "CREDIT_BUREAU_SEVERED",
    severity: "medium",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.89,
    message: "Credit bureau correlation flagged — variable severed from decision path",
    nodeCount: 9,
  },
  {
    id: "EVT-20260429-0022",
    timestamp: "2026-04-29T14:52:18.753Z",
    eventType: "proof_signed",
    applicantId: "APP-2026-084740",
    applicantName: "Nicole R. Brown",
    hash: "d9f6c2a5e4b80734d9f6c2a5e4b80734d9f6c2a5e4b80734d9f6c2a5e4b8073",
    prevHash: "e7b3a8f4c2d50961e7b3a8f4c2d50961e7b3a8f4c2d50961e7b3a8f4c2d5096",
    decision: "approved",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.93,
    message: "Student loan consolidation — fairness verified, proof signed",
    nodeCount: 8,
  },
  {
    id: "EVT-20260429-0023",
    timestamp: "2026-04-29T14:53:52.086Z",
    eventType: "audit",
    applicantId: "SYS-AUDIT",
    applicantName: "System Audit",
    hash: "b8e5d3f7a1c60952b8e5d3f7a1c60952b8e5d3f7a1c60952b8e5d3f7a1c6095",
    prevHash: "d9f6c2a5e4b80734d9f6c2a5e4b80734d9f6c2a5e4b80734d9f6c2a5e4b8073",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.99,
    message: "Full system audit complete — all compliance checks passed",
    nodeCount: 0,
  },
  {
    id: "EVT-20260429-0024",
    timestamp: "2026-04-29T14:55:25.519Z",
    eventType: "decision",
    applicantId: "APP-2026-084741",
    applicantName: "Matthew J. Davis",
    hash: "f4c8a1e6b3d70941f4c8a1e6b3d70941f4c8a1e6b3d70941f4c8a1e6b3d7094",
    prevHash: "b8e5d3f7a1c60952b8e5d3f7a1c60952b8e5d3f7a1c60952b8e5d3f7a1c6095",
    decision: "approved",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.88,
    message: "Credit card application approved — fairness score nominal",
    nodeCount: 7,
  },
  {
    id: "EVT-20260429-0025",
    timestamp: "2026-04-29T14:57:08.852Z",
    eventType: "intervention",
    applicantId: "APP-2026-084742",
    applicantName: "Rachel S. Taylor",
    hash: "c6f3e9b2a5d10847c6f3e9b2a5d10847c6f3e9b2a5d10847c6f3e9b2a5d1084",
    prevHash: "f4c8a1e6b3d70941f4c8a1e6b3d70941f4c8a1e6b3d70941f4c8a1e6b3d7094",
    interventionType: "PHONE_PREFIX_SEVERED",
    severity: "low",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.94,
    message: "Phone prefix area code severed — weak proxy correlation detected",
    nodeCount: 6,
  },
  {
    id: "EVT-20260429-0026",
    timestamp: "2026-04-29T14:58:42.285Z",
    eventType: "proof_signed",
    applicantId: "APP-2026-084743",
    applicantName: "Daniel K. Lee",
    hash: "a2e7c5f4b9d30826a2e7c5f4b9d30826a2e7c5f4b9d30826a2e7c5f4b9d3082",
    prevHash: "c6f3e9b2a5d10847c6f3e9b2a5d10847c6f3e9b2a5d10847c6f3e9b2a5d1084",
    decision: "approved",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.96,
    message: "Construction loan — full causal documentation signed",
    nodeCount: 12,
  },
  {
    id: "EVT-20260429-0027",
    timestamp: "2026-04-29T15:00:15.718Z",
    eventType: "alert",
    applicantId: "APP-2026-084744",
    applicantName: "Stephanie M. White",
    hash: "e5b9d2f8c4a10753e5b9d2f8c4a10753e5b9d2f8c4a10753e5b9d2f8c4a1075",
    prevHash: "a2e7c5f4b9d30826a2e7c5f4b9d30826a2e7c5f4b9d30826a2e7c5f4b9d3082",
    severity: "high",
    decision: "escalated",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.63,
    message: "Sequential proxy pattern detected — escalated to senior compliance",
    nodeCount: 15,
  },
  {
    id: "EVT-20260429-0028",
    timestamp: "2026-04-29T15:01:49.151Z",
    eventType: "decision",
    applicantId: "APP-2026-084745",
    applicantName: "Andrew P. Harris",
    hash: "d3a8f6c1e7b50934d3a8f6c1e7b50934d3a8f6c1e7b50934d3a8f6c1e7b5093",
    prevHash: "e5b9d2f8c4a10753e5b9d2f8c4a10753e5b9d2f8c4a10753e5b9d2f8c4a1075",
    decision: "approved",
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.91,
    message: "Debt consolidation loan — all fairness checks cleared",
    nodeCount: 9,
  },
]

/** Audit ledger — applicant names redacted; IDs only per aggregate-only policy */
export const LEDGER_ENTRIES: LedgerEntry[] = LEDGER_ENTRIES_RAW.map((entry) => ({
  ...entry,
  applicantName: entry.applicantId === "SYS-AUDIT" ? entry.applicantName : entry.applicantId,
}))

export const THREAT_EVENTS: ThreatEvent[] = [
  {
    id: "THR-20260619-0001",
    timestamp: "2026-06-19T15:45:00Z",
    applicantId: "AGG-MORTGAGE-Q2-HL",
    applicantName: "Mortgage Q2 — Hispanic / Latino cohort",
    severity: "critical",
    attackVector: "Adverse Impact Ratio Breach",
    proxyVariables: ["approval_rate_mortgage_q2"],
    confidence: 0.91,
    blocked: false,
    modelScore: 0.78,
    findingId: "FN-204",
    signalLabel: "Mortgage approval rate — Hispanic / Latino",
    description:
      "Mortgage Adverse Impact Ratio (AIR) for Hispanic / Latino applicants at 0.78 — below 0.80 regulatory threshold",
  },
  {
    id: "THR-20260429-0001",
    timestamp: "2026-06-20T10:15:00Z",
    applicantId: "APP-2026-084723",
    applicantName: "Priya K. Sharma",
    findingId: "FN-200",
    severity: "critical",
    attackVector: "Sequential Proxy Correlation Attack",
    proxyVariables: ["zip_code_95123", "neighborhood_score", "school_district_rating"],
    confidence: 0.97,
    blocked: true,
    modelScore: 0.32,
    zipCode: "95123",
    description: "Attempted 3-strike proxy attack using ZIP code, neighborhood score, and school district rating as sequential race proxies",
  },
  {
    id: "THR-20260429-0002",
    timestamp: "2026-06-17T14:36:00Z",
    applicantId: "APP-2026-084718",
    applicantName: "DeShawn R. Brown",
    findingId: "FN-203",
    severity: "high",
    attackVector: "Single Proxy Variable",
    proxyVariables: ["credit_union_membership"],
    confidence: 0.84,
    blocked: true,
    modelScore: 0.58,
    description: "Credit union membership variable found to correlate 0.78 with protected class — proxy flag raised",
  },
  {
    id: "THR-20260429-0003",
    timestamp: "2026-06-15T09:22:00Z",
    applicantId: "APP-2026-084711",
    applicantName: "Maria E. Gonzalez",
    findingId: "FN-202",
    severity: "high",
    attackVector: "Dual Proxy Interaction",
    proxyVariables: ["first_name_entropy", "mailing_address_block"],
    confidence: 0.79,
    blocked: true,
    modelScore: 0.44,
    description: "First name entropy and mailing address block showing correlated disparate impact",
  },
  {
    id: "THR-20260429-0004",
    timestamp: "2026-06-21T08:44:00Z",
    applicantId: "AGG-FEAT-GROCERY-PROX",
    applicantName: "Grocery store proximity · n=1,842",
    severity: "medium",
    attackVector: "Indirect Feature Correlation",
    proxyVariables: ["grocery_store_proximity"],
    confidence: 0.65,
    blocked: false,
    modelScore: 0.71,
    signalLabel: "Grocery store proximity feature",
    description: "Grocery store proximity shows weak but measurable correlation with national origin — monitoring",
  },
  {
    id: "THR-20260429-0005",
    timestamp: "2026-06-13T11:30:00Z",
    applicantId: "AGG-FEAT-PAYMENT-Q3",
    applicantName: "Payment history Q3 drift · n=3,104",
    findingId: "FN-201",
    severity: "medium",
    attackVector: "Temporal Feature Drift",
    proxyVariables: ["payment_history_q3", "medical_expense_ratio"],
    confidence: 0.61,
    blocked: false,
    modelScore: 0.68,
    signalLabel: "Payment history Q3 drift",
    description: "Temporal drift detected in payment history Q3 feature — possible data quality issue",
  },
  {
    id: "THR-20260429-0006",
    timestamp: "2026-06-20T16:10:00Z",
    applicantId: "AGG-FEAT-COMMUTE-DIST",
    applicantName: "Commute distance correlation · n=982",
    severity: "low",
    attackVector: "Weak Correlation Flag",
    proxyVariables: ["commute_distance"],
    confidence: 0.42,
    blocked: false,
    modelScore: 0.83,
    signalLabel: "Commute distance feature",
    description: "Commute distance shows marginal correlation with protected class — low priority watch",
  },
  {
    id: "THR-20260429-0007",
    timestamp: "2026-06-18T07:55:00Z",
    applicantId: "AGG-FEAT-ACCOUNT-AGE",
    applicantName: "Account age feature · n=5,621",
    severity: "low",
    attackVector: "Benign Feature Noise",
    proxyVariables: ["account_age_days"],
    confidence: 0.38,
    blocked: false,
    modelScore: 0.88,
    signalLabel: "Account age days feature",
    description: "Account age feature passes fairness test — classified as benign noise below threshold",
  },
  {
    id: "THR-20260429-0008",
    timestamp: "2026-04-29T09:52:33Z",
    applicantId: "APP-2026-084679",
    applicantName: "David M. Thompson",
    severity: "high",
    attackVector: "Synthetic Identity Proxy",
    proxyVariables: ["device_fingerprint", "email_domain_age"],
    confidence: 0.86,
    blocked: true,
    modelScore: 0.39,
    description: "Synthetic identity markers correlate 0.82 with protected class membership — blocked",
  },
  {
    id: "THR-20260429-0009",
    timestamp: "2026-04-29T09:18:47Z",
    applicantId: "APP-2026-084672",
    applicantName: "Amanda L. Rodriguez",
    severity: "medium",
    attackVector: "Employment Proxy Chain",
    proxyVariables: ["employer_naics_code", "industry_risk_score"],
    confidence: 0.71,
    blocked: true,
    modelScore: 0.54,
    description: "Employment sector proxies detected — NAICS code strongly correlated with race",
  },
  {
    id: "THR-20260429-0010",
    timestamp: "2026-06-19T13:20:00Z",
    applicantId: "AGG-FEAT-UTILITY-PAY",
    applicantName: "Utility payment history · n=774",
    severity: "low",
    attackVector: "Single Variable Flag",
    proxyVariables: ["utility_payment_history"],
    confidence: 0.44,
    blocked: false,
    modelScore: 0.79,
    signalLabel: "Utility payment history feature",
    description: "Utility payment history shows marginal correlation — flagged for monitoring",
  },
  {
    id: "THR-20260429-0011",
    timestamp: "2026-06-20T10:15:00Z",
    applicantId: "APP-2026-084661",
    applicantName: "Stephanie K. Kim",
    findingId: "FN-200",
    severity: "critical",
    attackVector: "4-Layer Proxy Cascade",
    proxyVariables: ["zip_code", "census_tract", "school_rating", "commute_time"],
    confidence: 0.94,
    blocked: true,
    modelScore: 0.28,
    description: "Critical: Four-layer proxy cascade attempting to bypass fairness controls — fully blocked",
  },
  {
    id: "THR-20260429-0012",
    timestamp: "2026-06-21T09:05:00Z",
    applicantId: "AGG-FEAT-INSURANCE-HIST",
    applicantName: "Insurance history metrics · n=412",
    severity: "medium",
    attackVector: "Insurance History Proxy",
    proxyVariables: ["prior_insurance_lapse", "claims_history_score"],
    confidence: 0.68,
    blocked: false,
    modelScore: 0.62,
    signalLabel: "Insurance history metrics feature",
    description: "Insurance history metrics show moderate correlation with protected class — escalated",
  },
]

export const FAIRNESS_METRICS: FairnessMetric[] = [
  { group: "White / Non-Hispanic", approvalRate: 0.74, denialRate: 0.26, avgScore: 721, sampleSize: 14823, disparateImpact: 1.0, lift: 0 },
  { group: "Black / African American", approvalRate: 0.68, denialRate: 0.32, avgScore: 698, sampleSize: 4217, disparateImpact: 0.92, lift: 0.06 },
  { group: "Hispanic / Latino", approvalRate: 0.58, denialRate: 0.42, avgScore: 698, sampleSize: 5631, disparateImpact: 0.78, lift: 0.16 },
  { group: "Asian / Pacific Islander", approvalRate: 0.76, denialRate: 0.24, avgScore: 734, sampleSize: 3892, disparateImpact: 1.03, lift: -0.02 },
  { group: "Native American", approvalRate: 0.67, denialRate: 0.33, avgScore: 694, sampleSize: 412, disparateImpact: 0.91, lift: 0.07 },
  { group: "Two or More Races", approvalRate: 0.71, denialRate: 0.29, avgScore: 709, sampleSize: 889, disparateImpact: 0.96, lift: 0.03 },
]

/** Product-slice metrics for the active mortgage breach scenario (FN-204) */
export const MORTGAGE_FAIRNESS_METRICS: FairnessMetric[] = [
  { group: "White / Non-Hispanic", approvalRate: 0.76, denialRate: 0.24, avgScore: 728, sampleSize: 9214, disparateImpact: 1.0, lift: 0 },
  { group: "Black / African American", approvalRate: 0.69, denialRate: 0.31, avgScore: 701, sampleSize: 2103, disparateImpact: 0.91, lift: 0.07 },
  { group: "Hispanic / Latino", approvalRate: 0.59, denialRate: 0.41, avgScore: 699, sampleSize: 2847, disparateImpact: 0.78, lift: 0.17 },
  { group: "Asian / Pacific Islander", approvalRate: 0.77, denialRate: 0.23, avgScore: 736, sampleSize: 1924, disparateImpact: 1.01, lift: -0.01 },
]

export const DATA_AS_OF = "2026-06-22T15:00:00Z"

/** Maps Command Center finding IDs to linked investigation (threat event) IDs */
export const FINDING_INVESTIGATION_MAP: Record<string, string> = {
  "FN-204": "THR-20260619-0001",
  "FN-203": "THR-20260429-0002",
  "FN-202": "THR-20260429-0003",
  "FN-201": "THR-20260429-0005",
  "FN-200": "THR-20260429-0011",
}

export function getInvestigationIdForFinding(findingId: string): string | undefined {
  return FINDING_INVESTIGATION_MAP[findingId]
}

export const USER_ROLES: UserRole[] = [
  {
    id: "USR-001",
    name: "Sarah M. Chen",
    email: "s.chen@firstnationalbank.com",
    role: "Chief Compliance Officer",
    department: "Compliance & Risk",
    lastAccess: "2026-04-29T14:12:00Z",
    status: "active",
    mfaEnabled: true,
    permissions: ["read_all", "write_settings", "export_evidence", "manage_users", "admin"],
  },
  {
    id: "USR-002",
    name: "Dr. Marcus L. Rivera",
    email: "m.rivera@firstnationalbank.com",
    role: "AI Fairness Director",
    department: "Model Risk Management",
    lastAccess: "2026-04-29T13:58:00Z",
    status: "active",
    mfaEnabled: true,
    permissions: ["read_all", "write_models", "export_evidence", "configure_thresholds"],
  },
  {
    id: "USR-003",
    name: "Jennifer A. Walsh",
    email: "j.walsh@firstnationalbank.com",
    role: "Senior Model Risk Analyst",
    department: "Model Risk Management",
    lastAccess: "2026-04-29T14:05:00Z",
    status: "active",
    mfaEnabled: true,
    permissions: ["read_models", "read_ledger", "write_annotations"],
  },
  {
    id: "USR-004",
    name: "Thomas B. Okafor",
    email: "t.okafor@firstnationalbank.com",
    role: "Regulatory Examiner (OCC)",
    department: "External — OCC",
    lastAccess: "2026-04-28T09:30:00Z",
    status: "active",
    mfaEnabled: true,
    permissions: ["read_ledger", "read_reports", "export_evidence"],
  },
  {
    id: "USR-005",
    name: "Rachel D. Kim",
    email: "r.kim@firstnationalbank.com",
    role: "Internal Auditor",
    department: "Internal Audit",
    lastAccess: "2026-04-29T11:22:00Z",
    status: "active",
    mfaEnabled: true,
    permissions: ["read_all", "export_evidence", "read_access_logs"],
  },
  {
    id: "USR-006",
    name: "David P. Mbeki",
    email: "d.mbeki@firstnationalbank.com",
    role: "ML Engineer",
    department: "Technology / AI",
    lastAccess: "2026-04-29T09:14:00Z",
    status: "active",
    mfaEnabled: true,
    permissions: ["read_models", "write_models", "deploy_models"],
  },
  {
    id: "USR-007",
    name: "Amanda C. Torres",
    email: "a.torres@firstnationalbank.com",
    role: "Junior Analyst",
    department: "Compliance & Risk",
    lastAccess: "2026-04-27T16:45:00Z",
    status: "inactive",
    mfaEnabled: false,
    permissions: ["read_reports"],
  },
  {
    id: "USR-008",
    name: "Brian J. O'Connor",
    email: "b.oconnor@firstnationalbank.com",
    role: "Data Engineer",
    department: "Technology / AI",
    lastAccess: "2026-04-29T08:22:00Z",
    status: "active",
    mfaEnabled: true,
    permissions: ["read_models", "write_data_pipelines", "read_ledger"],
  },
  {
    id: "USR-009",
    name: "Elena V. Petrov",
    email: "e.petrov@firstnationalbank.com",
    role: "Compliance Analyst",
    department: "Compliance & Risk",
    lastAccess: "2026-04-29T11:45:00Z",
    status: "active",
    mfaEnabled: true,
    permissions: ["read_reports", "read_ledger", "export_evidence"],
  },
  {
    id: "USR-010",
    name: "James H. Wilson",
    email: "j.wilson@external-audit.com",
    role: "External Auditor",
    department: "External — Deloitte",
    lastAccess: "2026-04-28T14:30:00Z",
    status: "active",
    mfaEnabled: true,
    permissions: ["read_ledger", "export_evidence", "read_access_logs"],
  },
]

// Demo scenario configurations
export type DemoScenario = "good_faith" | "mild_proxy" | "bad_faith"

export interface ScenarioConfig {
  id: DemoScenario
  label: string
  description: string
  purpose?: string
  loanTypesApplicable?: string[]
  applicantName: string
  applicantId: string
  age: number
  income: number
  creditScore: number
  loanAmount: number
  loanType: string
  zipCode: string
  employmentYears: number
  proxiesDetected: number
  attackVector: string | null
  expectedOutcome: DecisionStatus
  fairnessScore: number
  interventions: string[]
  alertSeverity: ThreatSeverity | null
  graphSeveredEdges: string[]
}

export const DEMO_SCENARIOS: Record<DemoScenario, ScenarioConfig> = {
  good_faith: {
    id: "good_faith",
    label: "Clean Application",
    description: "DEMO: Normal loan application with no bias risks. Shows how the system approves qualified applicants while maintaining fairness monitoring.",
    purpose: "Demonstrates baseline fair lending decision with full SHAP explainability and audit trail.",
    loanTypesApplicable: ["mortgage", "auto", "personal", "business", "credit_card"],
    applicantName: "Marcus T. Williams",
    applicantId: "APP-2026-084721",
    age: 38,
    income: 92000,
    creditScore: 741,
    loanAmount: 285000,
    loanType: "Mortgage Loan",
    zipCode: "94102",
    employmentYears: 9,
    proxiesDetected: 0,
    attackVector: null,
    expectedOutcome: "approved",
    fairnessScore: 0.97,
    interventions: [],
    alertSeverity: null,
    graphSeveredEdges: [],
  },
  mild_proxy: {
    id: "mild_proxy",
    label: "Proxy Variable Detected",
    description: "DEMO: Single proxy variable (ZIP code) detected and automatically severed. Shows BIFSG proxy detection in action.",
    purpose: "Demonstrates automatic proxy variable detection and causal intervention using do-calculus.",
    loanTypesApplicable: ["mortgage", "auto", "personal", "business", "credit_card"],
    applicantName: "Darnell R. Johnson",
    applicantId: "APP-2026-084722",
    age: 31,
    income: 68000,
    creditScore: 698,
    loanAmount: 22500,
    loanType: "Auto Loan",
    zipCode: "48201",
    employmentYears: 5,
    proxiesDetected: 1,
    attackVector: "ZIP Code Proxy",
    expectedOutcome: "approved",
    fairnessScore: 0.89,
    interventions: ["ZIP_CODE_PROXY_SEVERED"],
    alertSeverity: "medium",
    graphSeveredEdges: ["zip_code -> credit_decision"],
  },
  bad_faith: {
    id: "bad_faith",
    label: "Multi-Proxy Attack",
    description: "DEMO: Coordinated proxy attack using 3 sequential variables. System escalates to compliance review.",
    purpose: "Demonstrates advanced threat detection, automatic escalation, and circuit breaker activation.",
    loanTypesApplicable: ["mortgage", "auto", "personal", "business", "credit_card"],
    applicantName: "Priya K. Sharma",
    applicantId: "APP-2026-084723",
    age: 44,
    income: 115000,
    creditScore: 722,
    loanAmount: 480000,
    loanType: "Jumbo Loan",
    zipCode: "95123",
    employmentYears: 14,
    proxiesDetected: 3,
    attackVector: "Sequential Proxy Correlation Attack",
    expectedOutcome: "escalated",
    fairnessScore: 0.61,
    interventions: ["ZIP_CODE_SEVERED", "NEIGHBORHOOD_SCORE_SEVERED", "SCHOOL_DISTRICT_SEVERED"],
    alertSeverity: "critical",
    graphSeveredEdges: [
      "zip_code -> risk_score",
      "neighborhood_score -> approval_gate",
      "school_district -> creditworthiness",
    ],
  },
}

export const APPROVAL_LIFT_DATA = [
  { month: "Jan 25", before: 0.58, after: 0.64 },
  { month: "Feb 25", before: 0.59, after: 0.65 },
  { month: "Mar 25", before: 0.60, after: 0.66 },
  { month: "Apr 25", before: 0.59, after: 0.67 },
  { month: "May 25", before: 0.61, after: 0.68 },
  { month: "Jun 25", before: 0.60, after: 0.69 },
  { month: "Jul 25", before: 0.62, after: 0.70 },
  { month: "Aug 25", before: 0.61, after: 0.71 },
  { month: "Sep 25", before: 0.63, after: 0.72 },
  { month: "Oct 25", before: 0.62, after: 0.73 },
  { month: "Nov 25", before: 0.64, after: 0.74 },
  { month: "Dec 25", before: 0.63, after: 0.75 },
  { month: "Jan 26", before: 0.65, after: 0.76 },
  { month: "Feb 26", before: 0.64, after: 0.77 },
  { month: "Mar 26", before: 0.66, after: 0.78 },
]

export const PROXY_DETECTION_DATA = [
  { week: "W1", blocked: 4, flagged: 6, cleared: 138 },
  { week: "W2", blocked: 5, flagged: 7, cleared: 145 },
  { week: "W3", blocked: 3, flagged: 5, cleared: 152 },
  { week: "W4", blocked: 7, flagged: 9, cleared: 158 },
  { week: "W5", blocked: 6, flagged: 8, cleared: 165 },
  { week: "W6", blocked: 8, flagged: 11, cleared: 172 },
  { week: "W7", blocked: 5, flagged: 8, cleared: 178 },
  { week: "W8", blocked: 9, flagged: 12, cleared: 185 },
  { week: "W9", blocked: 7, flagged: 10, cleared: 192 },
  { week: "W10", blocked: 11, flagged: 14, cleared: 198 },
  { week: "W11", blocked: 8, flagged: 11, cleared: 205 },
  { week: "W12", blocked: 10, flagged: 13, cleared: 212 },
  { week: "W13", blocked: 6, flagged: 9, cleared: 218 },
  { week: "W14", blocked: 12, flagged: 15, cleared: 225 },
  { week: "W15", blocked: 9, flagged: 12, cleared: 231 },
]

export const DATA_VOLUME = {
  featuresPerDecision: 82,
  featuresRange: { min: 65, max: 120 },
  featuresChange: 3,
  trainingRecords: 1200000,
  monthlyRetraining: 85000,
  causalDiscoveryObservations: 250000,
}

export const DAILY_STATS = {
  modelsInProduction: 8,
  auditsLast24h: 47,
  fairnessScore: 0.923,
  openIncidents: 3,
  dataPointsPerDecision: 82,
  systemHealth: "nominal",
  modelVersion: "FNB-FAIR-v4.2.1",
  lastAudit: "2026-04-29T06:00:00Z",
  cfpbCompliant: true,
}

// ─── Command Center dashboard data ───────────────────────────────────────────

export type FindingStatus = "investigating" | "review" | "monitoring" | "resolved"

export interface CommandCenterFinding {
  id: string
  category: string
  issueDescription: string
  affectedGroup: string
  severity: ThreatSeverity
  ageDays: number
  status: FindingStatus
  /** ISO timestamp aligned with ageDays and activity feed */
  detectedAt: string
  /** Linked investigation (threat event) for deep-link navigation */
  investigationId: string
}

export type WorkflowStepStatus = "completed" | "active" | "queued" | "pending"

export interface WorkflowStep {
  id: string
  label: string
  status: WorkflowStepStatus
  progress?: number
}

export interface WorkflowActivity {
  title: string
  recordCount: number
  etaMinutes: number
  steps: WorkflowStep[]
}

export interface DisparityTrendPoint {
  day: string
  mortgage: number
  auto: number
  personal: number
  creditCard: number
}

export interface MonitoringSignal {
  id: string
  metricName: string
  technicalTerm: string
  value: number
  trend: "up" | "down" | "flat"
  severity: ThreatSeverity
}

export interface ExamReadinessCategory {
  id: string
  label: string
  percentage: number
  status: string
}

export type ActivityFeedCategory = "finding" | "analysis" | "investigation" | "audit"

export interface ActivityFeedItem {
  id: string
  category: ActivityFeedCategory
  description: string
  severity?: ThreatSeverity
  referenceId: string
  timestamp: string
}

export interface FairnessMetricReading {
  technicalTerm: string
  plainLabel: string
  value: number
  threshold: number
  thresholdStatus: string
  passing: boolean
}

export interface TopBreachMetric {
  plainLabel: string
  technicalTerm: string
  value: number
  context: string
  thresholdStatus: string
}

export interface CommandCenterKpis {
  adverseImpactRatio: FairnessMetricReading
  statisticalParityDifference: FairnessMetricReading
  topBreachMetric: TopBreachMetric
  postureSummary: string
  examReadiness: number
  examLabel: string
  examTrend: string
  activeFindings: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
    trend: string
  }
  investigations: {
    total: number
    open: number
    inReview: number
    resolved: number
    trend: string
  }
  modelsMonitored: {
    active: number
    total: number
    trend: string
  }
}

export const COMMAND_CENTER_KPIS: CommandCenterKpis = {
  adverseImpactRatio: {
    technicalTerm: "AIR",
    plainLabel: "Adverse Impact Ratio",
    value: 0.78,
    threshold: 0.8,
    thresholdStatus: "below 0.80 threshold",
    passing: false,
  },
  statisticalParityDifference: {
    technicalTerm: "SPD",
    plainLabel: "Statistical Parity Difference",
    value: 0.11,
    threshold: 0.1,
    thresholdStatus: "above 0.10 threshold",
    passing: false,
  },
  topBreachMetric: {
    plainLabel: "Approval Rate Disparity",
    technicalTerm: "Adverse Impact Ratio",
    value: 0.78,
    context: "Hispanic / Latino — Mortgage",
    thresholdStatus: "below 0.80 threshold",
  },
  postureSummary:
    "2 critical findings need immediate review; mortgage AIR breach is the top priority.",
  examReadiness: 94,
  examLabel: "Strong",
  examTrend: "↑ 8% vs last month",
  activeFindings: {
    total: 7,
    critical: 2,
    high: 5,
    medium: 0,
    low: 0,
    trend: "↑ 2 new this week",
  },
  investigations: {
    total: 4,
    open: 2,
    inReview: 2,
    resolved: 0,
    trend: "Avg. age: 4.2 days",
  },
  modelsMonitored: {
    active: DAILY_STATS.modelsInProduction,
    total: 12,
    trend: "↑ 2 new this month",
  },
}

export const COMMAND_CENTER_FINDINGS: CommandCenterFinding[] = [
  {
    id: "FN-204",
    category: "Mortgage",
    issueDescription: "Approval Rate Disparity",
    affectedGroup: "Hispanic / Latino",
    severity: "critical",
    ageDays: 3,
    status: "investigating",
    detectedAt: "2026-06-19T15:45:00Z",
    investigationId: "THR-20260619-0001",
  },
  {
    id: "FN-203",
    category: "Auto",
    issueDescription: "Disparate Impact Ratio",
    affectedGroup: "Black / African American",
    severity: "high",
    ageDays: 5,
    status: "review",
    detectedAt: "2026-06-17T14:36:00Z",
    investigationId: "THR-20260429-0002",
  },
  {
    id: "FN-202",
    category: "Personal",
    issueDescription: "Score Distribution Gap",
    affectedGroup: "Native American",
    severity: "high",
    ageDays: 7,
    status: "investigating",
    detectedAt: "2026-06-15T09:22:00Z",
    investigationId: "THR-20260429-0003",
  },
  {
    id: "FN-201",
    category: "Credit Card",
    issueDescription: "Denial Rate Variance",
    affectedGroup: "Two or More Races",
    severity: "medium",
    ageDays: 9,
    status: "monitoring",
    detectedAt: "2026-06-13T11:30:00Z",
    investigationId: "THR-20260429-0005",
  },
  {
    id: "FN-200",
    category: "Mortgage",
    issueDescription: "Proxy Variable Correlation",
    affectedGroup: "Hispanic / Latino",
    severity: "critical",
    ageDays: 2,
    status: "investigating",
    detectedAt: "2026-06-20T10:15:00Z",
    investigationId: "THR-20260429-0011",
  },
]

export const COMMAND_CENTER_WORKFLOW: WorkflowActivity = {
  title: "Mortgage Q2 2025",
  recordCount: 82421,
  etaMinutes: 2,
  steps: [
    { id: "import", label: "Import", status: "completed" },
    { id: "validate", label: "Validate", status: "completed" },
    { id: "analyze", label: "Analyze", status: "active", progress: 78 },
    { id: "generate", label: "Generate", status: "queued" },
    { id: "findings", label: "Findings", status: "pending" },
  ],
}

const generateDisparityTrend = (): DisparityTrendPoint[] => {
  const points: DisparityTrendPoint[] = []
  const baseMortgage = FAIRNESS_METRICS[2].disparateImpact
  const baseAuto = FAIRNESS_METRICS[1].disparateImpact
  const basePersonal = FAIRNESS_METRICS[4].disparateImpact
  const baseCredit = FAIRNESS_METRICS[3].disparateImpact

  for (let i = 29; i >= 0; i--) {
    const drift = (29 - i) * 0.002
    const noise = Math.sin(i * 0.7) * 0.015
    points.push({
      day: `D${30 - i}`,
      mortgage: Number((baseMortgage - drift + noise).toFixed(3)),
      auto: Number((baseAuto - drift * 0.8 + noise * 0.6).toFixed(3)),
      personal: Number((basePersonal - drift * 0.5 + noise * 0.4).toFixed(3)),
      creditCard: Number((baseCredit + drift * 0.3 + noise * 0.3).toFixed(3)),
    })
  }
  return points
}

export const DISPARITY_TREND_30D = generateDisparityTrend()

export const MONITORING_SEVERITY_COUNTS = {
  critical: THREAT_EVENTS.filter((t) => t.severity === "critical").length,
  high: THREAT_EVENTS.filter((t) => t.severity === "high").length,
  medium: THREAT_EVENTS.filter((t) => t.severity === "medium").length,
  low: THREAT_EVENTS.filter((t) => t.severity === "low").length,
}

export const MONITORING_SIGNALS: MonitoringSignal[] = [
  {
    id: "sig-1",
    metricName: "Adverse Impact Ratio – Hispanic / Latino (Mortgage)",
    technicalTerm: "AIR (Adverse Impact Ratio)",
    value: 0.78,
    trend: "down",
    severity: "critical",
  },
  {
    id: "sig-2",
    metricName: "Denial Rate – Black / African American",
    technicalTerm: "DIR (Disparate Impact Ratio)",
    value: 0.92,
    trend: "down",
    severity: "high",
  },
  {
    id: "sig-3",
    metricName: "Score Gap – Native American",
    technicalTerm: "Δ Score Distribution",
    value: 0.18,
    trend: "up",
    severity: "medium",
  },
  {
    id: "sig-4",
    metricName: "Proxy Correlation – ZIP Code",
    technicalTerm: "Pearson r (proxy variable)",
    value: 0.74,
    trend: "flat",
    severity: "medium",
  },
]

export const MONITORING_ALERTS: MonitoringAlert[] = [
  {
    id: "alert-3",
    title: "AIR below floor",
    detail: "Hispanic / Latino AIR at 0.78 — below 0.80 threshold (Mortgage Q2)",
    severity: "critical",
    relativeTime: "3d",
    asOf: DATA_AS_OF,
    findingId: "FN-204",
    investigationId: "THR-20260619-0001",
  },
  {
    id: "alert-1",
    title: "Proxy variable detected",
    detail: "ZIP code flagged as disparate impact proxy",
    severity: "high",
    relativeTime: "2m",
    asOf: DATA_AS_OF,
    findingId: "FN-200",
    investigationId: "THR-20260429-0011",
  },
  {
    id: "alert-2",
    title: "Fairwashing blocked",
    detail: "Explanation discrepancy (Kolmogorov-Smirnov = 0.41)",
    severity: "medium",
    relativeTime: "14m",
    asOf: DATA_AS_OF,
  },
]

/** Feature-level aggregate signals for emerging risks (no applicant PII) */
export const EMERGING_RISK_SIGNALS: EmergingRiskSignal[] = THREAT_EVENTS.filter(
  (t) => !t.blocked && t.signalLabel
).map((t) => ({
  id: t.id,
  featureName: t.signalLabel ?? t.applicantName,
  technicalTerm: t.attackVector,
  correlation: t.confidence,
  sampleSize: t.applicantId.startsWith("AGG-")
    ? Number.parseInt(t.applicantName.match(/n=([\d,]+)/)?.[1]?.replace(/,/g, "") ?? "0", 10)
    : 0,
  severity: t.severity,
  description: t.description,
  findingId: t.findingId,
  investigationId: t.id,
  timestamp: t.timestamp,
}))

export const EXAM_READINESS_CATEGORIES: ExamReadinessCategory[] = [
  { id: "doc", label: "Documentation Coverage", percentage: 96, status: "Complete" },
  { id: "evidence", label: "Evidence Integrity", percentage: 98, status: "Strong" },
  { id: "policy", label: "Policy Alignment", percentage: 91, status: "Good" },
  { id: "monitoring", label: "Monitoring Coverage", percentage: 95, status: "Strong" },
]

export const MODEL_SPARKLINE_DATA = PROXY_DETECTION_DATA.map((d) => ({
  week: d.week,
  value: d.cleared,
}))

export const COMMAND_CENTER_ACTIVITY: ActivityFeedItem[] = [
  {
    id: "act-1",
    category: "finding",
    description: "New finding detected — approval rate disparity",
    severity: "critical",
    referenceId: "FN-204",
    timestamp: "2026-06-19T15:45:00Z",
  },
  {
    id: "act-2",
    category: "analysis",
    description: "Statistical analysis completed for Mortgage Q2",
    referenceId: LEDGER_ENTRIES[6].id,
    timestamp: "2026-06-22T15:30:00Z",
  },
  {
    id: "act-3",
    category: "investigation",
    description: "Investigation opened for proxy cascade",
    severity: "high",
    referenceId: "THR-20260429-0011",
    timestamp: "2026-06-20T10:15:00Z",
  },
  {
    id: "act-4",
    category: "audit",
    description: "Scheduled fairness audit passed",
    referenceId: LEDGER_ENTRIES[22].id,
    timestamp: "2026-06-22T14:53:00Z",
  },
  {
    id: "act-5",
    category: "finding",
    description: "Finding escalated to compliance review",
    severity: "high",
    referenceId: "FN-203",
    timestamp: "2026-06-17T14:36:00Z",
  },
]

/** Ledger rows linked to an investigation — by applicant/cohort ID or activity references. */
export function getLedgerEvidenceForThreat(threat: ThreatEvent): LedgerEntry[] {
  const ids = new Set<string>()

  for (const entry of LEDGER_ENTRIES) {
    if (entry.applicantId === threat.applicantId) ids.add(entry.id)
  }

  for (const activity of COMMAND_CENTER_ACTIVITY) {
    const matchesThreat =
      activity.referenceId === threat.id || activity.referenceId === threat.findingId
    if (matchesThreat && activity.referenceId.startsWith("EVT-")) {
      ids.add(activity.referenceId)
    }
  }

  if (threat.findingId === "FN-204") {
    for (const activity of COMMAND_CENTER_ACTIVITY) {
      if (activity.category === "analysis" && activity.referenceId.startsWith("EVT-")) {
        ids.add(activity.referenceId)
      }
    }
  }

  return [...ids]
    .map((id) => LEDGER_ENTRIES.find((e) => e.id === id))
    .filter((e): e is LedgerEntry => Boolean(e))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 4)
}
