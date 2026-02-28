"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchMaintenanceRequests } from "@/lib/services/maintenance"
import { useFormatter } from "@/hooks/use-formatter"

export function MaintenanceRequests() {
  const { data: requests, loading } = useSupabaseQuery(fetchMaintenanceRequests)
  const { formatDate } = useFormatter()

  // Show the 4 most recent requests
  const recent = requests.slice(0, 4)

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between border-b pb-3">
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (recent.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No maintenance requests found</p>
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 hover:bg-green-100"
      case "in_progress": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "assigned": return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "pending": return "bg-red-100 text-red-800 hover:bg-red-100"
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "completed": return "Completed"
      case "in_progress": return "In Progress"
      case "assigned": return "Assigned"
      case "pending": return "Pending"
      default: return status?.replace("_", " ") || "Pending"
    }
  }

  return (
    <div className="space-y-4">
      {recent.map((req: any, idx: number) => (
        <div
          key={req.id}
          className={`flex items-center justify-between ${idx < recent.length - 1 ? "border-b pb-3" : ""}`}
        >
          <div>
            <p className="font-medium">
              {req.title}
              {req.property?.name ? ` — ${req.property.name}` : ""}
            </p>
            {req.category && (
              <p className="text-sm text-muted-foreground">{req.category}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {req.created_at ? formatDate(new Date(req.created_at)) : ""}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <Badge className={statusBadge(req.status)}>{statusLabel(req.status)}</Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
