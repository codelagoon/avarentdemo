"use client"

import { useState, type ReactNode } from "react"
import {
  Building2,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Users,
  Settings,
  Sparkles,
  FileCheck,
  Landmark,
  Briefcase,
  BarChart3,
} from "lucide-react"
import { AvarentLogo } from "@/components/AvarentLogo"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { companyService, type Company } from "@/services/companyService"

type OnboardingStep = "welcome" | "company" | "profile" | "compliance" | "confirm"

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

export interface OnboardingPageProps {
  userEmail?: string | null
  onComplete: () => void | Promise<void>
}

const COMPLIANCE_OPTIONS = [
  {
    id: "fair_lending",
    label: "Fair Lending (ECOA, FHA)",
    description: "Detect and prevent discriminatory lending practices",
  },
  {
    id: "adverse_action",
    label: "Adverse Action Notices",
    description: "Automated FCRA-compliant notifications",
  },
  {
    id: "proxy_detection",
    label: "Proxy Variable Detection",
    description: "Identify ZIP code, surname, and neighborhood proxies",
  },
  {
    id: "disparate_impact",
    label: "Disparate Impact Analysis",
    description: "Monitor approval rates across protected classes",
  },
  {
    id: "model_governance",
    label: "Model Governance",
    description: "Version control, bias testing, and explainability",
  },
  {
    id: "hmda_reporting",
    label: "HMDA Reporting",
    description: "Automated Home Mortgage Disclosure Act compliance",
  },
]

const USE_CASES = [
  { value: "mortgage", label: "Mortgage Lending", icon: Landmark },
  { value: "auto", label: "Auto Loans", icon: Briefcase },
  { value: "personal", label: "Personal Loans", icon: Users },
  { value: "business", label: "Business Lending", icon: Building2 },
  { value: "credit_cards", label: "Credit Cards", icon: BarChart3 },
  { value: "all", label: "All Products", icon: Sparkles },
] as const

const STEP_PROGRESS: Record<OnboardingStep, number> = {
  welcome: 0,
  company: 20,
  profile: 40,
  compliance: 60,
  confirm: 80,
}

const STEPS: OnboardingStep[] = [
  "welcome",
  "company",
  "profile",
  "compliance",
  "confirm",
]

interface OnboardingShellProps {
  children: ReactNode
  className?: string
}

function OnboardingShell({ children, className }: OnboardingShellProps) {
  return (
    <div
      className="flex min-h-screen items-center justify-center overflow-y-auto bg-background p-4 sm:p-6"
      data-testid="onboarding-page"
    >
      <div className={cn("w-full max-w-2xl py-4", className)}>{children}</div>
    </div>
  )
}

interface StepCardProps {
  stepLabel?: string
  title: string
  description: string
  progress: number
  children: ReactNode
  footer: ReactNode
}

function StepCard({
  stepLabel,
  title,
  description,
  progress,
  children,
  footer,
}: StepCardProps) {
  return (
    <Card className="border border-border shadow-lg">
      <CardHeader className="space-y-3 border-b border-border pb-4">
        {stepLabel ? (
          <p className="g-text-caption font-medium uppercase tracking-wide text-muted-foreground">
            {stepLabel}
          </p>
        ) : null}
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Progress value={progress} className="h-1.5" />
      </CardHeader>
      <CardContent className="max-h-[min(60vh,32rem)] space-y-4 overflow-y-auto pt-6">
        {children}
      </CardContent>
      <div className="flex gap-2 border-t border-border px-6 py-4">{footer}</div>
    </Card>
  )
}

function StepNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  isSubmitting,
}: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  isSubmitting?: boolean
}) {
  return (
    <>
      {onBack ? (
        <Button variant="outline" onClick={onBack} className="gap-1" type="button">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
      ) : null}
      <Button
        className="flex-1 gap-1"
        onClick={onNext}
        disabled={nextDisabled || isSubmitting}
        loading={isSubmitting}
        type="button"
      >
        {isSubmitting ? (
          <>
            <Settings className="h-4 w-4 animate-spin" aria-hidden />
            Setting up...
          </>
        ) : (
          <>
            {nextLabel}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </Button>
    </>
  )
}

function syncLocalCompanyProfile(
  data: OnboardingData,
  organizationId: string
): void {
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
  companyService.update({ id: organizationId })
  companyService.setOnboardingComplete(true)
}

export function OnboardingPage({ userEmail, onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState<OnboardingStep>("welcome")
  const [data, setData] = useState<OnboardingData>(() => ({
    companyName: "",
    shortName: "",
    email: userEmail ?? "",
    phone: "",
    address: "",
    industry: "banking",
    size: "medium",
    regulatoryBody: "CFPB",
    primaryUseCase: "mortgage",
    dataVolumeEstimate: "medium",
    complianceNeeds: ["fair_lending", "adverse_action", "proxy_detection"],
  }))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const toggleCompliance = (id: string) => {
    setData((prev) => ({
      ...prev,
      complianceNeeds: prev.complianceNeeds.includes(id)
        ? prev.complianceNeeds.filter((c) => c !== id)
        : [...prev.complianceNeeds, id],
    }))
  }

  const handleNext = () => {
    const index = STEPS.indexOf(step)
    if (index < STEPS.length - 1) {
      setStep(STEPS[index + 1])
    }
  }

  const handleBack = () => {
    const index = STEPS.indexOf(step)
    if (index > 0) {
      setStep(STEPS[index - 1])
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const response = await fetch("/api/identity/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: data.companyName,
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
        }),
      })

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(errorBody?.error ?? "Onboarding failed")
      }

      const result = (await response.json()) as {
        organization: { organization_id: string }
      }

      syncLocalCompanyProfile(data, result.organization.organization_id)

      toast.success(`Welcome, ${data.companyName}! Your Meridian dashboard is ready.`)
      await onComplete()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to complete onboarding."
      setSubmitError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === "welcome") {
    return (
      <OnboardingShell>
        <Card className="border border-border shadow-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <AvarentLogo className="h-8 w-8" title="Meridian" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl">Welcome to Meridian</CardTitle>
              <CardDescription>
                Fair lending compliance and risk management for your organization
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  icon: <AvarentLogo className="mx-auto h-6 w-6" title="" />,
                  title: "Proxy detection",
                  detail: "Statistical proxy severing",
                },
                {
                  icon: <FileCheck className="mx-auto h-6 w-6 text-primary" aria-hidden />,
                  title: "Immutable ledger",
                  detail: "SHA-256 audit trail",
                },
                {
                  icon: <BarChart3 className="mx-auto h-6 w-6 text-primary" aria-hidden />,
                  title: "Fairness analytics",
                  detail: "Disparate impact monitoring",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-border bg-muted/30 p-4 text-center"
                >
                  {item.icon}
                  <p className="mt-2 text-sm font-medium text-foreground">{item.title}</p>
                  <p className="g-text-caption text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-3 text-center">
              <p className="text-sm font-medium text-foreground">
                Set up your organization to continue
              </p>
              <Button size="lg" onClick={handleNext} className="gap-2">
                <Building2 className="h-4 w-4" aria-hidden />
                Create organization
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
              <p className="g-text-caption text-muted-foreground">Takes about 2 minutes</p>
            </div>
          </CardContent>
        </Card>
      </OnboardingShell>
    )
  }

  if (step === "company") {
    return (
      <OnboardingShell className="max-w-xl">
        <StepCard
          stepLabel="Step 1 of 4"
          title="Organization details"
          description="Enter your institution's basic information"
          progress={STEP_PROGRESS[step]}
          footer={
            <StepNav
              onBack={handleBack}
              onNext={handleNext}
              nextDisabled={!data.companyName.trim()}
            />
          }
        >
          <div className="space-y-2">
            <Label htmlFor="companyName">Organization name</Label>
            <Input
              id="companyName"
              value={data.companyName}
              onUpdate={(value) => updateData({ companyName: value })}
              placeholder="First National Bank"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortName">Short name</Label>
            <Input
              id="shortName"
              value={data.shortName}
              onUpdate={(value) => updateData({ shortName: value })}
              placeholder="FNB"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={data.industry}
                onValueChange={(v) => updateData({ industry: v as Company["industry"] })}
              >
                <SelectTrigger id="industry">
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
              <Label htmlFor="size">Organization size</Label>
              <Select
                value={data.size}
                onValueChange={(v) => updateData({ size: v as Company["size"] })}
              >
                <SelectTrigger id="size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (&lt; 100)</SelectItem>
                  <SelectItem value="medium">Medium (100–1,000)</SelectItem>
                  <SelectItem value="large">Large (1,000–5,000)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (5,000+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </StepCard>
      </OnboardingShell>
    )
  }

  if (step === "profile") {
    return (
      <OnboardingShell className="max-w-xl">
        <StepCard
          stepLabel="Step 2 of 4"
          title="Contact and regulatory"
          description="Compliance contact and primary regulator"
          progress={STEP_PROGRESS[step]}
          footer={
            <StepNav
              onBack={handleBack}
              onNext={handleNext}
              nextDisabled={!data.email.trim()}
            />
          }
        >
          <div className="space-y-2">
            <Label htmlFor="email">Compliance email</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onUpdate={(value) => updateData({ email: value })}
              placeholder="compliance@company.com"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={data.phone}
              onUpdate={(value) => updateData({ phone: value })}
              placeholder="(555) 123-4567"
              autoComplete="tel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={data.address}
              onUpdate={(value) => updateData({ address: value })}
              placeholder="123 Main St, New York, NY 10001"
              autoComplete="street-address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="regulatoryBody">Primary regulatory body</Label>
            <Select
              value={data.regulatoryBody}
              onValueChange={(v) =>
                updateData({ regulatoryBody: v as Company["regulatoryBody"] })
              }
            >
              <SelectTrigger id="regulatoryBody">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CFPB">CFPB</SelectItem>
                <SelectItem value="OCC">OCC</SelectItem>
                <SelectItem value="FDIC">FDIC</SelectItem>
                <SelectItem value="NCUA">NCUA</SelectItem>
                <SelectItem value="SEC">SEC</SelectItem>
                <SelectItem value="state">State regulator</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </StepCard>
      </OnboardingShell>
    )
  }

  if (step === "compliance") {
    return (
      <OnboardingShell>
        <StepCard
          stepLabel="Step 3 of 4"
          title="Compliance configuration"
          description="Primary lending products and compliance scope"
          progress={STEP_PROGRESS[step]}
          footer={
            <StepNav
              onBack={handleBack}
              onNext={handleNext}
              nextDisabled={data.complianceNeeds.length === 0}
            />
          }
        >
          <div className="space-y-3">
            <Label>Primary lending products</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {USE_CASES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    updateData({ primaryUseCase: value as Company["primaryUseCase"] })
                  }
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                    data.primaryUseCase === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  )}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                  <span className="g-text-caption text-center font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataVolume">Expected monthly applications</Label>
            <Select
              value={data.dataVolumeEstimate}
              onValueChange={(v) =>
                updateData({ dataVolumeEstimate: v as Company["dataVolumeEstimate"] })
              }
            >
              <SelectTrigger id="dataVolume">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (&lt; 1,000/month)</SelectItem>
                <SelectItem value="medium">Medium (1,000–10,000/month)</SelectItem>
                <SelectItem value="high">High (10,000–100,000/month)</SelectItem>
                <SelectItem value="enterprise">Enterprise (100,000+/month)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Compliance features</Label>
            <div className="grid gap-2">
              {COMPLIANCE_OPTIONS.map((option) => {
                const selected = data.complianceNeeds.includes(option.id)
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleCompliance(option.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleCompliance(option.id)}
                      aria-hidden
                      tabIndex={-1}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{option.label}</p>
                      <p className="g-text-caption text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </StepCard>
      </OnboardingShell>
    )
  }

  return (
    <OnboardingShell className="max-w-xl">
      <StepCard
        stepLabel="Step 4 of 4"
        title="Review and confirm"
        description="Verify your organization setup before continuing"
        progress={STEP_PROGRESS.confirm}
        footer={
          <StepNav
            onBack={handleBack}
            onNext={handleComplete}
            nextLabel="Complete setup"
            isSubmitting={isSubmitting}
          />
        }
      >
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex justify-between gap-4">
            <span className="g-text-caption text-muted-foreground">Organization</span>
            <span className="text-right text-sm font-medium text-foreground">
              {data.companyName}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="g-text-caption text-muted-foreground">Industry</span>
            <span className="text-sm font-medium capitalize text-foreground">
              {data.industry.replace("_", " ")}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="g-text-caption text-muted-foreground">Contact</span>
            <span className="text-right text-sm font-medium text-foreground">{data.email}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="g-text-caption text-muted-foreground">Regulator</span>
            <span className="text-sm font-medium text-foreground">{data.regulatoryBody}</span>
          </div>
          <Separator />
          <div className="flex justify-between gap-4">
            <span className="g-text-caption text-muted-foreground">Primary product</span>
            <span className="text-sm font-medium capitalize text-foreground">
              {data.primaryUseCase.replace("_", " ")}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="g-text-caption text-muted-foreground">Compliance features</span>
            <span className="text-sm font-medium text-foreground">
              {data.complianceNeeds.length} selected
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium text-foreground">What happens next</p>
          <ul className="mt-2 list-inside list-disc space-y-1 g-text-caption text-muted-foreground">
            <li>
              Your organization is created with admin membership for your account
            </li>
            <li>
              Dashboard is configured for{" "}
              {USE_CASES.find((u) => u.value === data.primaryUseCase)?.label}
            </li>
            <li>Workflow data remains in your workspace until repository migration</li>
          </ul>
        </div>

        {submitError ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 g-text-caption text-destructive"
            role="alert"
          >
            {submitError}
          </p>
        ) : null}
      </StepCard>
    </OnboardingShell>
  )
}
