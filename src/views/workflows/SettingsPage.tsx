"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ViewportPage } from "@/components/shell/ViewportPage"
import { useTheme } from "@/components/theme-provider"
import { getNavItem } from "@/lib/navigation"
import { DAILY_STATS } from "@/data/mockData"
import { cn } from "@/lib/utils"

type SettingsTab = "detection" | "system"

interface DetectionToggle {
  id: string
  label: string
  description: string
  value: boolean
  critical?: boolean
}

const TAB_LABELS: Record<SettingsTab, string> = {
  detection: "Detection",
  system: "System",
}

const THEME_OPTIONS = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "Auto" },
] as const

const INITIAL_DETECTION_TOGGLES: DetectionToggle[] = [
  {
    id: "proxy-scan",
    label: "Proxy variable scanning",
    description:
      "Continuously scan incoming features for correlations that may act as protected-class proxies.",
    value: true,
  },
  {
    id: "do-calculus",
    label: "Causal intervention",
    description:
      "Statistical analysis that severs feature pathways when they function as protected-class proxies.",
    value: true,
  },
  {
    id: "hash-chain",
    label: "Hash-chain ledger signing",
    description:
      "Cryptographically seal each decision event into the immutable evidence ledger.",
    value: true,
    critical: true,
  },
  {
    id: "three-strike",
    label: "3-strike attack detection",
    description:
      "Detect coordinated sequences of proxy variable manipulation attempts.",
    value: true,
  },
  {
    id: "realtime-alerts",
    label: "Real-time alerts",
    description:
      "Send immediate notifications when fairness thresholds are breached.",
    value: true,
  },
  {
    id: "auto-escalate",
    label: "Auto-escalate threats",
    description:
      "Automatically route critical proxy attacks to the compliance review queue.",
    value: true,
    critical: true,
  },
]

export function SettingsPage() {
  const settingsMeta = getNavItem("settings")
  const { theme, setTheme } = useTheme()
  const [tab, setTab] = useState<SettingsTab>("detection")
  const [savedToggles, setSavedToggles] = useState(INITIAL_DETECTION_TOGGLES)
  const [toggles, setToggles] = useState(INITIAL_DETECTION_TOGGLES)
  const [pendingDisable, setPendingDisable] = useState<DetectionToggle | null>(null)

  const isDirty = useMemo(
    () => toggles.some((t, i) => t.value !== savedToggles[i]?.value),
    [toggles, savedToggles]
  )

  const applyToggleChange = (id: string, value: boolean) => {
    setToggles((prev) => prev.map((t) => (t.id === id ? { ...t, value } : t)))
  }

  const handleToggleChange = (item: DetectionToggle, value: boolean) => {
    if (!value && item.critical && item.value) {
      setPendingDisable(item)
      return
    }
    applyToggleChange(item.id, value)
  }

  const confirmDisable = () => {
    if (pendingDisable) {
      applyToggleChange(pendingDisable.id, false)
      setPendingDisable(null)
    }
  }

  const handleSave = () => {
    setSavedToggles(toggles.map((t) => ({ ...t })))
    toast.success("Configuration saved — changes will take effect within 30 seconds")
  }

  return (
    <ViewportPage testId="settings-page">
      <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
        <header className="shrink-0">
          <h1 className="g-text-subheader font-semibold text-foreground">Settings</h1>
          <p className="g-text-caption text-muted-foreground">{settingsMeta.description}</p>
        </header>

        <div className="flex shrink-0 items-center justify-between gap-2">
          <div
            className="flex rounded-md border border-border bg-secondary p-0.5"
            data-testid="settings-tabs"
            role="tablist"
            aria-label="Settings sections"
          >
            {(["detection", "system"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                id={`settings-tab-${t}`}
                aria-selected={tab === t}
                aria-controls={`settings-panel-${t}`}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded px-3 py-1 g-text-caption",
                  tab === t
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty}
            data-testid="settings-save"
          >
            Save
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-card shadow-surface">
          {tab === "detection" ? (
            <div
              id="settings-panel-detection"
              role="tabpanel"
              aria-labelledby="settings-tab-detection"
              className="flex h-full flex-col overflow-hidden"
            >
              <p className="shrink-0 border-b border-border px-3 py-2 g-text-caption text-muted-foreground">
                {DAILY_STATS.modelVersion} · detection controls
              </p>
              <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-border">
                {toggles.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Label
                          id={`${item.id}-label`}
                          htmlFor={item.id}
                          className="g-text-caption font-medium text-foreground"
                        >
                          {item.label}
                        </Label>
                        {item.critical ? (
                          <Badge
                            variant="destructive"
                            className="h-4 px-1.5 text-[0.6rem]"
                          >
                            Critical
                          </Badge>
                        ) : null}
                      </div>
                      <p
                        id={`${item.id}-desc`}
                        className="mt-0.5 g-text-caption text-muted-foreground"
                      >
                        {item.description}
                      </p>
                    </div>
                    <Switch
                      id={item.id}
                      checked={item.value}
                      onCheckedChange={(v) => handleToggleChange(item, v)}
                      aria-labelledby={`${item.id}-label`}
                      aria-describedby={`${item.id}-desc`}
                      aria-label={item.label}
                      data-testid={`setting-${item.id}`}
                      className="mt-0.5 shrink-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              id="settings-panel-system"
              role="tabpanel"
              aria-labelledby="settings-tab-system"
              className="flex h-full flex-col overflow-hidden gap-4 p-3"
            >
              <section>
                <p className="g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                  Theme
                </p>
                <div className="mt-2 flex gap-2" role="group" aria-label="Theme preference">
                  {THEME_OPTIONS.map((option) => (
                    <Button
                      key={option.id}
                      variant={theme === option.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme(option.id)}
                      aria-pressed={theme === option.id}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={pendingDisable !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDisable(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disable {pendingDisable?.label ?? "this control"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDisable?.id === "hash-chain"
                ? "Disabling ledger signing stops cryptographic sealing of new decisions. Existing ledger entries remain intact, but new events will not be signed."
                : pendingDisable?.id === "auto-escalate"
                  ? "Disabling auto-escalation stops automatic routing of critical threats to the compliance review queue. High-severity events will require manual triage."
                  : "This control is marked critical. Disabling it may affect audit readiness and operational safeguards."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep enabled</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDisable}>
              Disable anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ViewportPage>
  )
}
