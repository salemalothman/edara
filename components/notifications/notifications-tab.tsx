"use client"

import { useState } from "react"
import { Bell, BellOff, Check, CheckCheck, RefreshCw, Trash2, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/hooks/use-language"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { useNotificationSettings } from "@/hooks/use-notification-settings"
import {
  fetchNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
  generateNotifications,
} from "@/lib/services/notifications"
import { WhatsAppReminders } from "@/components/notifications/whatsapp-reminders"

const typeStyles: Record<string, { color: string; border: string }> = {
  payment_overdue: { color: "bg-red-100 text-red-800", border: "border-red-500" },
  payment_reminder: { color: "bg-yellow-100 text-yellow-800", border: "border-yellow-500" },
  maintenance_update: { color: "bg-blue-100 text-blue-800", border: "border-blue-500" },
  lease_expiring: { color: "bg-purple-100 text-purple-800", border: "border-purple-500" },
  lease_expired: { color: "bg-orange-100 text-orange-800", border: "border-orange-500" },
  system: { color: "bg-gray-100 text-gray-800", border: "border-gray-500" },
}

const typeTranslationKeys: Record<string, string> = {
  payment_overdue: "notifications.overduePayment",
  payment_reminder: "notifications.paymentReminder",
  maintenance_update: "notifications.maintenanceUpdate",
  lease_expiring: "notifications.leaseExpiring",
  lease_expired: "notifications.leaseExpired",
  system: "notifications.system",
}

const settingTranslationKeys: Record<string, string> = {
  payment_overdue: "notifications.overduePayments",
  payment_reminder: "notifications.paymentReminders",
  maintenance_update: "notifications.maintenanceUpdates",
  lease_expiring: "notifications.leaseExpiringSoon",
  lease_expired: "notifications.leaseExpiredLabel",
  system: "notifications.systemAlerts",
}

export function NotificationsTab() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const { data: notifications, loading, refetch } = useSupabaseQuery(fetchNotifications)
  const { settings, toggleSetting, isEnabled } = useNotificationSettings()
  const [typeFilter, setTypeFilter] = useState("all")
  const [isGenerating, setIsGenerating] = useState(false)

  const unreadCount = notifications.filter((n: any) => !n.is_read).length

  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return t("notifications.justNow")
    if (mins < 60) return `${mins}${t("notifications.minutesAgo")}`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}${t("notifications.hoursAgo")}`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}${t("notifications.daysAgo")}`
    return new Date(dateStr).toLocaleDateString()
  }

  // Filter notifications by type setting and type filter dropdown
  const filtered = notifications.filter((n: any) => {
    if (!isEnabled(n.type)) return false
    if (typeFilter !== "all" && n.type !== typeFilter) return false
    return true
  })

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const count = await generateNotifications()
      refetch()
      toast({
        title: t("notifications.generated"),
        description: count > 0 ? `${count} ${t("notifications.generatedNew")}` : t("notifications.generatedNone"),
      })
    } catch (err: any) {
      toast({ title: t("notifications.error"), description: err?.message || t("notifications.error"), variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      refetch()
    } catch {}
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllRead()
      refetch()
      toast({ title: t("notifications.done"), description: t("notifications.allMarkedRead") })
    } catch {}
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id)
      refetch()
    } catch {}
  }

  const handleClearAll = async () => {
    if (!window.confirm(t("notifications.clearAllConfirm"))) return
    try {
      await clearAllNotifications()
      refetch()
      toast({ title: t("notifications.done"), description: t("notifications.allCleared") })
    } catch {}
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("notifications.title")}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unreadCount} {t("notifications.unread")}</Badge>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder={t("notifications.filterByType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("notifications.allTypes")}</SelectItem>
              {Object.entries(typeTranslationKeys).map(([key, tKey]) => (
                <SelectItem key={key} value={key}>{t(tKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="mr-1 rtl:ml-1 rtl:mr-0 h-4 w-4" /> {t("notifications.markAllRead")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
            <RefreshCw className={`mr-1 rtl:ml-1 rtl:mr-0 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? t("notifications.scanning") : t("notifications.scanGenerate")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Notification Feed — 2 columns */}
        <div className="md:col-span-2 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BellOff className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm font-medium">{t("notifications.noNotifications")}</p>
                <p className="text-xs mt-1">{t("notifications.noNotificationsHint")}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {filtered.map((n: any) => {
                const styles = typeStyles[n.type] || typeStyles.system
                const typeLabel = t(typeTranslationKeys[n.type] || "notifications.system")
                return (
                  <Card
                    key={n.id}
                    className={`border-l-4 rtl:border-l-0 rtl:border-r-4 ${styles.border} ${n.is_read ? "opacity-60" : ""} transition-opacity`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-xs ${styles.color}`}>
                              {typeLabel}
                            </Badge>
                            {!n.is_read && (
                              <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                            )}
                            <span className="text-xs text-muted-foreground ml-auto rtl:mr-auto rtl:ml-0 flex-shrink-0">
                              {timeAgo(n.created_at)}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                          {(n.tenant || n.property) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {n.tenant && `${n.tenant.first_name} ${n.tenant.last_name}`}
                              {n.tenant && n.property && " · "}
                              {n.property && n.property.name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!n.is_read && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMarkRead(n.id)}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={() => handleDelete(n.id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {notifications.length > 0 && (
                <div className="flex justify-center pt-2">
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleClearAll}>
                    <Trash2 className="mr-1 rtl:ml-1 rtl:mr-0 h-3.5 w-3.5" /> {t("notifications.clearAll")}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Settings Panel — 1 column */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">{t("notifications.settings")}</CardTitle>
            <CardDescription>{t("notifications.settingsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(settingTranslationKeys).map(([key, tKey]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`setting-${key}`} className="text-sm cursor-pointer">{t(tKey)}</Label>
                <Switch
                  id={`setting-${key}`}
                  checked={settings[key as keyof typeof settings]}
                  onCheckedChange={() => toggleSetting(key as keyof typeof settings)}
                />
              </div>
            ))}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            {t("notifications.settingsSaved")}
          </CardFooter>
        </Card>
      </div>

      {/* WhatsApp Reminders Section */}
      <div className="border-t pt-6 mt-6">
        <WhatsAppReminders />
      </div>
    </div>
  )
}
