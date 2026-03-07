"use client"

import { MainNav } from "@/components/main-nav"
import { Search } from "@/components/search"
import { UserNav } from "@/components/user-nav"
import { Logo } from "@/components/logo"
import { Bell } from "lucide-react"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchUnreadCount } from "@/lib/services/notifications"
import { cn } from "@/lib/utils"

export function DashboardHeader() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  const isActive = pathname !== "/"

  useEffect(() => {
    fetchUnreadCount().then(setUnreadCount)
  }, [])

  return (
    <div
      className={cn(
        "border-b transition-colors duration-200",
        isActive
          ? "bg-primary/5 border-b-2 border-primary/20 dark:bg-primary/10"
          : "bg-background"
      )}
    >
      <div className="flex h-16 items-center px-4">
        <Logo size="md" className="mr-4 rtl:ml-4 rtl:mr-0" />
        <MainNav className="mx-6" />
        <div className="ml-auto rtl:mr-auto rtl:ml-0 flex items-center space-x-4 rtl:space-x-reverse">
          <Search />

          <Button variant="ghost" size="icon" className="relative" onClick={() => {
            const tabsTrigger = document.querySelector('[data-value="notifications"]') as HTMLElement
            tabsTrigger?.click()
          }}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 rtl:right-auto rtl:-left-1 h-5 min-w-[20px] px-1 text-xs flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>

          <UserNav />
        </div>
      </div>
    </div>
  )
}
