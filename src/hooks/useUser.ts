import { useState, useEffect } from "react"
import { companyService } from "@/services/companyService"

export function useUser() {
  const [companyId, setCompanyId] = useState<string | null>(null)

  useEffect(() => {
    // In a real application, this might subscribe to an auth context.
    // For now, we pull from the companyService which manages the local tenant state.
    const id = companyService.getActiveCompanyId()
    setCompanyId(id)
  }, [])

  return { companyId }
}
