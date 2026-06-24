"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  EMPTY_APPLICATION_CONTEXT,
  type ApplicationContext,
} from "@/lib/identity/types"
import { hydrateWorkflowCacheFromApi, clearWorkflowCache } from "@/lib/workflows/client-store"

export interface IdentityContextValue extends ApplicationContext {
  refresh: () => Promise<void>
}

const IdentityContext = createContext<IdentityContextValue | null>(null)

export interface IdentityProviderProps {
  children: ReactNode
  initialContext?: ApplicationContext
}

export function IdentityProvider({
  children,
  initialContext,
}: IdentityProviderProps) {
  const [context, setContext] = useState<ApplicationContext>(
    initialContext ?? EMPTY_APPLICATION_CONTEXT
  )

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/identity/context")
      if (!response.ok) {
        clearWorkflowCache()
        setContext({ ...EMPTY_APPLICATION_CONTEXT, is_loading: false })
        return
      }
      const data = (await response.json()) as ApplicationContext
      setContext({ ...data, is_loading: false })
    } catch {
      clearWorkflowCache()
      setContext({ ...EMPTY_APPLICATION_CONTEXT, is_loading: false })
    }
  }, [])

  useEffect(() => {
    if (context.organization_id && context.user_id) {
      void hydrateWorkflowCacheFromApi()
    } else {
      clearWorkflowCache()
    }
  }, [context.organization_id, context.user_id])

  const value = useMemo<IdentityContextValue>(
    () => ({
      ...context,
      refresh,
    }),
    [context, refresh]
  )

  return (
    <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>
  )
}

export function useIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityContext)
  if (!ctx) {
    throw new Error("useIdentity must be used within IdentityProvider")
  }
  return ctx
}

/** Tenant scope for organization-aware repository calls (AVA-17). */
export function useTenantScope() {
  const { user_id, organization_id, role } = useIdentity()
  if (!user_id || !organization_id || !role) return null
  return { organization_id, user_id, role }
}

/** Safe accessor when provider may not be mounted (e.g. during auth gate). */
export function useOptionalIdentity(): IdentityContextValue | null {
  return useContext(IdentityContext)
}
