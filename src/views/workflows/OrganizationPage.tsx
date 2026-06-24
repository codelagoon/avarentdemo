"use client"

import { useMemo, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Label } from "@gravity-ui/uikit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ViewportPage } from "@/components/shell/ViewportPage"
import { USER_ROLES, type UserRole } from "@/data/mockData"
import { getNavItem } from "@/lib/navigation"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 8

const PERMISSION_LABELS: Record<string, string> = {
  read_all: "Read all",
  write_settings: "Write settings",
  export_evidence: "Export evidence",
  manage_users: "Manage users",
  admin: "Admin",
  write_models: "Write models",
  configure_thresholds: "Configure thresholds",
  read_models: "Read models",
  read_ledger: "Read ledger",
  write_annotations: "Write annotations",
  read_reports: "Read reports",
  read_access_logs: "Read access logs",
  deploy_models: "Deploy models",
  write_data_pipelines: "Write data pipelines",
}

function formatPermission(permission: string): string {
  return PERMISSION_LABELS[permission] ?? permission.replace(/_/g, " ")
}

function formatLastAccess(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function permissionsSummary(user: UserRole): string {
  const labels = user.permissions.slice(0, 3).map(formatPermission)
  if (user.permissions.length > 3) {
    labels.push(`+${user.permissions.length - 3} more`)
  }
  return labels.join(", ")
}

function statusTheme(status: UserRole["status"]): "success" | "danger" | "info" {
  if (status === "active") return "success"
  if (status === "suspended") return "danger"
  return "info"
}

function statusLabel(status: UserRole["status"]): string {
  if (status === "active") return "Active"
  if (status === "suspended") return "Suspended"
  return "Inactive"
}

export function OrganizationPage() {
  const nav = getNavItem("organization")
  const [search, setSearch] = useState("")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      USER_ROLES.filter(
        (user) =>
          !search ||
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.role.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  )

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <ViewportPage testId="organization-page" className="gap-3">
      <header className="shrink-0 space-y-0.5">
        <h1 className="g-text-subheader font-semibold text-foreground">{nav.label}</h1>
        <p className="g-text-caption text-muted-foreground">{nav.description}</p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        <Input
          placeholder="Search team members…"
          value={search}
          onUpdate={handleSearchChange}
          data-testid="user-search"
          className="shrink-0"
          aria-label="Search team members"
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-card">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b border-border">
                  <th
                    scope="col"
                    className="px-3 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="min-w-[180px] px-3 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Permissions
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Status
                  </th>
                  <th scope="col" className="w-8 px-2 py-2">
                    <span className="sr-only">Expand details</span>
                  </th>
                </tr>
              </thead>
              <tbody data-testid="users-table">
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center">
                      <p className="g-text-caption font-medium text-foreground">
                        No team members match your search
                      </p>
                      <p className="mt-1 g-text-caption text-muted-foreground">
                        Try a different name, role, or email.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => handleSearchChange("")}
                      >
                        Clear search
                      </Button>
                    </td>
                  </tr>
                ) : (
                  visible.map((user) => (
                    <Collapsible
                      key={user.id}
                      open={expandedId === user.id}
                      onOpenChange={(open) => setExpandedId(open ? user.id : null)}
                      asChild
                    >
                      <>
                        <tr
                          data-testid={`user-row-${user.id}`}
                          className="border-b border-border last:border-b-0"
                        >
                          <td className="px-3 py-2 align-top">
                            <p className="g-text-caption font-medium text-foreground">{user.name}</p>
                            <p className="g-text-caption truncate text-muted-foreground">{user.email}</p>
                            <p className="g-text-caption text-muted-foreground">{user.department}</p>
                          </td>
                          <td className="min-w-[180px] px-3 py-2 align-top">
                            <p className="g-text-caption text-foreground">{user.role}</p>
                          </td>
                          <td className="max-w-[220px] px-3 py-2 align-top">
                            <p className="g-text-caption line-clamp-2 text-muted-foreground">
                              {permissionsSummary(user)}
                            </p>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <Label theme={statusTheme(user.status)} size="xs">
                              {statusLabel(user.status)}
                            </Label>
                          </td>
                          <td className="px-2 py-2 align-top">
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Show permissions detail for ${user.name}`}
                              >
                                <ChevronDown
                                  className={cn(
                                    "size-4 transition-transform duration-200",
                                    expandedId === user.id && "rotate-180"
                                  )}
                                  aria-hidden
                                />
                              </button>
                            </CollapsibleTrigger>
                          </td>
                        </tr>
                        <CollapsibleContent asChild>
                          <tr className="border-b border-border bg-muted/20 last:border-b-0">
                            <td colSpan={5} className="px-3 py-3">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <p className="g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                                    Permissions
                                  </p>
                                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                                    {user.permissions.map((permission) => (
                                      <li
                                        key={permission}
                                        className="rounded border border-border bg-background px-2 py-0.5 g-text-caption text-foreground"
                                      >
                                        {formatPermission(permission)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="space-y-2">
                                  <p className="g-text-caption">
                                    <span className="text-muted-foreground">MFA: </span>
                                    <span className="text-foreground">
                                      {user.mfaEnabled ? "Enabled" : "Not enabled"}
                                    </span>
                                    {!user.mfaEnabled && user.status === "active" ? (
                                      <span className="ml-1 text-destructive">· review required</span>
                                    ) : null}
                                  </p>
                                  <p className="g-text-caption">
                                    <span className="text-muted-foreground">Last access: </span>
                                    <time
                                      dateTime={user.lastAccess}
                                      className="font-mono-data text-foreground"
                                    >
                                      {formatLastAccess(user.lastAccess)}
                                    </time>
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 ? (
            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-3 py-2">
              <p className="g-text-caption text-muted-foreground">
                Showing{" "}
                <span className="font-mono-data text-foreground">{visible.length}</span> of{" "}
                <span className="font-mono-data text-foreground">{filtered.length}</span>
              </p>
              {hasMore ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                >
                  Load more
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </ViewportPage>
  )
}
