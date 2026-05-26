import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Database,
  Shuffle,
  Wand2,
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import {
  parseApplicationsCSV,
  importApplications,
  downloadSampleTemplate,
  type ImportedApplication,
  type ImportResult,
  type LoanType,
} from "@/services/dataImportService"
import { generateTestCSV, downloadGeneratedCSV } from "@/services/csvGeneratorService"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const LOAN_TYPES: { value: LoanType; label: string }[] = [
  { value: "mortgage", label: "Mortgage" },
  { value: "auto", label: "Auto Loan" },
  { value: "personal", label: "Personal Loan" },
  { value: "business", label: "Business Loan" },
  { value: "credit_card", label: "Credit Card" },
  { value: "student", label: "Student Loan" },
  { value: "home_equity", label: "Home Equity" },
]

export function DataImportDialog() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("generate")
  const [csvContent, setCsvContent] = useState("")
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType>("personal")
  const [parsedApps, setParsedApps] = useState<ImportedApplication[] | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generator state
  const [genCount, setGenCount] = useState(25)
  const [genLoanType, setGenLoanType] = useState<LoanType | "mixed">("mixed")
  const [genProxyRate, setGenProxyRate] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCsvContent(content)
      parseContent(content)
    }
    reader.readAsText(file)
  }

  const parseContent = (content: string) => {
    setIsParsing(true)
    try {
      const apps = parseApplicationsCSV(content)
      // Override loan type for all imported apps
      apps.forEach((app) => {
        app.loanType = selectedLoanType
        app.loanTypeLabel = LOAN_TYPES.find((t) => t.value === selectedLoanType)?.label || "Loan"
      })
      setParsedApps(apps)
      toast.success(`Parsed ${apps.length} applications`)
    } catch (error) {
      toast.error(`Failed to parse CSV: ${error}`)
      setParsedApps(null)
    }
    setIsParsing(false)
  }

  const handleImport = () => {
    if (!parsedApps || parsedApps.length === 0) {
      toast.error("No applications to import")
      return
    }

    setIsImporting(true)
    const result = importApplications(parsedApps)
    setImportResult(result)
    setIsImporting(false)

    if (result.success && result.imported > 0) {
      toast.success(`Successfully imported ${result.imported} applications`)
    }
  }

  const handleDownloadTemplate = () => {
    downloadSampleTemplate()
  }

  const handleGenerate = (mode: "load" | "download") => {
    setIsGenerating(true)
    try {
      const csv = generateTestCSV({
        count: genCount,
        loanType: genLoanType,
        seed: Math.floor(Math.random() * 0xffffffff),
        proxyInjectionRate: genProxyRate / 100,
      })
      if (mode === "load") {
        setCsvContent(csv)
        setSelectedLoanType(genLoanType === "mixed" ? "personal" : genLoanType as LoanType)
        parseContent(csv)
        setActiveTab("upload")
        toast.success(`Generated ${genCount} realistic applicants — ready to preview`)
      } else {
        const label = `${genCount}-${genLoanType}`
        downloadGeneratedCSV(csv, label)
        toast.success(`Downloaded ${genCount}-row CSV`)
      }
    } catch (e) {
      toast.error(`Generation failed: ${e}`)
    }
    setIsGenerating(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Import Application Data
          </DialogTitle>
          <DialogDescription>
            Import loan applications from CSV for fair lending analysis. Supports mortgage, auto, personal, business loans, and credit cards.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generate">Generate CSV</TabsTrigger>
            <TabsTrigger value="upload">Upload / Paste</TabsTrigger>
            <TabsTrigger value="preview" disabled={!parsedApps}>
              Preview
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!importResult}>
              Results
            </TabsTrigger>
          </TabsList>

          {/* ── Generate tab ──────────────────────────────────── */}
          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-5">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-indigo-500" />
                  <p className="text-sm font-semibold">Realistic Test Data Generator</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Generates statistically realistic applicant profiles using log-normal income distributions
                  (HMDA 2025) and Gaussian credit score sampling (mu=695, sigma=85).
                  Names are drawn from demographically diverse pools matching US Census proportions.
                </p>

                <Separator />

                {/* Row count */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Number of Applicants</label>
                    <span className="font-mono text-sm font-bold text-indigo-600">{genCount}</span>
                  </div>
                  <Slider
                    min={5} max={200} step={5}
                    value={[genCount]}
                    onValueChange={([v]) => setGenCount(v)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[0.65rem] text-muted-foreground">
                    <span>5 (quick test)</span>
                    <span>200 (stress test)</span>
                  </div>
                </div>

                {/* Loan type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Loan Type</label>
                  <Select value={genLoanType} onValueChange={(v) => setGenLoanType(v as LoanType | "mixed")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed (all types)</SelectItem>
                      {LOAN_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Proxy injection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Proxy ZIP Injection Rate</label>
                      <p className="text-[0.65rem] text-muted-foreground">Fraction of records with known redlined ZIP codes for adversarial testing</p>
                    </div>
                    <span className={cn(
                      "font-mono text-sm font-bold",
                      genProxyRate === 0 ? "text-emerald-600" : genProxyRate < 30 ? "text-amber-600" : "text-rose-600"
                    )}>{genProxyRate}%</span>
                  </div>
                  <Slider
                    min={0} max={80} step={5}
                    value={[genProxyRate]}
                    onValueChange={([v]) => setGenProxyRate(v)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[0.65rem] text-muted-foreground">
                    <span>0% — clean dataset</span>
                    <span>80% — heavy proxy injection</span>
                  </div>
                </div>

                <Separator />

                {/* Preview stats */}
                <div className="rounded-lg border bg-slate-50 dark:bg-slate-900 p-3 grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Rows", value: genCount },
                    { label: "Columns", value: 13 },
                    { label: "Proxy Rows", value: Math.round(genCount * genProxyRate / 100) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xl font-black tabular-nums text-slate-800 dark:text-slate-100">{value}</p>
                      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => handleGenerate("load")}
                    disabled={isGenerating}
                  >
                    {isGenerating
                      ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      : <Shuffle className="h-4 w-4" />
                    }
                    Generate and Load
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleGenerate("download")}
                    disabled={isGenerating}
                  >
                    <Download className="h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            {/* Loan Type Selector */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Loan Type for Import</label>
                  <Select
                    value={selectedLoanType}
                    onValueChange={(v) => {
                      setSelectedLoanType(v as LoanType)
                      if (csvContent) parseContent(csvContent)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOAN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    All imported applications will be processed as{" "}
                    {LOAN_TYPES.find((t) => t.value === selectedLoanType)?.label} applications.
                  </p>
                </div>

                <Separator />

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload CSV File</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Choose File
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {csvContent ? "File loaded" : "No file selected"}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Manual CSV Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Or paste CSV content</label>
                  <Textarea
                    placeholder="applicantName,applicantId,age,income,creditScore,loanAmount,loanType,zipCode,employmentYears...
John Smith,APP-001,32,85000,745,250000,mortgage,90210,8..."
                    value={csvContent}
                    onChange={(e) => {
                      setCsvContent(e.target.value)
                      if (e.target.value.trim()) {
                        parseContent(e.target.value)
                      }
                    }}
                    className="font-mono text-xs min-h-[150px]"
                  />
                </div>

                <Separator />

                {/* Template Download */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Need a template?
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Sample CSV
                  </Button>
                </div>

                {/* Parse Status */}
                {parsedApps && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">
                      {parsedApps.length} applications ready to import
                    </span>
                  </div>
                )}

                <Button
                  onClick={() => setActiveTab("preview")}
                  disabled={!parsedApps || parsedApps.length === 0}
                  className="w-full"
                >
                  Preview Applications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {parsedApps && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{parsedApps.length} Applications Ready</p>
                    <p className="text-sm text-muted-foreground">
                      Loan Type: {LOAN_TYPES.find((t) => t.value === selectedLoanType)?.label}
                    </p>
                  </div>
                  <Button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="gap-2"
                  >
                    {isImporting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Import to Ledger
                      </>
                    )}
                  </Button>
                </div>

                <ScrollArea className="h-[400px] border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-right">Credit Score</th>
                        <th className="px-4 py-2 text-right">Income</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedApps.map((app, i) => (
                        <tr
                          key={app.id}
                          className={cn(
                            "border-b",
                            i % 2 === 0 ? "bg-white" : "bg-muted/30"
                          )}
                        >
                          <td className="px-4 py-2">{app.applicantName}</td>
                          <td className="px-4 py-2 font-mono text-xs">
                            {app.applicantId}
                          </td>
                          <td className="px-4 py-2 text-right">
                            ${app.loanAmount.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Badge
                              variant={
                                app.creditScore >= 740
                                  ? "default"
                                  : app.creditScore >= 670
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {app.creditScore}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-right">
                            ${app.income.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {importResult && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    {importResult.failed === 0 ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-semibold text-lg">
                        Import {importResult.failed === 0 ? "Successful" : "Completed with Issues"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {importResult.imported} imported, {importResult.failed} failed
                      </p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
                      <ul className="text-sm text-red-700 space-y-1">
                        {importResult.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li>...and {importResult.errors.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {importResult.imported}
                      </p>
                      <p className="text-sm text-green-700">Successfully Imported</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-600">
                        {importResult.failed}
                      </p>
                      <p className="text-sm text-gray-700">Failed</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setOpen(false)
                      // Navigate to ledger
                      window.dispatchEvent(
                        new KeyboardEvent("keydown", { key: "3" })
                      )
                    }}
                    className="w-full"
                  >
                    View in Evidence Ledger
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
