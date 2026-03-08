"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { useLanguage } from "@/hooks/use-language"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Building2, MailOpen } from "lucide-react"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { refetchOrg } = useOrganization()
  const router = useRouter()
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose")
  const [orgName, setOrgName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { data, error: rpcError } = await supabase.rpc("create_org_and_join", {
      org_name: orgName,
    })

    if (rpcError) {
      setError(rpcError.message)
      setLoading(false)
      return
    }

    // Re-fetch organization membership so context has the new org
    await refetchOrg()
    router.replace("/")
  }

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error: rpcError } = await supabase.rpc("accept_invitation", {
      invitation_token: inviteCode,
    })

    if (rpcError) {
      setError(rpcError.message)
      setLoading(false)
      return
    }

    // Re-fetch organization membership so context has the joined org
    await refetchOrg()
    router.replace("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl">{t("onboarding.title")}</CardTitle>
          <CardDescription>{t("onboarding.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "choose" && (
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setMode("create")}
              >
                <Building2 className="h-6 w-6" />
                <span className="font-semibold">{t("onboarding.createOrg")}</span>
                <span className="text-xs text-muted-foreground">{t("onboarding.createOrgDesc")}</span>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setMode("join")}
              >
                <MailOpen className="h-6 w-6" />
                <span className="font-semibold">{t("onboarding.joinOrg")}</span>
                <span className="text-xs text-muted-foreground">{t("onboarding.joinOrgDesc")}</span>
              </Button>
            </div>
          )}

          {mode === "create" && (
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">{t("onboarding.propertyManagerName")}</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder={t("onboarding.orgNamePlaceholder")}
                  required
                />
                <p className="text-xs text-muted-foreground">{t("onboarding.propertyManagerHint")}</p>
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4 animate-spin" />}
                {t("onboarding.createOrg")}
              </Button>

              <Button type="button" variant="ghost" className="w-full" onClick={() => { setMode("choose"); setError("") }}>
                {t("common.back")}
              </Button>
            </form>
          )}

          {mode === "join" && (
            <form onSubmit={handleJoinOrg} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">{t("onboarding.inviteCode")}</Label>
                <Input
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder={t("onboarding.inviteCodePlaceholder")}
                  required
                  dir="ltr"
                />
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4 animate-spin" />}
                {t("onboarding.joinOrg")}
              </Button>

              <Button type="button" variant="ghost" className="w-full" onClick={() => { setMode("choose"); setError("") }}>
                {t("common.back")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
