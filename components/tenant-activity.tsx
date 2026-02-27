import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function TenantActivity() {
  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-4">
        <Avatar className="mt-1">
          <AvatarImage src="/placeholder.svg?height=40&width=40" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="text-sm font-medium">John Doe</p>
          <p className="text-sm text-muted-foreground">Made a payment of $1,250.00 for Apartment 301</p>
          <p className="text-xs text-muted-foreground">Today, 10:15 AM</p>
        </div>
      </div>
      <div className="flex items-start space-x-4">
        <Avatar className="mt-1">
          <AvatarImage src="/placeholder.svg?height=40&width=40" />
          <AvatarFallback>MS</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="text-sm font-medium">Maria Smith</p>
          <p className="text-sm text-muted-foreground">Submitted a maintenance request for Apartment 205</p>
          <p className="text-xs text-muted-foreground">Yesterday, 3:45 PM</p>
        </div>
      </div>
      <div className="flex items-start space-x-4">
        <Avatar className="mt-1">
          <AvatarImage src="/placeholder.svg?height=40&width=40" />
          <AvatarFallback>RJ</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="text-sm font-medium">Robert Johnson</p>
          <p className="text-sm text-muted-foreground">Lease renewal confirmation for Villa 12</p>
          <p className="text-xs text-muted-foreground">2 days ago</p>
        </div>
      </div>
      <div className="flex items-start space-x-4">
        <Avatar className="mt-1">
          <AvatarImage src="/placeholder.svg?height=40&width=40" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="text-sm font-medium">Amanda Lee</p>
          <p className="text-sm text-muted-foreground">Updated contact information for Office 405</p>
          <p className="text-xs text-muted-foreground">3 days ago</p>
        </div>
      </div>
    </div>
  )
}
