"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { useLanguage } from "@/hooks/use-language"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, Building2, MailOpen, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const { signUp, user } = useAuth()
  const { refetchOrg } = useOrganization()
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Step management: 1 = account creation, 2 = org setup
  const [step, setStep] = useState(1)

  // Step 1 fields
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Step 2 fields
  const [orgMode, setOrgMode] = useState<"create" | "join">("create")
  const [orgName, setOrgName] = useState("")
  const [inviteCode, setInviteCode] = useState("")

  // Shared state
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Pre-populate invite code from URL query param
  useEffect(() => {
    const invite = searchParams.get("invite")
    if (invite) {
      setInviteCode(invite)
      setOrgMode("join")
    }
  }, [searchParams])

  // If user is already authenticated, skip to step 2
  useEffect(() => {
    if (user && step === 1) {
      setStep(2)
    }
  }, [user, step])

  const handleAccountCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signUp(email, password, fullName)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Auto-sign in to continue to step 2
    const signInResult = await supabase.auth.signInWithPassword({ email, password })
    if (signInResult.error) {
      // If sign-in fails (e.g. email confirmation required), show success message
      setError("")
      setLoading(false)
      setStep(2)
      return
    }

    setLoading(false)
    setStep(2)
  }

  const handleOrgSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (orgMode === "create") {
      const { error: rpcError } = await supabase.rpc("create_org_and_join", {
        org_name: orgName,
      })
      if (rpcError) {
        setError(rpcError.message)
        setLoading(false)
        return
      }
    } else {
      const { error: rpcError } = await supabase.rpc("accept_invitation", {
        invitation_token: inviteCode,
      })
      if (rpcError) {
        setError(rpcError.message)
        setLoading(false)
        return
      }
    }

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

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${
              step === 1 ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"
            }`}>
              {step > 1 ? <CheckCircle className="h-4 w-4" /> : "1"}
            </div>
            <div className="w-8 h-0.5 bg-border" />
            <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${
              step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              2
            </div>
          </div>

          <CardTitle className="text-2xl">
            {step === 1 ? t("auth.createAccount") : t("auth.setupWorkspace")}
          </CardTitle>
          <CardDescription>
            {step === 1 ? t("auth.createAccountDesc") : t("auth.setupWorkspaceDesc")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <form onSubmit={handleAccountCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    dir="ltr"
                    className="pe-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4 animate-spin" />}
                {t("auth.continueToWorkspace")}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                {t("auth.haveAccount")}{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  {t("auth.signIn")}
                </Link>
              </p>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOrgSetup} className="space-y-4">
              {orgMode === "create" ? (
                <>
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

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4 animate-spin" />}
                    {t("onboarding.createOrg")}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => { setOrgMode("join"); setError("") }}
                  >
                    <MailOpen className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t("onboarding.haveInviteCode")}
                  </Button>
                </>
              ) : (
                <>
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

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4 animate-spin" />}
                    {t("onboarding.joinOrg")}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => { setOrgMode("create"); setError("") }}
                  >
                    <Building2 className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t("onboarding.createOrg")}
                  </Button>
                </>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
