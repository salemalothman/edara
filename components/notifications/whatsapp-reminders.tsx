"use client"

import { useState } from "react"
import { MessageSquare, Send, RefreshCw, ExternalLink, Phone, Trash2, Calendar, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import {
  generateWhatsAppReminders,
  fetchWhatsAppReminders,
  sendWhatsAppReminder,
  deleteWhatsAppReminder,
  getWhatsAppLink,
  buildReminderMessage,
} from "@/lib/services/whatsapp-reminders"

export function WhatsAppReminders() {
  const { toast } = useToast()
  const { data: reminderLogs, loading: loadingLogs, refetch: refetchLogs } = useSupabaseQuery(fetchWhatsAppReminders)
  const [scanning, setScanning] = useState(false)
  const [pendingReminders, setPendingReminders] = useState<any[]>([])
  const [sendingId, setSendingId] = useState<string | null>(null)

  const handleScan = async () => {
    setScanning(true)
    try {
      const reminders = await generateWhatsAppReminders(5)
      setPendingReminders(reminders)
      if (reminders.length === 0) {
        toast({
          title: "No Reminders Needed",
          description: "No pending invoices due within 5 days, or all tenants have already been reminded.",
        })
      } else {
        toast({
          title: "Reminders Found",
          description: `${reminders.length} tenant${reminders.length > 1 ? "s" : ""} with payments due within 5 days`,
        })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to scan invoices", variant: "destructive" })
    } finally {
      setScanning(false)
    }
  }

  const handleSend = async (reminder: any) => {
    setSendingId(reminder.invoiceId)
    try {
      const link = await sendWhatsAppReminder(
        reminder.invoiceId,
        reminder.tenantId || "",
        reminder.phone,
        reminder.message
      )
      // Open WhatsApp in a new tab
      window.open(link, "_blank")
      // Remove from pending list
      setPendingReminders((prev) => prev.filter((r) => r.invoiceId !== reminder.invoiceId))
      refetchLogs()
      toast({
        title: "WhatsApp Opened",
        description: `Reminder for ${reminder.tenantName} opened in WhatsApp`,
      })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to send reminder", variant: "destructive" })
    } finally {
      setSendingId(null)
    }
  }

  const handleSendAll = async () => {
    for (const reminder of pendingReminders) {
      await handleSend(reminder)
      // Small delay between opens to avoid browser blocking popups
      await new Promise((r) => setTimeout(r, 800))
    }
  }

  const handleDeleteLog = async (id: string) => {
    try {
      await deleteWhatsAppReminder(id)
      refetchLogs()
    } catch {}
  }

  const handleResend = (log: any) => {
    const tenantName = log.tenant ? `${log.tenant.first_name} ${log.tenant.last_name}` : "Tenant"
    const message = log.message || buildReminderMessage(
      tenantName,
      log.invoice?.invoice_number || "",
      log.invoice?.amount || 0,
      log.invoice?.due_date || ""
    )
    const link = getWhatsAppLink(log.phone, message)
    window.open(link, "_blank")
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            WhatsApp Payment Reminders
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleScan} disabled={scanning}>
            <RefreshCw className={`mr-1 h-4 w-4 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning..." : "Scan Due Invoices"}
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            This tool scans for pending invoices due within <strong>5 days</strong> and lets you send
            payment reminders to tenants via WhatsApp. Click &quot;Scan Due Invoices&quot; to find tenants that need reminders.
          </p>
        </CardContent>
      </Card>

      {/* Pending Reminders to Send */}
      {pendingReminders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Pending Reminders</CardTitle>
                <CardDescription>{pendingReminders.length} tenant{pendingReminders.length > 1 ? "s" : ""} to remind</CardDescription>
              </div>
              {pendingReminders.length > 1 && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleSendAll}>
                  <Send className="mr-1 h-4 w-4" /> Send All via WhatsApp
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingReminders.map((r) => (
              <div
                key={r.invoiceId}
                className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{r.tenantName}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {r.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> {r.amount.toFixed(3)} KWD
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Due: {r.dueDate}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Invoice: {r.invoiceNumber}</p>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                  onClick={() => handleSend(r)}
                  disabled={sendingId === r.invoiceId}
                >
                  <Send className="mr-1 h-3.5 w-3.5" />
                  {sendingId === r.invoiceId ? "Sending..." : "Send"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reminder History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reminder History</CardTitle>
          <CardDescription>Previously sent WhatsApp reminders</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : reminderLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm font-medium">No reminders sent yet</p>
              <p className="text-xs mt-1">Scan for due invoices to start sending reminders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminderLogs.map((log: any) => {
                const tenantName = log.tenant
                  ? `${log.tenant.first_name} ${log.tenant.last_name}`
                  : "Unknown"
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-sm">{tenantName}</p>
                        <Badge
                          variant="outline"
                          className={
                            log.status === "sent"
                              ? "bg-green-100 text-green-800 text-xs"
                              : log.status === "failed"
                                ? "bg-red-100 text-red-800 text-xs"
                                : "bg-yellow-100 text-yellow-800 text-xs"
                          }
                        >
                          {log.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {log.phone}
                        </span>
                        {log.invoice && (
                          <>
                            <span>{log.invoice.invoice_number}</span>
                            <span>{log.invoice.amount?.toFixed(3)} KWD</span>
                          </>
                        )}
                        {log.sent_at && (
                          <span>
                            {new Date(log.sent_at).toLocaleDateString()} {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-600"
                        onClick={() => handleResend(log)}
                        title="Resend via WhatsApp"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-600"
                        onClick={() => handleDeleteLog(log.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
