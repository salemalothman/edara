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

const typeConfig: Record<string, { label: string; color: string; border: string }> = {
  payment_overdue: { label: "Overdue Payment", color: "bg-red-100 text-red-800", border: "border-red-500" },
  payment_reminder: { label: "Payment Reminder", color: "bg-yellow-100 text-yellow-800", border: "border-yellow-500" },
  maintenance_update: { label: "Maintenance", color: "bg-blue-100 text-blue-800", border: "border-blue-500" },
  lease_expiring: { label: "Lease Expiring", color: "bg-purple-100 text-purple-800", border: "border-purple-500" },
  lease_expired: { label: "Lease Expired", color: "bg-orange-100 text-orange-800", border: "border-orange-500" },
  system: { label: "System", color: "bg-gray-100 text-gray-800", border: "border-gray-500" },
}

const settingLabels: Record<string, string> = {
  payment_overdue: "Overdue Payments",
  payment_reminder: "Payment Reminders",
  maintenance_update: "Maintenance Updates",
  lease_expiring: "Lease Expiring Soon",
  lease_expired: "Lease Expired",
  system: "System Alerts",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function NotificationsTab() {
  const { toast } = useToast()
  const { data: notifications, loading, refetch } = useSupabaseQuery(fetchNotifications)
  const { settings, toggleSetting, isEnabled } = useNotificationSettings()
  const [typeFilter, setTypeFilter] = useState("all")
  const [isGenerating, setIsGenerating] = useState(false)

  const unreadCount = notifications.filter((n: any) => !n.is_read).length

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
        title: "Notifications Generated",
        description: count > 0 ? `${count} new notification${count > 1 ? "s" : ""} created` : "No new notifications to generate",
      })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to generate notifications", variant: "destructive" })
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
      toast({ title: "Done", description: "All notifications marked as read" })
    } catch {}
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id)
      refetch()
    } catch {}
  }

  const handleClearAll = async () => {
    if (!window.confirm("Clear all notifications?")) return
    try {
      await clearAllNotifications()
      refetch()
      toast({ title: "Done", description: "All notifications cleared" })
    } catch {}
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unreadCount} unread</Badge>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="mr-1 h-4 w-4" /> Mark All Read
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
            <RefreshCw className={`mr-1 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Scanning..." : "Scan & Generate"}
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
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs mt-1">Click &quot;Scan &amp; Generate&quot; to check for new alerts</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {filtered.map((n: any) => {
                const cfg = typeConfig[n.type] || typeConfig.system
                return (
                  <Card
                    key={n.id}
                    className={`border-l-4 ${cfg.border} ${n.is_read ? "opacity-60" : ""} transition-opacity`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                              {cfg.label}
                            </Badge>
                            {!n.is_read && (
                              <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                            )}
                            <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
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
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMarkRead(n.id)} title="Mark as read">
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={() => handleDelete(n.id)} title="Delete">
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
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear All
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Settings Panel — 1 column */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Notification Settings</CardTitle>
            <CardDescription>Choose which notifications to show</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(settingLabels).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`setting-${key}`} className="text-sm cursor-pointer">{label}</Label>
                <Switch
                  id={`setting-${key}`}
                  checked={settings[key as keyof typeof settings]}
                  onCheckedChange={() => toggleSetting(key as keyof typeof settings)}
                />
              </div>
            ))}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Settings are saved locally on this device.
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
