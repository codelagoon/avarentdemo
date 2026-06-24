import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Key, Copy, Check, Plus, AlertTriangle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/hooks/useUser"

interface ApiKey {
  id: string
  name: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

export function TenantApiKeyManager() {
  const { companyId } = useUser()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [rawKey, setRawKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (companyId) {
      fetchKeys()
    }
  }, [companyId])

  const fetchKeys = async () => {
    try {
      const res = await fetch(`/api/v1/keys?companyId=${companyId}`)
      if (res.ok) {
        const data = await res.json()
        setKeys(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleGenerate = async () => {
    if (!newKeyName || !companyId) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName, companyId })
      })
      
      if (res.ok) {
        const data = await res.json()
        setRawKey(data.raw_key)
        setKeys([data.key, ...keys])
        setNewKeyName("")
        toast.success("API Key generated successfully")
      } else {
        toast.error("Failed to generate API key")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error generating API key")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/keys?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("API Key revoked")
        fetchKeys()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const copyToClipboard = () => {
    if (rawKey) {
      navigator.clipboard.writeText(rawKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Key className="h-4 w-4 text-primary" />
          Ingestion API Keys
        </h3>
        <p className="text-xs text-muted-foreground">
          Manage API keys used to securely transmit `decision_events` from your LOS or underwriting engine to Avarent.
        </p>
      </div>

      {rawKey && (
        <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-bold">Copy your new API key</span>
          </div>
          <p className="text-xs text-orange-700/80 dark:text-orange-300/80">
            Make sure to copy your personal access token now. You won't be able to see it again!
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono text-foreground border border-orange-500/30">
              {rawKey}
            </code>
            <Button variant="outline" size="icon" onClick={copyToClipboard} className="shrink-0 border-orange-500/30">
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="w-full text-xs text-orange-700/80 hover:bg-orange-500/20" onClick={() => setRawKey(null)}>
            I have copied this key safely
          </Button>
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">New Key Name</Label>
          <Input 
            placeholder="e.g. Encompass Production Webhook" 
            value={newKeyName} 
            onChange={(e) => setNewKeyName(e.target.value)}
            className="h-9 text-xs"
          />
        </div>
        <Button onClick={handleGenerate} disabled={!newKeyName || isGenerating} className="h-9 text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Generate Key
        </Button>
      </div>

      <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Created</TableHead>
              <TableHead className="text-xs">Last Used</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">
                  No API keys generated yet.
                </TableCell>
              </TableRow>
            ) : (
              keys.map((key) => (
                <TableRow key={key.id} className={key.revoked_at ? "opacity-50" : ""}>
                  <TableCell className="text-xs font-medium">{key.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {new Date(key.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell>
                    {key.revoked_at ? (
                      <Badge variant="destructive" className="text-[0.6rem]">Revoked</Badge>
                    ) : (
                      <Badge variant="default" className="text-[0.6rem] bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!key.revoked_at && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleRevoke(key.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
