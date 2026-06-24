"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, ChevronDown } from "lucide-react"
import { ViewportPage } from "@/components/shell/ViewportPage"
import { KpiRow } from "@/components/command-center/KpiRow"
import { FindingsTable } from "@/components/command-center/FindingsTable"
import { ActivityFeed } from "@/components/command-center/ActivityFeed"
import { MonitoringPanel, MonitoringPanelTabSwitcher, type MonitoringPanelTab } from "@/components/command-center/MonitoringPanel"
import { ReadinessSnapshot } from "@/components/command-center/ReadinessSnapshot"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  COMMAND_CENTER_SYNC_CHANNELS,
  getCommandCenterActivity,
  getCommandCenterFindings,
  getCommandCenterKpis,
  getDisparityTrend,
  getExamReadinessCategories,
  getMonitoringSignals,
  getSeverityCounts,
} from "@/domains/command-center/commandCenterDomain"
import { useLiveData } from "@/hooks/useLiveData"
import type { ActivityFeedItem, CommandCenterFinding, ExamReadinessCategory } from "@/data/mockData"
import type { DisparityTrendPoint, MonitoringSignal } from "@/data/mockData"
import type { NavigateOptions, WorkflowId } from "@/lib/navigation"
import { cn } from "@/lib/utils"

export interface CommandCenterPageProps {
  onNavigate?: (id: WorkflowId, options?: NavigateOptions) => void
}

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  collapseOnMobile?: boolean
  fill?: boolean
  scrollContent?: boolean
  headerAccessory?: React.ReactNode
  className?: string
}

function CollapsibleSection({
  title,
  children,
  open,
  onOpenChange,
  collapseOnMobile = true,
  fill = false,
  scrollContent = true,
  headerAccessory,
  className,
}: CollapsibleSectionProps) {
  useEffect(() => {
    if (!collapseOnMobile) return

    const mq = window.matchMedia("(min-width: 1024px)")
    const syncOpen = () => {
      if (!mq.matches) onOpenChange(false)
    }

    syncOpen()
    mq.addEventListener("change", syncOpen)
    return () => mq.removeEventListener("change", syncOpen)
  }, [collapseOnMobile, onOpenChange])

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card",
        fill ? "min-h-0 flex-1" : "shrink-0",
        className
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 px-3 py-1.5",
          open && "border-b border-border"
        )}
      >
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-1.5 rounded-sm text-left transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
            aria-hidden
          />
          <span className="min-w-0 truncate g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </span>
        </CollapsibleTrigger>
        {open ? <div className="ml-auto shrink-0">{headerAccessory}</div> : null}
      </div>
      <CollapsibleContent className="min-h-0 flex-1 overflow-hidden data-[state=closed]:hidden">
        <div
          className={cn(
            "h-full min-h-0",
            scrollContent ? "overflow-y-auto overscroll-y-contain" : "overflow-hidden"
          )}
        >
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function CommandCenterRightRail({
  criticalFindingCount,
  severityCounts,
  trendData,
  signals,
  categories,
  onNavigate,
}: {
  criticalFindingCount: number
  severityCounts: ReturnType<typeof getSeverityCounts>
  trendData: DisparityTrendPoint[]
  signals: MonitoringSignal[]
  categories: ExamReadinessCategory[]
  onNavigate?: CommandCenterPageProps["onNavigate"]
}) {
  const [monitoringOpen, setMonitoringOpen] = useState(true)
  const [examOpen, setExamOpen] = useState(false)
  const [monitoringTab, setMonitoringTab] = useState<MonitoringPanelTab>("overview")

  const bothOpen = monitoringOpen && examOpen
  const anyOpen = monitoringOpen || examOpen

  return (
    <div
      className={cn(
        "min-h-0 gap-2",
        bothOpen
          ? "grid h-full grid-rows-[minmax(0,3fr)_minmax(0,2fr)] overflow-hidden"
          : "flex flex-col",
        anyOpen && !bothOpen && "h-full overflow-hidden",
        !anyOpen && "h-auto self-start"
      )}
    >
      <CollapsibleSection
        title="Monitoring Center"
        open={monitoringOpen}
        onOpenChange={setMonitoringOpen}
        fill={monitoringOpen && !bothOpen}
        scrollContent={bothOpen}
        headerAccessory={
          <MonitoringPanelTabSwitcher
            compact
            activeTab={monitoringTab}
            onTabChange={setMonitoringTab}
          />
        }
        className={bothOpen ? "h-full min-h-0 overflow-hidden" : undefined}
      >
        <MonitoringPanel
          hideHeader
          tabbedView
          dense={bothOpen}
          activeTab={monitoringTab}
          onTabChange={setMonitoringTab}
          severityCounts={severityCounts}
          trendData={trendData}
          signals={signals}
        />
      </CollapsibleSection>
      <CollapsibleSection
        title="Exam Readiness Snapshot"
        open={examOpen}
        onOpenChange={setExamOpen}
        fill={examOpen && !bothOpen}
        scrollContent={bothOpen}
        className={bothOpen ? "h-full min-h-0 overflow-hidden" : undefined}
      >
        <ReadinessSnapshot
          hideHeader
          compact={bothOpen}
          categories={categories}
          criticalFindingCount={criticalFindingCount}
          onNavigate={onNavigate}
        />
      </CollapsibleSection>
    </div>
  )
}

function CommandCenterMainColumn({
  findings,
  activity,
  onNavigate,
}: {
  findings: CommandCenterFinding[]
  activity: ActivityFeedItem[]
  onNavigate?: CommandCenterPageProps["onNavigate"]
}) {
  const [activityOpen, setActivityOpen] = useState(false)

  const gridRows = activityOpen
    ? "minmax(0, 1fr) minmax(0, 128px)"
    : "minmax(0,1fr) auto"

  return (
    <div
      className="grid min-h-0 h-full gap-2 overflow-hidden lg:col-span-2"
      style={{ gridTemplateRows: gridRows }}
    >
      <div className="min-h-0 overflow-hidden">
        <FindingsTable
          findings={findings}
          onNavigate={onNavigate}
          className="h-full min-h-0"
        />
      </div>
      <CollapsibleSection
        title="Recent Activity"
        open={activityOpen}
        onOpenChange={setActivityOpen}
        fill={activityOpen}
      >
        <ActivityFeed items={activity} hideHeader />
      </CollapsibleSection>
    </div>
  )
}

export function CommandCenterPage({ onNavigate }: CommandCenterPageProps) {
  const syncChannels = [...COMMAND_CENTER_SYNC_CHANNELS]
  const kpis = useLiveData(() => getCommandCenterKpis(), syncChannels)
  const findings = useLiveData(() => getCommandCenterFindings(), syncChannels)
  const activity = useLiveData(() => getCommandCenterActivity(), syncChannels)
  const trendData = useLiveData(() => getDisparityTrend(), syncChannels)
  const signals = useLiveData(() => getMonitoringSignals(), syncChannels)
  const severityCounts = useLiveData(() => getSeverityCounts(), syncChannels)
  const categories = useLiveData(() => getExamReadinessCategories(), syncChannels)

  const criticalFindingCount = findings.filter((f) => f.severity === "critical").length

  return (
    <ViewportPage testId="command-center-page" className="gap-2">
      {criticalFindingCount > 0 && (
        <div
          className="flex shrink-0 items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2"
          role="alert"
        >
          <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden />
          <p className="min-w-0 flex-1 g-text-caption text-foreground">
            <span className="font-semibold text-destructive">
              {criticalFindingCount} critical finding
              {criticalFindingCount === 1 ? "" : "s"}
            </span>{" "}
            require immediate attention.
          </p>
          <button
            type="button"
            onClick={() => onNavigate?.("investigations")}
            className="shrink-0 g-text-caption font-medium text-primary hover:underline"
          >
            Review now
          </button>
        </div>
      )}

      <KpiRow kpis={kpis} />

      <div
        className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden lg:grid-cols-3"
        style={{ gridTemplateRows: "minmax(0, 1fr)" }}
      >
        <CommandCenterMainColumn
          findings={findings}
          activity={activity}
          onNavigate={onNavigate}
        />

        <CommandCenterRightRail
          criticalFindingCount={criticalFindingCount}
          severityCounts={severityCounts}
          trendData={trendData}
          signals={signals}
          categories={categories}
          onNavigate={onNavigate}
        />
      </div>
    </ViewportPage>
  )
}
