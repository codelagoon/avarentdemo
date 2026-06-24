import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Key, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ApiKeyDialogProps {
  onKeysSet?: () => void
}

export function ApiKeyDialog({ onKeysSet }: ApiKeyDialogProps) {
  const [open, setOpen] = useState(false)
  const [openrouterKey, setOpenrouterKey] = useState("")
  const [nvidiaKey, setNvidiaKey] = useState("")
  const [showOpenrouter, setShowOpenrouter] = useState(false)
  const [showNvidia, setShowNvidia] = useState(false)
  const [hasKeys, setHasKeys] = useState(false)

  useEffect(() => {
    // Check if keys are already stored
    const orKey = localStorage.getItem("avarent_openrouter_key")
    const nvKey = localStorage.getItem("avarent_nvidia_key")
    setHasKeys(!!orKey || !!nvKey)
    if (orKey) setOpenrouterKey(orKey)
    if (nvKey) setNvidiaKey(nvKey)
  }, [])

  const handleSave = () => {
    if (openrouterKey) {
      localStorage.setItem("avarent_openrouter_key", openrouterKey)
    }
    if (nvidiaKey) {
      localStorage.setItem("avarent_nvidia_key", nvidiaKey)
    }
    
    setHasKeys(true)
    setOpen(false)
    toast.success("API Keys Saved", {
      description: "Your keys are stored locally in the browser",
    })
    onKeysSet?.()
  }

  const handleClear = () => {
    localStorage.removeItem("avarent_openrouter_key")
    localStorage.removeItem("avarent_nvidia_key")
    setOpenrouterKey("")
    setNvidiaKey("")
    setHasKeys(false)
    toast.info("API Keys Cleared")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={hasKeys ? "outline" : "default"} 
          size="sm"
          className={cn(
            "gap-2",
            hasKeys && "border-green-500 text-green-600 hover:bg-green-50"
          )}
        >
          <Key className="h-4 w-4" />
          {hasKeys ? "API Keys Set" : "Add API Keys"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Bring Your Own API Key
          </DialogTitle>
          <DialogDescription>
            Add your OpenRouter or NVIDIA API keys to enable AI-powered credit decisions. 
            Keys are stored locally in your browser.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="openrouter" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
            <TabsTrigger value="nvidia">NVIDIA NIM</TabsTrigger>
          </TabsList>

          <TabsContent value="openrouter" className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-3 text-sm">
              <p className="font-medium text-blue-800">Free Models Available!</p>
              <p className="text-blue-600">
                OpenRouter offers free tier models including Gemma 2, Phi-3, Llama 3.1, and more. 
                No credit card required.
              </p>
              <a 
                href="https://openrouter.ai/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 inline-block text-blue-700 underline hover:text-blue-800"
              >
                Get OpenRouter API Key
              </a>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
              <div className="relative">
                <Input
                  id="openrouter-key"
                  type={showOpenrouter ? "text" : "password"}
                  placeholder="sk-or-v1-..."
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenrouter(!showOpenrouter)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showOpenrouter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {openrouterKey && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Key configured
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="nvidia" className="space-y-4">
            <div className="rounded-lg bg-green-50 p-3 text-sm">
              <p className="font-medium text-green-800">NVIDIA NIM</p>
              <p className="text-green-600">
                Use NVIDIA's hosted models including Llama 3.1, Mistral, and Nemotron.
                Requires NVIDIA API key.
              </p>
              <a 
                href="https://build.nvidia.com/explore/discover" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 inline-block text-green-700 underline hover:text-green-800"
              >
                Get NVIDIA API Key
              </a>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nvidia-key">NVIDIA API Key</Label>
              <div className="relative">
                <Input
                  id="nvidia-key"
                  type={showNvidia ? "text" : "password"}
                  placeholder="nvapi-..."
                  value={nvidiaKey}
                  onChange={(e) => setNvidiaKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNvidia(!showNvidia)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNvidia ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {nvidiaKey && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Key configured
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-sm">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <p className="text-yellow-700">
            Keys are stored in your browser's localStorage. Never share your API keys.
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <Button 
            onClick={handleSave} 
            className="flex-1"
            disabled={!openrouterKey && !nvidiaKey}
          >
            Save Keys
          </Button>
          {hasKeys && (
            <Button 
              variant="outline" 
              onClick={handleClear}
              className="text-red-600 hover:bg-red-50"
            >
              Clear
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper function to get stored keys
export function getStoredApiKeys(): { openrouter?: string; nvidia?: string } {
  if (typeof window === "undefined") return {}
  
  return {
    openrouter: localStorage.getItem("avarent_openrouter_key") || undefined,
    nvidia: localStorage.getItem("avarent_nvidia_key") || undefined,
  }
}

// Check if keys are configured
export function hasApiKeys(): boolean {
  if (typeof window === "undefined") return false
  
  const keys = getStoredApiKeys()
  return !!(keys.openrouter || keys.nvidia)
}
