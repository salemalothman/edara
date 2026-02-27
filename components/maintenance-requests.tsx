import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function MaintenanceRequests() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <p className="font-medium">Plumbing Issue - Apartment 301</p>
          <p className="text-sm text-muted-foreground">Reported by: John Doe</p>
          <p className="text-xs text-muted-foreground">Today, 9:30 AM</p>
        </div>
        <div className="flex flex-col items-end">
          <Badge className="mb-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">In Progress</Badge>
          <Button variant="outline" size="sm">
            Update
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <p className="font-medium">AC Repair - Villa 12</p>
          <p className="text-sm text-muted-foreground">Reported by: Robert Johnson</p>
          <p className="text-xs text-muted-foreground">Yesterday, 2:15 PM</p>
        </div>
        <div className="flex flex-col items-end">
          <Badge className="mb-2 bg-blue-100 text-blue-800 hover:bg-blue-100">Assigned</Badge>
          <Button variant="outline" size="sm">
            Update
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <p className="font-medium">Electrical Issue - Office 405</p>
          <p className="text-sm text-muted-foreground">Reported by: Amanda Lee</p>
          <p className="text-xs text-muted-foreground">2 days ago</p>
        </div>
        <div className="flex flex-col items-end">
          <Badge className="mb-2 bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Lock Replacement - Shop 3</p>
          <p className="text-sm text-muted-foreground">Reported by: David Wilson</p>
          <p className="text-xs text-muted-foreground">3 days ago</p>
        </div>
        <div className="flex flex-col items-end">
          <Badge className="mb-2 bg-red-100 text-red-800 hover:bg-red-100">Pending</Badge>
          <Button variant="outline" size="sm">
            Assign
          </Button>
        </div>
      </div>
    </div>
  )
}
