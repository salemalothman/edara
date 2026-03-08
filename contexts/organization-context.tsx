"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"

type Organization = {
  id: string
  name: string
  slug: string
}

type OrganizationContextType = {
  organization: Organization | null
  orgId: string | null
  role: "admin" | "viewer" | null
  isAdmin: boolean
  loading: boolean
  refetchOrg: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

// Pages that don't require org membership
const PUBLIC_PATHS = ["/login", "/signup", "/onboarding"]

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [role, setRole] = useState<"admin" | "viewer" | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const fetchMembership = useCallback(async () => {
    if (!user || !session) {
      setOrganization(null)
      setRole(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase.rpc("get_my_membership")

    if (error || !data || data.length === 0) {
      setOrganization(null)
      setRole(null)
      setLoading(false)

      // Redirect to onboarding if not on a public path
      if (!PUBLIC_PATHS.includes(pathname)) {
        router.replace("/onboarding")
      }
      return
    }

    const row = data[0]
    setOrganization({ id: row.org_id, name: row.org_name, slug: row.org_slug })
    setRole(row.role as "admin" | "viewer")
    setLoading(false)
  }, [user, session, pathname, router])

  useEffect(() => {
    fetchMembership()
  }, [user, session])

  const refetchOrg = useCallback(async () => {
    await fetchMembership()
  }, [fetchMembership])

  // Don't block rendering on public pages
  if (PUBLIC_PATHS.includes(pathname)) {
    return (
      <OrganizationContext.Provider
        value={{ organization, orgId: organization?.id ?? null, role, isAdmin: role === "admin", loading, refetchOrg }}
      >
        {children}
      </OrganizationContext.Provider>
    )
  }

  // Show loading while checking membership
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <OrganizationContext.Provider
      value={{ organization, orgId: organization?.id ?? null, role, isAdmin: role === "admin", loading, refetchOrg }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error("useOrganization must be used within an OrganizationProvider")
  }
  return context
}
