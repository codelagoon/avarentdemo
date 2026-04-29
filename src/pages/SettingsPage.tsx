import { useState } from "react"
import { Settings, Shield, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Save, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { DAILY_STATS } from "@/data/mockData"

interface ToggleSetting {
  id: string
  label: string
  description: string
  value: boolean
  critical?: boolean
}

function SettingToggle({ setting, onChange }: { setting: ToggleSetting; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex-1 pr-6">
        <div className="flex items-center gap-1.5">
          <Label htmlFor={setting.id} className="cursor-pointer text-sm font-medium text-foreground">
            {setting.label}
          </Label>
          {setting.critical && (
            <Badge variant="outline" className="border-destructive/30 text-[0.6rem] text-destructive">
              Critical
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-[0.65rem] text-muted-foreground">{setting.description}</p>
      </div>
      <Switch
        id={setting.id}
        checked={setting.value}
        onCheckedChange={onChange}
        data-testid={`setting-${setting.id}`}
      />
    </div>
  )
}

function ComplianceStatusRow({ label, status, detail }: { label: string; status: "pass" | "fail" | "warn"; detail: string }) {
  return (
    <div className="flex items-center justify-between border-b py-2.5 last:border-0">
      <div className="flex items-center gap-2">
        {status === "pass" && <CheckCircle className="h-4 w-4 text-emerald-600" />}
        {status === "fail" && <AlertCircle className="h-4 w-4 text-destructive" />}
        {status === "warn" && <AlertCircle className="h-4 w-4 text-amber-500" />}
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{detail}</span>
        <span className={cn(
          "rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase",
          status === "pass" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
          status === "fail" ? "bg-destructive/10 text-destructive border-destructive/20" :
          "bg-amber-50 text-amber-700 border-amber-200"
        )}>
          {status}
        </span>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const [detection, setDetection] = useState<ToggleSetting[]>([
    { id: "proxy-scan", label: "Real-Time Proxy Variable Scanning", description: "Continuously scan incoming features for protected-class proxy correlations", value: true, critical: true },
    { id: "do-calculus", label: "Do-Calculus Causal Intervention", description: "Automatically sever identified proxy pathways using do-calculus P(Y|do(X))", value: true, critical: true },
    { id: "hash-chain", label: "SHA-256 Hash-Chain Ledger Signing", description: "Cryptographically sign each decision event into the immutable ledger", value: true, critical: true },
    { id: "three-strike", label: "3-Strike Attack Detection", description: "Detect and block sequential multi-proxy adversarial attacks", value: true },
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
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Settings className="h-5 w-5 text-primary" />
            Settings & Configuration
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Sentinel system configuration — {DAILY_STATS.modelVersion} · {DAILY_STATS.cfpbCompliant ? "CFPB Compliant" : "Non-Compliant"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleReset}>
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Defaults
          </Button>
          <Button size="sm" className="gap-1.5 text-xs" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" />
            Save Configuration
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Left column */}
          <div className="col-span-2 space-y-5">
            {/* Detection Settings */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                  <Shield className="h-4 w-4 text-primary" />
                  Detection & Intervention Controls
                </CardTitle>
                <p className="text-[0.65rem] text-muted-foreground">
                  Core fairness enforcement — disabling critical settings may violate ECOA/HMDA requirements
                </p>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {detection.map(s => (
                    <SettingToggle key={s.id} setting={s} onChange={v => toggleDetection(s.id, v)} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reporting Settings */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Reporting & Compliance Export</CardTitle>
                <p className="text-[0.65rem] text-muted-foreground">
                  Regulatory reporting and data retention configuration
                </p>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {reporting.map(s => (
                    <SettingToggle key={s.id} setting={s} onChange={v => toggleReporting(s.id, v)} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Model Config */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Model Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1 block text-xs">Active Model Version</Label>
                    <Select value={modelVersion} onValueChange={setModelVersion}>
                      <SelectTrigger className="h-8 text-xs" data-testid="setting-model-version">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="v4.2.1">FNB-FAIR-v4.2.1 (current)</SelectItem>
                        <SelectItem value="v4.1.0">FNB-FAIR-v4.1.0 (previous)</SelectItem>
                        <SelectItem value="v4.0.3">FNB-FAIR-v4.0.3 (archived)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-0.5 text-[0.6rem] text-muted-foreground">Deployed: 2026-03-15</p>
                  </div>

                  <div>
                    <Label className="mb-1 block text-xs">Fairness Threshold (DI Ratio Min.)</Label>
                    <Input
                      value={fairnessThreshold}
                      onChange={e => setFairnessThreshold(e.target.value)}
                      className="h-8 font-mono text-xs"
                      data-testid="setting-fairness-threshold"
                    />
                    <p className="mt-0.5 text-[0.6rem] text-muted-foreground">CFPB minimum: 0.80</p>
                  </div>

                  <div>
                    <Label className="mb-1 block text-xs">Alert Notification Email</Label>
                    <Input
                      value={alertEmail}
                      onChange={e => setAlertEmail(e.target.value)}
                      className="h-8 text-xs"
                      data-testid="setting-alert-email"
                    />
                  </div>

                  <div>
                    <Label className="mb-1 block text-xs">Ledger Retention (years)</Label>
                    <Select value={retentionPeriod} onValueChange={setRetentionPeriod}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 years</SelectItem>
                        <SelectItem value="5">5 years</SelectItem>
                        <SelectItem value="7">7 years (OCC req.)</SelectItem>
                        <SelectItem value="10">10 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Compliance Status */}
          <div className="space-y-5">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Compliance Status</CardTitle>
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-xs text-emerald-700">
                    All Systems Go
                  </Badge>
                </div>
                <p className="text-[0.65rem] text-muted-foreground">
                  Live regulatory compliance checks
                </p>
              </CardHeader>
              <CardContent>
                <ComplianceStatusRow label="ECOA / Reg B" status="pass" detail="DI Ratio ≥ 0.80" />
                <ComplianceStatusRow label="HMDA / Reg C" status="pass" detail="LAR filed 2026-Q1" />
                <ComplianceStatusRow label="CFPB 4/5ths Rule" status="pass" detail="Min DI: 0.91" />
                <ComplianceStatusRow label="OCC Model Risk" status="pass" detail="MRM-2025-07" />
                <ComplianceStatusRow label="SR 11-7 Guidance" status="pass" detail="Validated" />
                <ComplianceStatusRow label="FRB Consumer Prot." status="pass" detail="Annual review" />
                <ComplianceStatusRow label="BSA / AML Integration" status="warn" detail="Update due Q3" />
                <ComplianceStatusRow label="State CRA (CA/NY)" status="pass" detail="Current" />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: "Sentinel Version", value: "2.4.1" },
                    { label: "Model Engine", value: DAILY_STATS.modelVersion },
                    { label: "Database", value: "PostgreSQL 16.2" },
                    { label: "Last Audit", value: "2026-04-29 06:00 UTC" },
                    { label: "Uptime", value: "99.97% (30d)" },
                    { label: "API Latency", value: "42ms avg" },
                    { label: "Ledger Entries", value: "127,384" },
                    { label: "Proofs Signed", value: "119,201" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-[0.65rem] text-muted-foreground">{item.label}</span>
                      <span className="font-mono text-[0.65rem] font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-primary/20">
              <CardContent className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Regulatory Contact</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[0.65rem] text-muted-foreground">OCC Examiner: Thomas B. Okafor</p>
                  <p className="text-[0.65rem] text-muted-foreground">CFPB Contact: fairlending@cfpb.gov</p>
                  <p className="text-[0.65rem] text-muted-foreground">Internal Counsel: legal@firstnationalbank.com</p>
                </div>
                <Separator className="my-2" />
                <p className="text-[0.6rem] text-muted-foreground/60">
                  Next scheduled OCC examination: 2026-07-15
                </p>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center pt-4">
              <Badge
                variant="outline"
                className="border-primary/30 bg-accent/60 text-xs font-semibold uppercase tracking-wider text-primary"
              >
                CFPB Compliant
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
