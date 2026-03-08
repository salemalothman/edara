"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/hooks/use-language"
import { useOrganization } from "@/contexts/organization-context"
import { usePermissions } from "@/hooks/use-permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { Loader2, UserPlus, Trash2, Shield, Eye, Copy, Building2 } from "lucide-react"

type Member = {
  id: string
  user_id: string
  role: string
  created_at: string
  user_email?: string
  user_full_name?: string
}

type Invitation = {
  id: string
  email: string
  role: string
  status: string
  token: string
  expires_at: string
}

export function SettingsContent() {
  const { t } = useLanguage()
  const { organization, orgId, isAdmin } = useOrganization()
  const { canEdit } = usePermissions()
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<string>("viewer")
  const [inviting, setInviting] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const fetchData = async () => {
    if (!orgId) {
      setLoading(false)
      return
    }

    // Try RPC first (returns emails + names), fall back to direct table query
    let membersData: Member[] = []
    const rpcRes = await supabase.rpc("get_org_members_with_email", { org_id: orgId })
    if (rpcRes.data && !rpcRes.error) {
      membersData = rpcRes.data as Member[]
    } else {
      // Fallback: query table directly (no emails/names)
      const tableRes = await supabase
        .from("organization_members")
        .select("id, user_id, role, created_at")
        .eq("organization_id", orgId)
        .order("created_at")
      if (tableRes.data) {
        membersData = tableRes.data as Member[]
      }
    }
    setMembers(membersData)

    const invitationsRes = await supabase
      .from("invitations")
      .select("id, email, role, status, token, expires_at")
      .eq("organization_id", orgId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (invitationsRes.data) {
      setInvitations(invitationsRes.data)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [orgId])

  const handleInvite = async () => {
    if (!orgId || !inviteEmail) return
    setInviting(true)

    const { data, error } = await supabase.from("invitations").insert({
      organization_id: orgId,
      email: inviteEmail,
      role: inviteRole,
    }).select("token").single()

    if (error) {
      alert(error.message)
      setInviting(false)
      return
    }

    // Send invitation email via Edge Function (best-effort, don't block on failure)
    if (data?.token) {
      supabase.functions.invoke("send-invite-email", {
        body: {
          email: inviteEmail,
          token: data.token,
          orgName: organization?.name || "",
          role: inviteRole,
        },
      }).catch(() => {
        // Edge function may not be deployed yet — invitation still works via token copy
      })
    }

    setInviteEmail("")
    setInviteRole("viewer")
    setInviteDialogOpen(false)
    fetchData()
    setInviting(false)
  }

  const handleChangeRole = async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from("organization_members")
      .update({ role: newRole })
      .eq("id", memberId)

    if (error) {
      alert(error.message)
    } else {
      fetchData()
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", memberId)

    if (error) {
      alert(error.message)
    } else {
      fetchData()
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    const { error } = await supabase
      .from("invitations")
      .delete()
      .eq("id", invitationId)

    if (error) {
      alert(error.message)
    } else {
      fetchData()
    }
  }

  const copyInviteToken = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BackToDashboard />
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("navigation.settings")}</h2>
          <p className="text-muted-foreground">{t("settings.manageOrg")}</p>
        </div>
      </div>

      {/* Organization Info */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">{t("organization.name")}</CardTitle>
            <CardDescription>{t("settings.orgInfoDesc")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">{organization?.name}</p>
              <p className="text-sm text-muted-foreground">{t("settings.orgId")}: {organization?.slug}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-xl">{t("organization.team")}</CardTitle>
            <CardDescription>
              {members.length} {t("organization.members")}
            </CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 me-2" />
                  {t("organization.invite")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("organization.invite")}</DialogTitle>
                  <DialogDescription>{t("organization.inviteDesc")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>{t("auth.email")}</Label>
                    <Input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      type="email"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("organization.role")}</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{t("organization.admin")}</SelectItem>
                        <SelectItem value="viewer">{t("organization.viewer")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="w-full">
                    {inviting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                    {t("organization.sendInvite")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {member.role === "admin" ? (
                      <Shield className="h-4 w-4 text-primary" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {member.user_full_name || member.user_email || member.user_id.slice(0, 8)}
                    </p>
                    {member.user_full_name && member.user_email && (
                      <p className="text-sm text-muted-foreground mt-1" dir="ltr">
                        {member.user_email}
                      </p>
                    )}
                    <Badge variant={member.role === "admin" ? "default" : "secondary"} className="text-xs mt-1">
                      {t(`organization.${member.role}`)}
                    </Badge>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(val) => handleChangeRole(member.id, val)}
                    >
                      <SelectTrigger className="w-28 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{t("organization.admin")}</SelectItem>
                        <SelectItem value="viewer">{t("organization.viewer")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {isAdmin && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t("organization.pendingInvitations")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium" dir="ltr">{inv.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {t(`organization.${inv.role}`)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {t("organization.expires")}: {new Date(inv.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyInviteToken(inv.token)}
                      title={t("organization.copyToken")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {copiedToken === inv.token && (
                      <span className="text-xs text-green-600">{t("common.copied")}</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleCancelInvitation(inv.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
