import { useState, useMemo } from "react"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  const allReviews = useMemo(() => adverseActionService.getAllReviews(), [])
  
  const filteredReviews = useMemo(() => {
    return allReviews.filter(review => {
      const matchesFilter = filter === "all" || review.status === filter
      const matchesSearch = 
        review.applicantName.toLowerCase().includes(search.toLowerCase()) ||
        review.applicantId.toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [allReviews, filter, search])

  const stats = useMemo(() => adverseActionService.getStats(), [])

  const handleApprove = () => {
    if (!selectedReview) return
    adverseActionService.approveReview(selectedReview.id, "Sarah Chen", "Approved as generated - CFPB compliant")
    toast.success("Review approved")
    // Refresh
    setSelectedReview(adverseActionService.getReview(selectedReview.id) || null)
  }

  const handleOverride = () => {
    if (!selectedReview || !customNarrative || !overrideReason) {
      toast.error("Please provide custom narrative and override reason")
      return
    }
    adverseActionService.overrideReview(selectedReview.id, "Sarah Chen", customNarrative, overrideReason)
    toast.success("Review overridden")
    setOverrideReason("")
    setCustomNarrative("")
    setSelectedReview(adverseActionService.getReview(selectedReview.id) || null)
  }

  const handleSend = () => {
    if (!selectedReview) return
    adverseActionService.markAsSent(selectedReview.id)
    toast.success("Adverse Action Notice sent")
    setSelectedReview(adverseActionService.getReview(selectedReview.id) || null)
  }

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Left Panel - Queue */}
      <div className="w-80 flex flex-col gap-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Overridden</p>
              <p className="text-2xl font-bold">{stats.overridden}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Sent</p>
              <p className="text-2xl font-bold">{stats.sent}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applicants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
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
          </CardContent>
        </Card>

        {/* Queue List */}
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Review Queue ({filteredReviews.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-3 overflow-y-auto h-full">
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
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Detail */}
      <div className="flex-1">
        {selectedReview ? (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {selectedReview.applicantName}
                  </CardTitle>
                  <CardDescription>
                    {selectedReview.applicantId} • Reviewed {selectedReview.reviewedAt 
                      ? new Date(selectedReview.reviewedAt).toLocaleDateString()
                      : "Pending"
                    }
                  </CardDescription>
                </div>
                <Badge className={cn(
                  selectedReview.status === "approved" && "bg-green-100 text-green-800",
                  selectedReview.status === "overridden" && "bg-orange-100 text-orange-800",
                  selectedReview.status === "sent" && "bg-blue-100 text-blue-800",
                  selectedReview.status === "pending_review" && "bg-yellow-100 text-yellow-800",
                )}>
                  {selectedReview.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto space-y-6">
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

              {/* Override Section */}
              {selectedReview.status === "pending_review" && (
                <div className="border-t pt-4 space-y-4">
                  <h4 className="text-sm font-semibold">Override Narrative (Optional)</h4>
                  <Textarea
                    placeholder="Enter custom adverse action narrative..."
                    value={customNarrative}
                    onChange={(e) => setCustomNarrative(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Textarea
                    placeholder="Reason for override (required, min 10 chars)..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>
              )}

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
            </CardContent>

            {/* Actions */}
            <div className="p-4 border-t flex items-center justify-between">
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
                      onClick={handleOverride}
                      disabled={!customNarrative || overrideReason.length < 10}
                      className="gap-2"
                    >
                      <TrendingDown className="h-4 w-4" />
                      Override
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
          <Card className="h-full flex items-center justify-center border-dashed">
            <div className="text-center text-muted-foreground p-8">
              <p className="text-sm font-medium text-slate-400">Select a review from the queue</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
