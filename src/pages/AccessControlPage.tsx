import { useState } from "react"
import { Users, Shield, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Search, UserPlus, Key } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Access Control
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Role-based access — {stats.active} active users · {stats.mfaEnabled}/{users.length} MFA enabled
          </p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => toast.info("Add User dialog would open here")}>
          <UserPlus className="h-3.5 w-3.5" />
          Add User
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          {[
            { label: "Active Users", value: stats.active, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "MFA Enforced", value: stats.mfaEnabled, icon: Key, color: "text-primary", bg: "bg-white border border-primary/20" },
            { label: "External Access", value: stats.external, icon: Shield, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Suspended", value: stats.suspended, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
          ].map(s => (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={cn("mt-0.5 text-2xl font-bold", s.color)}>{s.value}</p>
                  </div>
                  <div className={cn("rounded-lg p-2", s.bg)}>
                    <s.icon className={cn("h-4 w-4", s.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Role Matrix */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <Card className="col-span-1 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Role Permissions Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              {[
                { role: "Chief Compliance", perms: ["admin", "all read/write", "export", "manage users"] },
                { role: "AI Fairness Dir.", perms: ["model read/write", "export", "config"] },
                { role: "Model Risk Analyst", perms: ["model read", "ledger read", "annotate"] },
                { role: "Regulatory Examiner", perms: ["ledger read", "report read", "export"] },
                { role: "Internal Auditor", perms: ["all read", "export", "audit logs"] },
                { role: "ML Engineer", perms: ["model read/write", "deploy"] },
                { role: "Junior Analyst", perms: ["report read"] },
              ].map(r => (
                <div key={r.role} className="mb-2.5 last:mb-0">
                  <p className="mb-1 text-[0.65rem] font-semibold text-foreground">{r.role}</p>
                  <div className="flex flex-wrap gap-1">
                    {r.perms.map(p => (
                      <PermissionTag key={p} perm={p} />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="col-span-2 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Access Log</CardTitle>
                <Badge variant="secondary" className="text-[0.65rem]">Last 24h</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {["Time", "User", "Action", "Resource", "Result"].map(h => (
                      <th key={h} className="pb-2 text-left text-[0.65rem] font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { time: "14:23", user: "S. Chen", action: "VIEW", resource: "Evidence Ledger", result: "success" },
                    { time: "13:58", user: "M. Rivera", action: "EXPORT", resource: "Fairness Report", result: "success" },
                    { time: "13:45", user: "T. Okafor", action: "VIEW", resource: "Ledger (OCC)", result: "success" },
                    { time: "13:22", user: "J. Walsh", action: "UPDATE", resource: "Model Config", result: "success" },
                    { time: "12:47", user: "R. Kim", action: "EXPORT", resource: "Access Log", result: "success" },
                    { time: "11:30", user: "D. Mbeki", action: "DEPLOY", resource: "FNB-FAIR-v4.2.1", result: "success" },
                    { time: "09:14", user: "A. Torres", action: "VIEW", resource: "Dashboard", result: "denied" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1.5 font-mono text-[0.65rem] text-muted-foreground">{row.time}</td>
                      <td className="py-1.5 text-[0.65rem] font-medium text-foreground">{row.user}</td>
                      <td className="py-1.5">
                        <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.6rem] text-foreground">{row.action}</span>
                      </td>
                      <td className="py-1.5 text-[0.65rem] text-muted-foreground">{row.resource}</td>
                      <td className="py-1.5">
                        {row.result === "success" ? (
                          <CheckCircle className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-destructive" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">User Directory</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-8 w-52 pl-8 text-xs"
                  data-testid="user-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table data-testid="users-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 text-xs">Name</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Last Access</TableHead>
                  <TableHead className="text-xs">MFA</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="pr-4 text-xs">Permissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(user => (
                  <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[0.6rem] font-bold text-primary">
                          {user.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{user.name}</p>
                          <p className="text-[0.6rem] text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn(
                            "cursor-default rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold",
                            ROLE_COLORS[user.role] ?? "bg-secondary text-muted-foreground border-border"
                          )}>
                            {user.role}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Role: {user.role}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.department}</TableCell>
                    <TableCell>
                      <span className="font-mono text-[0.65rem] text-muted-foreground">
                        {new Date(user.lastAccess).toLocaleString("en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.mfaEnabled ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CheckCircle className="h-4 w-4 text-emerald-600 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>MFA enabled</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertCircle className="h-4 w-4 text-amber-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>MFA not enabled — action required</TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell><StatusBadge status={user.status} /></TableCell>
                    <TableCell className="pr-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {user.permissions.slice(0, 3).map(p => (
                          <PermissionTag key={p} perm={p} />
                        ))}
                        {user.permissions.length > 3 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help rounded bg-secondary px-1.5 py-0.5 text-[0.58rem] font-mono text-muted-foreground">
                                +{user.permissions.length - 3} more
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {user.permissions.slice(3).join(", ")}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
