import { useState } from "react"
import { Building2, CheckCircle, ChevronRight, ChevronLeft, Shield, Users, Settings, Sparkles, FileCheck, Landmark, Briefcase, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { companyService, type Company } from "@/services/companyService"
import { toast } from "sonner"

type OnboardingStep = "welcome" | "company" | "profile" | "compliance" | "confirm" | "complete"

interface OnboardingData {
  companyName: string
  shortName: string
  email: string
  phone: string
  address: string
  industry: Company["industry"]
  size: Company["size"]
  regulatoryBody: Company["regulatoryBody"]
  primaryUseCase: Company["primaryUseCase"]
  dataVolumeEstimate: Company["dataVolumeEstimate"]
  complianceNeeds: string[]
}

const INITIAL_DATA: OnboardingData = {
  companyName: "",
  shortName: "",
  email: "",
  phone: "",
  address: "",
  industry: "banking",
  size: "medium",
  regulatoryBody: "CFPB",
  primaryUseCase: "mortgage",
  dataVolumeEstimate: "medium",
  complianceNeeds: ["fair_lending", "adverse_action", "proxy_detection"],
}

const COMPLIANCE_OPTIONS = [
  { id: "fair_lending", label: "Fair Lending (ECOA, FHA)", description: "Detect and prevent discriminatory lending practices" },
  { id: "adverse_action", label: "Adverse Action Notices", description: "Automated FCRA-compliant notifications" },
  { id: "proxy_detection", label: "Proxy Variable Detection", description: "Identify ZIP code, surname, and neighborhood proxies" },
  { id: "disparate_impact", label: "Disparate Impact Analysis", description: "Monitor approval rates across protected classes" },
  { id: "model_governance", label: "AI Model Governance", description: "Version control, bias testing, and explainability" },
  { id: "hmda_reporting", label: "HMDA Reporting", description: "Automated Home Mortgage Disclosure Act compliance" },
]

const USE_CASES = [
  { value: "mortgage", label: "Mortgage Lending", icon: Landmark },
  { value: "auto", label: "Auto Loans", icon: Briefcase },
  { value: "personal", label: "Personal Loans", icon: Users },
  { value: "business", label: "Business Lending", icon: Building2 },
  { value: "credit_cards", label: "Credit Cards", icon: BarChart3 },
  { value: "all", label: "All Products", icon: Sparkles },
]

export function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<OnboardingStep>("welcome")
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const stepProgress = {
    welcome: 0,
    company: 20,
    profile: 40,
    compliance: 60,
    confirm: 80,
    complete: 100,
  }

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const toggleCompliance = (id: string) => {
    setData(prev => ({
      ...prev,
      complianceNeeds: prev.complianceNeeds.includes(id)
        ? prev.complianceNeeds.filter(c => c !== id)
        : [...prev.complianceNeeds, id],
    }))
  }

  const handleNext = () => {
    const steps: OnboardingStep[] = ["welcome", "company", "profile", "compliance", "confirm", "complete"]
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const steps: OnboardingStep[] = ["welcome", "company", "profile", "compliance", "confirm", "complete"]
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      // Create company
      companyService.create({
        name: data.companyName,
        shortName: data.shortName || data.companyName.slice(0, 10),
        email: data.email,
        phone: data.phone,
        address: data.address,
        industry: data.industry,
        size: data.size,
        regulatoryBody: data.regulatoryBody,
        primaryUseCase: data.primaryUseCase,
        dataVolumeEstimate: data.dataVolumeEstimate,
        complianceNeeds: data.complianceNeeds,
      })

      // Mark onboarding complete
      companyService.setOnboardingComplete(true)

      toast.success(`Welcome, ${data.companyName}! Your AVARENT Meridian dashboard is ready.`)
      onComplete()
    } catch (error) {
      toast.error("Failed to complete onboarding. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Welcome Step ──────────────────────────────────────────────────────────
  if (step === "welcome") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to AVARENT Meridian</CardTitle>
            <CardDescription className="text-base mt-2">
              Fair Lending Compliance & Risk Management Platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-secondary/50 p-4">
                <Shield className="mx-auto h-6 w-6 text-primary mb-2" />
                <p className="text-sm font-medium">Proxy Detection</p>
                <p className="text-xs text-muted-foreground">Causal AI severing</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-4">
                <FileCheck className="mx-auto h-6 w-6 text-primary mb-2" />
                <p className="text-sm font-medium">Immutable Ledger</p>
                <p className="text-xs text-muted-foreground">SHA-256 audit trail</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-4">
                <BarChart3 className="mx-auto h-6 w-6 text-primary mb-2" />
                <p className="text-sm font-medium">Fairness Analytics</p>
                <p className="text-xs text-muted-foreground">Disparate impact</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-center">Get Started</h3>
              <div className="flex gap-3 justify-center">
                <Button size="lg" onClick={handleNext} className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Register New Company
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Takes 2 minutes • No credit card required • Free 30-day trial
              </p>
            </div>

            <div className="rounded-md bg-blue-50 p-4 text-sm">
              <p className="font-medium text-blue-900">Trusted by compliance teams at:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["First National Bank", "Metro Credit Union", "LendingPoint", "Acme Mortgage"].map(bank => (
                  <span key={bank} className="rounded-full bg-white px-3 py-1 text-xs text-blue-800">
                    {bank}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Company Info Step ─────────────────────────────────────────────────────
  if (step === "company") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="w-full max-w-xl shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Step 1 of 5</span>
            </div>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Enter your organization's basic details</CardDescription>
            <Progress value={stepProgress[step]} className="mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={data.companyName}
                onChange={e => updateData({ companyName: e.target.value })}
                placeholder="First National Bank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortName">Short Name / Abbreviation</Label>
              <Input
                id="shortName"
                value={data.shortName}
                onChange={e => updateData({ shortName: e.target.value })}
                placeholder="FNB"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select value={data.industry} onValueChange={(v) => updateData({ industry: v as Company["industry"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banking">Banking</SelectItem>
                    <SelectItem value="lending">Lending</SelectItem>
                    <SelectItem value="fintech">FinTech</SelectItem>
                    <SelectItem value="credit_union">Credit Union</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Company Size *</Label>
                <Select value={data.size} onValueChange={(v) => updateData({ size: v as Company["size"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (&lt; 100 employees)</SelectItem>
                    <SelectItem value="medium">Medium (100-1000)</SelectItem>
                    <SelectItem value="large">Large (1000-5000)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (5000+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleBack} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                className="flex-1 gap-1"
                onClick={handleNext}
                disabled={!data.companyName}
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Profile Step ──────────────────────────────────────────────────────────
  if (step === "profile") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="w-full max-w-xl shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Step 2 of 5</span>
            </div>
            <CardTitle>Contact & Regulatory</CardTitle>
            <CardDescription>Your compliance contact and regulatory body</CardDescription>
            <Progress value={stepProgress[step]} className="mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Compliance Email *</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={e => updateData({ email: e.target.value })}
                placeholder="compliance@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={data.phone}
                onChange={e => updateData({ phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={data.address}
                onChange={e => updateData({ address: e.target.value })}
                placeholder="123 Main St, New York, NY 10001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regulatoryBody">Primary Regulatory Body *</Label>
              <Select value={data.regulatoryBody} onValueChange={(v) => updateData({ regulatoryBody: v as Company["regulatoryBody"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CFPB">CFPB (Consumer Financial Protection Bureau)</SelectItem>
                  <SelectItem value="OCC">OCC (Office of the Comptroller)</SelectItem>
                  <SelectItem value="FDIC">FDIC</SelectItem>
                  <SelectItem value="NCUA">NCUA (Credit Unions)</SelectItem>
                  <SelectItem value="SEC">SEC</SelectItem>
                  <SelectItem value="state">State Regulator</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleBack} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                className="flex-1 gap-1"
                onClick={handleNext}
                disabled={!data.email}
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Compliance Needs Step ───────────────────────────────────────────────────
  if (step === "compliance") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Step 3 of 5</span>
            </div>
            <CardTitle>Compliance Configuration</CardTitle>
            <CardDescription>Select your primary lending products and compliance needs</CardDescription>
            <Progress value={stepProgress[step]} className="mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Primary Lending Products</Label>
              <div className="grid grid-cols-3 gap-3">
                {USE_CASES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => updateData({ primaryUseCase: value as Company["primaryUseCase"] })}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                      data.primaryUseCase === value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium text-center">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataVolume">Expected Monthly Applications</Label>
              <Select value={data.dataVolumeEstimate} onValueChange={(v) => updateData({ dataVolumeEstimate: v as Company["dataVolumeEstimate"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (&lt; 1,000/month)</SelectItem>
                  <SelectItem value="medium">Medium (1,000-10,000/month)</SelectItem>
                  <SelectItem value="high">High (10,000-100,000/month)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (100,000+/month)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Compliance Features Needed</Label>
              <div className="grid gap-3">
                {COMPLIANCE_OPTIONS.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer",
                      data.complianceNeeds.includes(option.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                    onClick={() => toggleCompliance(option.id)}
                  >
                    <Checkbox
                      checked={data.complianceNeeds.includes(option.id)}
                      onCheckedChange={() => toggleCompliance(option.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleBack} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                className="flex-1 gap-1"
                onClick={handleNext}
                disabled={data.complianceNeeds.length === 0}
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Confirm Step ──────────────────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="w-full max-w-xl shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Step 4 of 5</span>
            </div>
            <CardTitle>Review & Confirm</CardTitle>
            <CardDescription>Verify your configuration before completing setup</CardDescription>
            <Progress value={stepProgress[step]} className="mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Company</span>
                <span className="font-medium">{data.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Industry</span>
                <span className="font-medium capitalize">{data.industry.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Size</span>
                <span className="font-medium capitalize">{data.size}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Contact</span>
                <span className="font-medium">{data.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Regulator</span>
                <span className="font-medium">{data.regulatoryBody}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Primary Use Case</span>
                <span className="font-medium capitalize">{data.primaryUseCase.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Compliance Features</span>
                <span className="font-medium">{data.complianceNeeds.length} selected</span>
              </div>
            </div>

            <div className="rounded-md bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                <strong>What happens next?</strong>
              </p>
              <ul className="mt-2 text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Your dashboard will be configured for {USE_CASES.find(u => u.value === data.primaryUseCase)?.label}</li>
                <li>Sample data will be loaded for demonstration</li>
                <li>You can start running adversarial tests immediately</li>
                <li>All data persists locally in your browser</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleBack} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                className="flex-1 gap-1"
                onClick={handleComplete}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Settings className="h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
