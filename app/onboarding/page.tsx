"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { Loader2 } from "lucide-react"

export default function OnboardingPage() {
  const { user } = useAuth()
  const { organization, loading } = useOrganization()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (organization) {
      // User already has an org — go to dashboard
      router.replace("/")
    } else {
      // No org (or not authenticated) — send to unified signup
      router.replace("/signup")
    }
  }, [user, organization, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
