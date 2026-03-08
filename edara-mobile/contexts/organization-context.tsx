import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './auth-context'

type Organization = {
  id: string
  name: string
  slug: string
}

type OrganizationContextType = {
  organization: Organization | null
  orgId: string | null
  role: 'admin' | 'viewer' | null
  isAdmin: boolean
  loading: boolean
  refetchOrg: () => void
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [role, setRole] = useState<'admin' | 'viewer' | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMembership = async () => {
    if (!user || !session) {
      setOrganization(null)
      setRole(null)
      setLoading(false)
      return
    }

    const { data, error } = await supabase.rpc('get_my_membership')

    if (error || !data || data.length === 0) {
      setOrganization(null)
      setRole(null)
    } else {
      const row = data[0]
      setOrganization({ id: row.org_id, name: row.org_name, slug: row.org_slug })
      setRole(row.role as 'admin' | 'viewer')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMembership()
  }, [user, session])

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        orgId: organization?.id ?? null,
        role,
        isAdmin: role === 'admin',
        loading,
        refetchOrg: fetchMembership,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}
