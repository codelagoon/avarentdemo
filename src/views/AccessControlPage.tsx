import { useState } from "react"
import { Users, Shield, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Search, UserPlus, Key } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { USER_ROLES, type UserRole } from "@/data/mockData"

function StatusBadge({ status }: { status: UserRole["status"] }) {
  const map = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-secondary text-muted-foreground border-border",
    suspended: "bg-destructive/10 text-destructive border-destructive/20",
  }
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold capitalize", map[status])}>
      {status}
    </span>
  )
}

function PermissionTag({ perm }: { perm: string }) {
  const isAdmin = perm.includes("admin") || perm.includes("write")
  return (
    <span className={cn(
      "inline-block rounded px-1.5 py-0.5 text-[0.58rem] font-mono font-medium",
      isAdmin ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
    )}>
      {perm}
    </span>
  )
}

const ROLE_COLORS: Record<string, string> = {
  "Chief Compliance Officer": "bg-primary/10 text-primary border-primary/20",
  "AI Fairness Director": "bg-blue-50 text-blue-700 border-blue-200",
  "Senior Model Risk Analyst": "bg-accent text-accent-foreground border-primary/15",
  "Regulatory Examiner (OCC)": "bg-amber-50 text-amber-700 border-amber-200",
  "Internal Auditor": "bg-secondary text-foreground border-border",
  "ML Engineer": "bg-violet-50 text-violet-700 border-violet-200",
  "Junior Analyst": "bg-secondary text-muted-foreground border-border",
}

export function AccessControlPage() {
  const [subTab, setSubTab] = useState<"directory" | "matrix">("directory")
  const [search, setSearch] = useState("")
  const [users] = useState(USER_ROLES)

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    active: users.filter(u => u.status === "active").length,
    mfaEnabled: users.filter(u => u.mfaEnabled).length,
    external: users.filter(u => u.department.startsWith("External")).length,
    suspended: users.filter(u => u.status === "suspended").length,
  }

  return (
    <div className="flex h-full flex-col overflow-hidden" data-testid="access-control-page">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 bg-card px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Access Control</h1>
            <p className="text-[0.7rem] text-muted-foreground">
              Role-based access · {stats.active} active · {stats.mfaEnabled}/{users.length} MFA enabled
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-4">
          <div className="flex rounded-lg border border-border/60 bg-muted/60 p-0.5">
            <button
              onClick={() => setSubTab("directory")}
              className={cn("rounded-md px-3 py-1 text-xs font-semibold transition-all", subTab === "directory" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              User Directory
            </button>
            <button
              onClick={() => setSubTab("matrix")}
              className={cn("rounded-md px-3 py-1 text-xs font-semibold transition-all", subTab === "matrix" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Permissions & Logs
            </button>
          </div>
          <Button size="sm" className="h-8 gap-1.5 text-xs animate-none" onClick={() => toast.info("Add User dialog would open here")}>
            <UserPlus className="h-3.5 w-3.5" />Add User
          </Button>
        </div>
      </div>

      {/* Main Viewport-Locked Container */}
      <div className="flex-1 min-h-0 p-5 overflow-hidden flex flex-col bg-background">
        <TooltipProvider>
          {subTab === "directory" && (
            <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
                {[
                  { label: "Active Users", value: stats.active, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
                  { label: "MFA Enforced", value: stats.mfaEnabled, icon: Key, color: "text-primary", bg: "bg-primary/10" },
                  { label: "External Access", value: stats.external, icon: Shield, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
                  { label: "Suspended", value: stats.suspended, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
                ].map(s => (
                  <Card key={s.label} className="border-border/60 shadow-sm">
                    <div className="flex items-center justify-between p-2.5">
                      <div>
                        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                        <p className={cn("mt-1 text-xl font-bold tabular-nums", s.color)}>{s.value}</p>
                      </div>
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", s.bg)}>
                        <s.icon className={cn("h-4 w-4", s.color)} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Users Table */}
              <Card className="flex-1 min-h-0 flex flex-col border-border/60 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/40 px-5 py-3 shrink-0">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">User Directory</p>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search users…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="h-7 w-52 pl-8 text-xs font-sans"
                      data-testid="user-search"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 max-h-[calc(100vh-330px)]">
                  <Table data-testid="users-table">
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="pl-5 text-[0.68rem] font-bold uppercase tracking-wider">Name</TableHead>
                        <TableHead className="text-[0.68rem] font-bold uppercase tracking-wider">Role</TableHead>
                        <TableHead className="text-[0.68rem] font-bold uppercase tracking-wider">Department</TableHead>
                        <TableHead className="text-[0.68rem] font-bold uppercase tracking-wider">Last Access</TableHead>
                        <TableHead className="text-[0.68rem] font-bold uppercase tracking-wider">MFA</TableHead>
                        <TableHead className="text-[0.68rem] font-bold uppercase tracking-wider">Status</TableHead>
                        <TableHead className="pr-5 text-[0.68rem] font-bold uppercase tracking-wider">Permissions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border/30">
                      {filtered.map(user => (
                        <TableRow key={user.id} className="transition-colors hover:bg-muted/30" data-testid={`user-row-${user.id}`}>
                          <TableCell className="pl-5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.62rem] font-bold text-primary">
                                {user.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("")}
                              </div>
                              <div>
                                <p className="text-[0.78rem] font-medium text-foreground">{user.name}</p>
                                <p className="text-[0.62rem] text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn("cursor-default rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold",
                                  ROLE_COLORS[user.role] ?? "bg-secondary text-muted-foreground border-border")}>
                                  {user.role}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Role: {user.role}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-[0.75rem] text-muted-foreground">{user.department}</TableCell>
                          <TableCell>
                            <span className="font-mono text-[0.7rem] tabular-nums text-muted-foreground">
                              {new Date(user.lastAccess).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
                            </span>
                          </TableCell>
                          <TableCell>
                            {user.mfaEnabled ? (
                              <Tooltip>
                                <TooltipTrigger asChild><CheckCircle className="h-4 w-4 cursor-help text-emerald-500" /></TooltipTrigger>
                                <TooltipContent>MFA enabled</TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild><AlertCircle className="h-4 w-4 cursor-help text-amber-500" /></TooltipTrigger>
                                <TooltipContent>MFA not enabled — action required</TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell><StatusBadge status={user.status} /></TableCell>
                          <TableCell className="pr-5">
                            <div className="flex max-w-[200px] flex-wrap gap-1">
                              {user.permissions.slice(0, 3).map((p: string) => <PermissionTag key={p} perm={p} />)}
                              {user.permissions.length > 3 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[0.58rem] text-muted-foreground">
                                      +{user.permissions.length - 3}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>{user.permissions.slice(3).join(", ")}</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}

          {subTab === "matrix" && (
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-5 overflow-hidden">
              {/* Permissions Matrix */}
              <Card className="flex flex-col h-full min-h-0 border-border/60 shadow-sm overflow-hidden">
                <div className="border-b border-border/40 px-5 py-3 shrink-0">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">Role Permissions Matrix</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 min-h-0 max-h-[calc(100vh-260px)] space-y-4">
                  {[
                    { role: "Chief Compliance", perms: ["admin", "all read/write", "export", "manage users"] },
                    { role: "AI Fairness Dir.", perms: ["model read/write", "export", "config"] },
                    { role: "Model Risk Analyst", perms: ["model read", "ledger read", "annotate"] },
                    { role: "Regulatory Examiner", perms: ["ledger read", "report read", "export"] },
                    { role: "Internal Auditor", perms: ["all read", "export", "audit logs"] },
                    { role: "ML Engineer", perms: ["model read/write", "deploy"] },
                    { role: "Junior Analyst", perms: ["report read"] },
                  ].map(r => (
                    <div key={r.role} className="border-b border-border/20 pb-3 last:border-0 last:pb-0">
                      <p className="mb-1 text-[0.68rem] font-bold text-foreground leading-tight uppercase tracking-wider">{r.role}</p>
                      <div className="flex flex-wrap gap-1">
                        {r.perms.map(p => <PermissionTag key={p} perm={p} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Access Log */}
              <Card className="lg:col-span-2 flex flex-col h-full min-h-0 border-border/60 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/40 px-5 py-3 shrink-0">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">Recent Access Log</p>
                  <Badge variant="secondary" className="text-[0.65rem]">Last 24h</Badge>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 max-h-[calc(100vh-260px)] px-4">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-card z-10">
                      <tr className="border-b border-border/60">
                        {["Time", "User", "Action", "Resource", "Result"].map(h => (
                          <th key={h} className="pb-2 pt-3 text-left text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {[
                        { time: "14:23", user: "S. Chen", action: "VIEW", resource: "Evidence Ledger", result: "success" },
                        { time: "13:58", user: "M. Rivera", action: "EXPORT", resource: "Fairness Report", result: "success" },
                        { time: "13:45", user: "T. Okafor", action: "VIEW", resource: "Ledger (OCC)", result: "success" },
                        { time: "13:22", user: "J. Walsh", action: "UPDATE", resource: "Model Config", result: "success" },
                        { time: "12:47", user: "R. Kim", action: "EXPORT", resource: "Access Log", result: "success" },
                        { time: "11:30", user: "D. Mbeki", action: "DEPLOY", resource: "FNB-FAIR-v4.2.1", result: "success" },
                        { time: "09:14", user: "A. Torres", action: "VIEW", resource: "Dashboard", result: "denied" },
                      ].map((row, i) => (
                        <tr key={i} className="transition-colors hover:bg-muted/30">
                          <td className="py-2.5 font-mono text-[0.7rem] tabular-nums text-muted-foreground">{row.time}</td>
                          <td className="py-2.5 text-[0.78rem] font-medium text-foreground">{row.user}</td>
                          <td className="py-2.5">
                            <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[0.62rem] text-foreground">{row.action}</span>
                          </td>
                          <td className="py-2.5 text-[0.72rem] text-muted-foreground">{row.resource}</td>
                          <td className="py-2.5">
                            {row.result === "success"
                              ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                              : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  )
}
