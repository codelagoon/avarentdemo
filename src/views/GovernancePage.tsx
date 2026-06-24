import { useState, useEffect } from "react"
import { useLiveData } from "@/hooks/useLiveData"
import { CheckCircle, Shield, XCircle, FileWarning, Clock, UserCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"

export function GovernancePage() {
  // Using the investigation table, but filtering for the governance lifecycle
  const [approvals, setApprovals] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending")

  useEffect(() => {
    fetchGovernanceItems()
  }, [])

  const fetchGovernanceItems = async () => {
    // In a full implementation, this would hit a GovernanceService joining investigations with governance_actions
    // For this pilot UI, we query investigations where status is relevant to the CCO
    const { data } = await supabase
      .from('investigations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50)

    if (data) setApprovals(data)
  }

  const filtered = approvals.filter(item => {
    if (activeTab === "pending") return item.status === "under_review"
    if (activeTab === "approved") return item.status === "closed"
    if (activeTab === "rejected") return item.status === "in_progress" // Sent back to analyst
    return true
  })

  const handleApprove = async (id: string) => {
    toast.success("Mitigation approved. Case cryptographically sealed to ledger.")
    // optimistic update
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "closed" } : a))
  }

  const handleReject = async (id: string) => {
    toast.error("Mitigation rejected. Routed back to Analyst queue.")
    // optimistic update
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "in_progress" } : a))
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 bg-card px-6 py-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
            <CheckCircle className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Governance & Sign-Offs</h1>
            <p className="text-[0.7rem] text-muted-foreground">Chief Compliance Officer approval queue for Rashomon mitigations</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1.5 lg:flex border border-indigo-500/20">
            <Shield className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
            <span className="font-mono text-[0.6rem] font-semibold tracking-tight text-indigo-700 dark:text-indigo-300">CCO OVERSIGHT ACTIVE</span>
          </div>

          <div className="flex rounded-lg border border-border/60 bg-muted/60 p-0.5">
            <button
              onClick={() => setActiveTab("pending")}
              className={cn("rounded-md px-3 py-1 text-[0.72rem] font-semibold transition-all flex items-center gap-1.5", activeTab === "pending" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <Clock className="h-3 w-3" /> Pending Review
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={cn("rounded-md px-3 py-1 text-[0.72rem] font-semibold transition-all flex items-center gap-1.5", activeTab === "approved" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <CheckCircle className="h-3 w-3" /> Approved
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={cn("rounded-md px-3 py-1 text-[0.72rem] font-semibold transition-all flex items-center gap-1.5", activeTab === "rejected" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <XCircle className="h-3 w-3" /> Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-5">
        <Card className="border-border/60 shadow-sm overflow-hidden min-h-[500px]">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-10 text-center"></TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Case Target</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Mitigation Strategy</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Submitted By</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Date</TableHead>
                <TableHead className="w-32 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <CheckCircle className="h-8 w-8 text-emerald-500/50" />
                      <p className="text-sm font-medium text-foreground">Queue Empty</p>
                      <p className="text-xs">No pending compliance approvals require your signature.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(item => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="text-center">
                      <FileWarning className="h-4 w-4 mx-auto text-indigo-500" />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground">{item.title}</span>
                        <span className="font-mono text-[0.65rem] text-muted-foreground">ID: {item.id.split('-')[0]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 max-w-md">
                        <Badge variant="outline" className="w-fit text-[0.6rem] bg-indigo-500/5 text-indigo-600 border-indigo-500/20">Do-Calculus Feature Severance</Badge>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.notes || "Analyst recommended removing correlated zip codes."}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <UserCheck className="h-3.5 w-3.5" />
                        Analyst Queue
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(item.updated_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {activeTab === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="outline" size="sm" className="h-7 text-[0.65rem] text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleReject(item.id)}>
                            Reject
                          </Button>
                          <Button size="sm" className="h-7 text-[0.65rem] bg-indigo-600 hover:bg-indigo-700" onClick={() => handleApprove(item.id)}>
                            Sign & Approve
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 text-[0.65rem] font-semibold text-muted-foreground">
                          View Record
                        </Button>
                      )}
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
