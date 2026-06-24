import { useState } from "react"
import { Settings, Shield, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Save, RefreshCw, FileText, Download, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { useTheme } from "@/components/theme-provider"
import { auditPacketService } from "@/services/auditPacketService"
import { Button } from "@/components/ui/button"
import { ApiKeyDialog } from "@legacy/components/ApiKeyDialog"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { TenantApiKeyManager } from "@/components/TenantApiKeyManager"
import { TenantTeamManager } from "@/components/TenantTeamManager"
import { cn } from "@/lib/utils"
const DAILY_STATS: any = { modelVersion: "v1.0" }

interface ToggleSetting {
  id: string
  label: string
  description: string
  value: boolean
  critical?: boolean
}

function SettingToggle({ setting, onChange }: { setting: ToggleSetting; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <Label htmlFor={setting.id} className="cursor-pointer text-[0.82rem] font-medium text-foreground">
            {setting.label}
          </Label>
          {setting.critical && (
            <span className="rounded-full border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[0.58rem] font-semibold text-destructive">Critical</span>
          )}
        </div>
        <p className="mt-0.5 text-[0.68rem] text-muted-foreground">{setting.description}</p>
      </div>
      <Switch id={setting.id} checked={setting.value} onCheckedChange={onChange} data-testid={`setting-${setting.id}`} />
    </div>
  )
}

function ComplianceStatusRow({ label, status, detail }: { label: string; status: "pass" | "fail" | "warn"; detail: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/30 py-2.5 last:border-0">
      <div className="flex items-center gap-2">
        {status === "pass" && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
        {status === "fail" && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
        {status === "warn" && <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
        <span className="text-[0.82rem] font-medium text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[0.72rem] text-muted-foreground">{detail}</span>
        <span className={cn(
          "rounded-full border px-2 py-0.5 text-[0.6rem] font-bold uppercase",
          status === "pass" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
          status === "fail" ? "border-destructive/30 bg-destructive/10 text-destructive" :
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        )}>{status}</span>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [subTab, setSubTab] = useState<"detection" | "model" | "compliance" | "system" | "team">("detection")

  const [detection, setDetection] = useState<ToggleSetting[]>([
    { id: "proxy-scan", label: "Real-Time Proxy Variable Scanning", description: "Continuously scan incoming features for protected-class proxy correlations", value: true, critical: true },
    { id: "do-calculus", label: "Do-Calculus Causal Intervention", description: "Automatically severs feature pathways that function as protected class proxies", value: true, critical: true },
    { id: "hash-chain", label: "SHA-256 Hash-Chain Ledger Signing", description: "Cryptographically sign each decision event into the immutable ledger", value: true, critical: true },
    { id: "three-strike", label: "3-Strike Attack Detection", description: "Detects coordinated sequences of proxy variable manipulation attempts", value: true },
    { id: "realtime-alerts", label: "Real-Time Compliance Alerts", description: "Send immediate notifications when fairness thresholds are breached", value: true },
    { id: "auto-escalate", label: "Auto-Escalate High-Severity Threats", description: "Automatically escalate critical proxy attacks to compliance review queue", value: true },
  ])

  const [reporting, setReporting] = useState<ToggleSetting[]>([
    { id: "hmda-export", label: "Automated HMDA Export", description: "Generate HMDA LAR reports automatically on monthly cycle", value: true },
    { id: "cfpb-reporting", label: "CFPB Disparate Impact Reporting", description: "Submit quarterly disparate impact analysis to CFPB portal", value: true },
    { id: "audit-trail", label: "Full Audit Trail Retention (7yr)", description: "Retain all ledger entries and decision proofs for 7 years per OCC requirements", value: true, critical: true },
    { id: "anon-export", label: "Anonymized Export for Research", description: "Allow de-identified export of fairness metrics for internal research", value: false },
  ])

  const [modelVersion, setModelVersion] = useState("v4.2.1")
  const [fairnessThreshold, setFairnessThreshold] = useState("0.80")
  const [alertEmail, setAlertEmail] = useState("compliance@firstnationalbank.com")
  const [retentionPeriod, setRetentionPeriod] = useState("7")

  const toggleDetection = (id: string, value: boolean) => {
    setDetection(prev => prev.map(s => s.id === id ? { ...s, value } : s))
  }
  const toggleReporting = (id: string, value: boolean) => {
    setReporting(prev => prev.map(s => s.id === id ? { ...s, value } : s))
  }

  const handleSave = () => {
    toast.success("Configuration saved — changes will take effect within 30 seconds")
  }

  const handleReset = () => {
    toast.info("Configuration reset to factory defaults")
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 bg-card px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Settings className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Settings & Configuration</h1>
            <p className="text-[0.7rem] text-muted-foreground">
              {DAILY_STATS.modelVersion} · {DAILY_STATS.cfpbCompliant ? "CFPB Compliant" : "Non-Compliant"}
            </p>
          </div>
        </div>

        {/* Navigation sub-tabs inside header for maximum spacing efficiency */}
        <div className="flex rounded-lg border border-border/60 bg-muted/60 p-0.5" data-testid="settings-tabs">
          <button
            onClick={() => setSubTab("detection")}
            className={cn("rounded-md px-3 py-1 text-[0.72rem] font-semibold transition-all", subTab === "detection" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Detection & Intervention
          </button>
          <button
            onClick={() => setSubTab("model")}
            className={cn("rounded-md px-3 py-1 text-[0.72rem] font-semibold transition-all", subTab === "model" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Model Configuration
          </button>
          <button
            onClick={() => setSubTab("compliance")}
            className={cn("rounded-md px-3 py-1 text-[0.72rem] font-semibold transition-all", subTab === "compliance" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Compliance & Reports
          </button>
          <button
            onClick={() => setSubTab("team")}
            className={cn("rounded-md px-3 py-1 text-[0.72rem] font-semibold transition-all", subTab === "team" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Team & Roles
          </button>
          <button
            onClick={() => setSubTab("system")}
            className={cn("rounded-md px-3 py-1 text-[0.72rem] font-semibold transition-all", subTab === "system" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            System & Appearance
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleReset}>
            <RefreshCw className="h-3.5 w-3.5" />Reset Defaults
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs animate-none" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" />Save
          </Button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 min-h-0 p-5 bg-background flex flex-col overflow-hidden">
        {subTab === "detection" && (
          <Card className="flex-1 border-border/60 shadow-sm flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/40 px-5 py-3 shrink-0">
              <Shield className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Detection & Intervention Controls</p>
                <p className="text-[0.68rem] text-muted-foreground font-sans">Core fairness enforcement — disabling critical settings may violate ECOA/HMDA</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/40 px-5 py-2">
              {detection.map(s => <SettingToggle key={s.id} setting={s} onChange={v => toggleDetection(s.id, v)} />)}
            </div>
          </Card>
        )}

        {subTab === "model" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-0 overflow-hidden">
            <Card className="border-border/60 shadow-sm p-5 space-y-4 overflow-y-auto flex flex-col min-h-0">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5 border-b pb-2 shrink-0">
                Model Parameters
              </h2>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div>
                  <Label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">Active Model Version</Label>
                  <Select value={modelVersion} onValueChange={setModelVersion}>
                    <SelectTrigger className="h-8 text-xs font-sans animate-none" data-testid="setting-model-version"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v4.2.1">FNB-FAIR-v4.2.1 (current)</SelectItem>
                      <SelectItem value="v4.1.0">FNB-FAIR-v4.1.0 (previous)</SelectItem>
                      <SelectItem value="v4.0.3">FNB-FAIR-v4.0.3 (archived)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-[0.62rem] text-muted-foreground font-sans">Deployed: 2026-03-15</p>
                </div>
                <div>
                  <Label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">Fairness Threshold (DI Min.)</Label>
                  <Input value={fairnessThreshold} onChange={e => setFairnessThreshold(e.target.value)} className="h-8 font-mono text-xs" data-testid="setting-fairness-threshold" />
                  <p className="mt-1 text-[0.62rem] text-muted-foreground font-sans">CFPB minimum compliance floor: 0.80</p>
                </div>
                <div>
                  <Label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">Alert Notification Email</Label>
                  <Input value={alertEmail} onChange={e => setAlertEmail(e.target.value)} className="h-8 text-xs" data-testid="setting-alert-email" />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">Ledger Retention</Label>
                  <Select value={retentionPeriod} onValueChange={setRetentionPeriod}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 years</SelectItem>
                      <SelectItem value="5">5 years</SelectItem>
                      <SelectItem value="7">7 years (OCC req.)</SelectItem>
                      <SelectItem value="10">10 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="border-border/60 shadow-sm p-5 flex flex-col justify-between overflow-hidden">
              <TenantApiKeyManager />
              
              <div className="pt-4 mt-6 border-t border-border/40 shrink-0">
                <p className="text-[0.65rem] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Third-Party LLM Integrations</p>
                <ApiKeyDialog />
              </div>
            </Card>
          </div>
        )}

        {subTab === "compliance" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0 overflow-hidden">
            <Card className="lg:col-span-2 flex flex-col h-full min-h-0 border-border/60 shadow-sm overflow-hidden">
              <div className="border-b border-border/40 px-5 py-3 shrink-0">
                <p className="text-sm font-semibold text-foreground">Reporting & Compliance Export</p>
                <p className="text-[0.68rem] text-muted-foreground font-sans">Regulatory reporting and data retention configuration</p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border/40 px-5 py-2">
                {reporting.map(s => <SettingToggle key={s.id} setting={s} onChange={v => toggleReporting(s.id, v)} />)}
              </div>
            </Card>

            <div className="space-y-4 flex flex-col h-full min-h-0">
              <Card className="border-border/60 shadow-sm p-4 space-y-3 shrink-0">
                <div className="flex items-center gap-1.5 border-b pb-2">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Regulatory Contact</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[0.72rem] text-muted-foreground font-sans">OCC Examiner: Thomas B. Okafor</p>
                  <p className="text-[0.72rem] text-muted-foreground font-sans">CFPB Contact: fairlending@cfpb.gov</p>
                  <p className="text-[0.72rem] text-muted-foreground font-sans">Internal Counsel: legal@firstnationalbank.com</p>
                  <Separator className="my-1.5" />
                  <p className="text-[0.65rem] text-muted-foreground/60 font-sans">Next OCC examination scheduled: 2026-07-15</p>
                </div>
              </Card>

              <Card className="border-primary/20 bg-primary/[0.02] shadow-sm p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Regulatory Audit Package</p>
                  </div>
                  <p className="text-[0.72rem] text-muted-foreground leading-relaxed font-sans">
                    Generate a comprehensive compliance package including sealed bias logs, BIFSG proxy metrics, and ledger integrity checks.
                  </p>
                </div>
                <div>
                  <Button
                    className="w-full gap-2 text-xs h-8"
                    onClick={() => { const p = auditPacketService.generatePacket("Sarah Chen - CCO"); auditPacketService.downloadPacket(p) }}
                  >
                    <Download className="h-3.5 w-3.5" />Generate Exam Package
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {subTab === "team" && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <TenantTeamManager />
          </div>
        )}

        {subTab === "system" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0 overflow-hidden">
            <Card className="border-border/60 shadow-sm p-4 space-y-4 flex flex-col h-full overflow-y-auto">
              <div>
                <h2 className="text-sm font-semibold text-foreground border-b pb-2">Theme & Appearance</h2>
                <p className="text-[0.65rem] text-muted-foreground font-sans mt-1">Select the interface visual scheme</p>
              </div>
              <div className="grid grid-cols-1 gap-2 pt-2 font-sans">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  className="h-8 text-xs font-semibold justify-start px-3"
                  data-testid="theme-light-button"
                >
                  Light Mode
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="h-8 text-xs font-semibold justify-start px-3"
                  data-testid="theme-dark-button"
                >
                  Dark Mode
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  className="h-8 text-xs font-semibold justify-start px-3"
                  data-testid="theme-system-button"
                >
                  System Default
                </Button>
              </div>
            </Card>

            <Card className="border-border/60 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
              <div className="border-b border-border/40 px-4 py-3 shrink-0 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Compliance Status</p>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.62rem] font-semibold text-emerald-600 dark:text-emerald-400">All Pass</span>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-1 divide-y divide-border/20">
                <ComplianceStatusRow label="ECOA / Reg B" status="pass" detail="DI Ratio ≥ 0.80" />
                <ComplianceStatusRow label="HMDA / Reg C" status="pass" detail="LAR filed 2026-Q1" />
                <ComplianceStatusRow label="CFPB 4/5ths Rule" status="pass" detail="Min DI: 0.91" />
                <ComplianceStatusRow label="OCC Model Risk" status="pass" detail="MRM-2025-07" />
                <ComplianceStatusRow label="SR 11-7 Guidance" status="pass" detail="Validated" />
                <ComplianceStatusRow label="FRB Consumer Prot." status="pass" detail="Annual review" />
                <ComplianceStatusRow label="State CRA (CA/NY)" status="pass" detail="Current" />
              </div>
            </Card>

            <Card className="border-border/60 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
              <div className="border-b border-border/40 px-4 py-3 shrink-0">
                <p className="text-sm font-semibold text-foreground">System Information</p>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 px-4 py-3 font-mono">
                {[
                  { label: "Meridian Version", value: "2.4.1" },
                  { label: "Model Engine", value: DAILY_STATS.modelVersion },
                  { label: "Database", value: "PostgreSQL 16.2" },
                  { label: "Last Audit", value: "2026-04-29 06:00 UTC" },
                  { label: "Uptime", value: "99.97% (30d)" },
                  { label: "API Latency", value: "42ms avg" },
                  { label: "Ledger Entries", value: "127,384" },
                  { label: "Audits Sealed", value: "119,201" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-[0.7rem] border-b border-border/20 pb-1.5 last:border-0">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium tabular-nums text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
