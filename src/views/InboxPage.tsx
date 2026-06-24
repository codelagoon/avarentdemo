import { useState, useEffect } from "react"
import { useLiveData } from "@/hooks/useLiveData"
import { Inbox, Filter, Clock, CheckCircle, ShieldAlert, ArrowRight, UserCog } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { investigationService } from "@/services/investigationService"

export function InboxPage() {
  const investigations = useLiveData(() => investigationService.getAll(), ["investigations"])
  const [activeTab, setActiveTab] = useState<"assigned" | "open" | "resolved">("assigned")

  const filtered = investigations.filter(inv => {
    if (activeTab === "assigned") return inv.status !== "closed" && inv.status !== "under_review"
    if (activeTab === "open") return inv.status === "open" || inv.status === "in_progress"
    if (activeTab === "resolved") return inv.status === "closed"
    return true
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="destructive" className="text-[0.6rem] bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">Open</Badge>
      case 'in_progress': return <Badge variant="outline" className="text-[0.6rem] bg-orange-500/10 text-orange-600 border-orange-500/20">In Progress</Badge>
      case 'under_review': return <Badge variant="outline" className="text-[0.6rem] bg-indigo-500/10 text-indigo-600 border-indigo-500/20">Under Review</Badge>
      case 'closed': return <Badge variant="outline" className="text-[0.6rem] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Resolved</Badge>
      default: return <Badge variant="outline" className="text-[0.6rem]">{status}</Badge>
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 bg-card px-6 py-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Inbox className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Analyst Inbox</h1>
            <p className="text-[0.7rem] text-muted-foreground">Manage your active threat investigations and mitigation assignments</p>
          </div>
        </div>

        <div className="flex rounded-lg border border-border/60 bg-muted/60 p-0.5">
          <button
            onClick={() => setActiveTab("assigned")}
            className={cn("rounded-md px-3 py-1 text-[0.72rem] font-semibold transition-all", activeTab === "assigned" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Assigned to Me
          </button>
          <button
            onClick={() => setActiveTab("open")}
            className={cn("rounded-md px-3 py-1 text-[0.72rem] font-semibold transition-all", activeTab === "open" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            All Open
          </button>
          <button
            onClick={() => setActiveTab("resolved")}
            className={cn("rounded-md px-3 py-1 text-[0.72rem] font-semibold transition-all", activeTab === "resolved" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-5">
        <Card className="border-border/60 shadow-sm overflow-hidden min-h-[500px]">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-10 text-center"></TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Case Title</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Severity</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Opened</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <CheckCircle className="h-8 w-8 text-emerald-500/50" />
                      <p className="text-sm font-medium text-foreground">Inbox Zero</p>
                      <p className="text-xs">No active investigations require your attention.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(inv => (
                  <TableRow key={inv.id} className="hover:bg-muted/30 cursor-pointer group">
                    <TableCell className="text-center">
                      <ShieldAlert className={cn("h-4 w-4 mx-auto", inv.status === 'closed' ? "text-emerald-500" : "text-orange-500")} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{inv.title}</span>
                        <span className="font-mono text-[0.65rem] text-muted-foreground">ID: {inv.id.split('-')[0]}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[0.6rem] uppercase bg-transparent border-transparent">High Risk</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(inv.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
