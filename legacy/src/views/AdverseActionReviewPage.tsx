import { useState, useMemo } from "react"
import { useLiveData } from "@legacy/hooks/useLiveData"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  CheckCircle, 
  XCircle, 
  Send, 
  Filter,
  Search,
  FileText,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Scale,
  User
} from "lucide-react"
import { 
  adverseActionService, 
  type AdverseActionReview 
} from "@/services/adverseActionService"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Review Queue Item
function ReviewQueueItem({ 
  review, 
  selected, 
  onClick 
}: { 
  review: AdverseActionReview; 
  selected: boolean;
  onClick: () => void;
}) {
  const statusColors = {
    pending_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    overridden: "bg-orange-100 text-orange-800 border-orange-200",
    sent: "bg-blue-100 text-blue-800 border-blue-200",
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all",
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        review.status === "pending_review" && "border-l-4 border-l-yellow-400"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{review.applicantName}</p>
          <p className="text-xs text-muted-foreground">{review.applicantId}</p>
        </div>
        <Badge className={cn("text-xs shrink-0", statusColors[review.status])}>
          {review.status.replace("_", " ")}
        </Badge>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Scale className="h-3 w-3" />
        <span>Plain Language: {review.narrative.plainLanguageScore}/100</span>
        {review.narrative.cfpbCompliant && (
          <Badge variant="outline" className="text-xs ml-auto">CFPB OK</Badge>
        )}
      </div>
    </div>
  )
}

// SHAP Feature Display
function SHAPDisplay({ shapRankings }: { shapRankings: AdverseActionReview["shapRankings"] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-muted-foreground tracking-wider">
        Raw SHAP Rankings (Translator-Only Policy)
      </h4>
      <div className="space-y-1.5">
        {shapRankings.slice(0, 5).map((shap, i) => (
          <div 
            key={i}
            className="flex items-center gap-3 p-2 rounded bg-secondary/50"
          >
            <span className="text-xs font-mono w-6 text-muted-foreground">
              #{shap.rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{shap.description}</p>
              <p className="text-xs text-muted-foreground">{shap.feature}</p>
            </div>
            <div className={cn(
              "text-sm font-semibold",
              shap.contribution > 0 ? "text-green-600" : "text-red-600"
            )}>
              {shap.contribution > 0 ? "+" : ""}
              {(shap.contribution * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main Review Page
export default function AdverseActionReviewPage() {
  const [selectedReview, setSelectedReview] = useState<AdverseActionReview | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "overridden" | "sent">("all")
  const [search, setSearch] = useState("")
  const [overrideReason, setOverrideReason] = useState("")
  const [customNarrative, setCustomNarrative] = useState("")
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false)

  const allReviews = useLiveData(() => adverseActionService.getAllReviews(), ["adverseAction"])

  const filteredReviews = useMemo(() => {
    return allReviews.filter(review => {
      const matchesFilter = filter === "all" || review.status === filter
      const matchesSearch =
        review.applicantName.toLowerCase().includes(search.toLowerCase()) ||
        review.applicantId.toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [allReviews, filter, search])

  const stats = useLiveData(() => adverseActionService.getStats(), ["adverseAction"])

  const handleApprove = async () => {
    if (!selectedReview) return
    await adverseActionService.approveReview(selectedReview.id, "Sarah Chen", "Approved as generated - CFPB compliant")
    toast.success("Review approved")
    setSelectedReview(prev => prev ? adverseActionService.getReview(prev.id) || null : null)
  }

  const handleOverride = async () => {
    if (!selectedReview || !customNarrative || !overrideReason) {
      toast.error("Please provide custom narrative and override reason")
      return
    }
    await adverseActionService.overrideReview(selectedReview.id, "Sarah Chen", customNarrative, overrideReason)
    toast.success("Review overridden")
    setOverrideReason("")
    setCustomNarrative("")
    setSelectedReview(prev => prev ? adverseActionService.getReview(prev.id) || null : null)
  }

  const handleSend = async () => {
    if (!selectedReview) return
    await adverseActionService.markAsSent(selectedReview.id)
    toast.success("Adverse Action Notice sent")
    setSelectedReview(prev => prev ? adverseActionService.getReview(prev.id) || null : null)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 bg-card px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Scale className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Adverse Action Review</h1>
            <p className="text-[0.7rem] text-muted-foreground">ECOA / CFPB adverse action notice review · SHAP-to-plain-language translation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: "Pending", value: stats.pending, color: "text-yellow-600 dark:text-yellow-400" },
            { label: "Approved", value: stats.approved, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Overridden", value: stats.overridden, color: "text-orange-600 dark:text-orange-400" },
            { label: "Sent", value: stats.sent, color: "text-primary" },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center px-3">
              <span className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</span>
              <span className="text-[0.62rem] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden p-4 min-h-0">
      {/* Left Panel - Queue */}
      <div className="flex w-72 flex-col gap-3 min-h-0 overflow-hidden">
        {/* Filters */}
        <Card className="border-border/60 shrink-0">
          <div className="space-y-2 p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search applicants…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="h-8 text-xs">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="overridden">Overridden</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Queue List */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-border/60">
          <div className="border-b border-border/40 px-3 py-2 shrink-0">
            <p className="text-xs font-semibold text-foreground">Review Queue ({filteredReviews.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 min-h-0">
            <div className="space-y-2">
              {filteredReviews.map((review) => (
                <ReviewQueueItem
                  key={review.id}
                  review={review}
                  selected={selectedReview?.id === review.id}
                  onClick={() => setSelectedReview(review)}
                />
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Right Panel - Detail */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {selectedReview ? (
          <Card className="flex h-full flex-col border-border/60 overflow-hidden min-h-0">
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedReview.applicantName}</p>
                  <p className="text-[0.68rem] text-muted-foreground">{selectedReview.applicantId} · {selectedReview.reviewedAt ? new Date(selectedReview.reviewedAt).toLocaleDateString() : "Pending"}</p>
                </div>
              </div>
              <span className={cn(
                "rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold capitalize shrink-0",
                selectedReview.status === "approved" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                selectedReview.status === "overridden" && "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
                selectedReview.status === "sent" && "border-primary/30 bg-primary/10 text-primary",
                selectedReview.status === "pending_review" && "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
              )}>
                {selectedReview.status.replace("_", " ")}
              </span>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-5 min-h-0">
              <Tabs defaultValue="side-by-side" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="side-by-side">Side-by-Side</TabsTrigger>
                  <TabsTrigger value="shap">SHAP Only</TabsTrigger>
                  <TabsTrigger value="narrative">Narrative Only</TabsTrigger>
                </TabsList>

                <TabsContent value="side-by-side" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <SHAPDisplay shapRankings={selectedReview.shapRankings} />
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground tracking-wider">
                        LLM Narrative Translation
                      </h4>
                      <div className="p-3 rounded-lg border bg-card">
                        <p className="text-sm leading-relaxed">{selectedReview.narrative.summary}</p>
                      </div>
                      <div className="space-y-1.5">
                        {selectedReview.narrative.behavioralExplanations.map((exp, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{exp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="shap">
                  <SHAPDisplay shapRankings={selectedReview.shapRankings} />
                </TabsContent>

                <TabsContent value="narrative" className="space-y-4">
                  <div className="p-4 rounded-lg border bg-card">
                    <h4 className="font-semibold mb-2">Adverse Action Notice</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedReview.finalNarrative || selectedReview.narrative.summary}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Plain Language Score</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-semibold">{selectedReview.narrative.plainLanguageScore}/100</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">CFPB Compliance</p>
                      {selectedReview.narrative.cfpbCompliant ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" /> Compliant
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" /> Non-Compliant
                        </Badge>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Override History */}
              {selectedReview.overrideReason && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-orange-800">Override History</p>
                  <p className="text-sm text-orange-700 mt-1">{selectedReview.overrideReason}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    by {selectedReview.reviewedBy} on {new Date(selectedReview.reviewedAt || "").toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-border/40 p-4 shrink-0">
              <div className="flex items-center gap-2">
                {selectedReview.status === "pending_review" && (
                  <>
                    <Button 
                      onClick={handleApprove}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setCustomNarrative(selectedReview.finalNarrative || selectedReview.narrative.summary)
                        setOverrideReason("")
                        setIsOverrideDialogOpen(true)
                      }}
                      className="gap-2"
                    >
                      <TrendingDown className="h-4 w-4" />
                      Override Notice
                    </Button>
                  </>
                )}
                {(selectedReview.status === "approved" || selectedReview.status === "overridden") && (
                  <Button 
                    onClick={handleSend}
                    variant="default"
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send Notice
                  </Button>
                )}
              </div>
              <Button variant="ghost" size="sm">
                <FileText className="h-4 w-4 mr-1.5" />
                Export Review
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="flex h-full items-center justify-center border-dashed border-border/60">
            <p className="text-sm text-muted-foreground">Select a review from the queue</p>
          </Card>
        )}
      </div>

      {/* Override Notice Dialog */}
      <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
        <DialogContent className="max-w-lg bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-semibold">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              Override Adverse Action Notice
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Provide a custom narrative explanation for the applicant and state the legal regulatory justification for this decision override.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Custom Narrative (Explanation for Applicant)</label>
              <Textarea
                placeholder="Enter custom adverse action narrative..."
                value={customNarrative}
                onChange={(e) => setCustomNarrative(e.target.value)}
                className="min-h-[120px] text-sm bg-card border-border/60"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Justification/Reason for Override (Required)</label>
              <Textarea
                placeholder="State the compliance or model justification (min 10 characters)..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="min-h-[80px] text-sm bg-card border-border/60"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOverrideDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleOverride()
                setIsOverrideDialogOpen(false)
              }}
              disabled={!customNarrative || overrideReason.trim().length < 10}
              className="text-xs bg-primary text-primary-foreground"
            >
              Confirm Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
