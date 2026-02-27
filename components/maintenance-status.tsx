"use client"

import { useTheme } from "next-themes"

export function MaintenanceStatus() {
  const { theme } = useTheme()

  // Modern minimalist color palette
  const colors = {
    pending: theme === "dark" ? "#FB7185" : "#F43F5E", // Soft red
    assigned: theme === "dark" ? "#FBBF24" : "#F59E0B", // Amber
    inProgress: theme === "dark" ? "#60A5FA" : "#3B82F6", // Primary blue
    done: theme === "dark" ? "#4ADE80" : "#22C55E", // Green
    text: theme === "dark" ? "#94A3B8" : "#64748B", // Muted text color
  }

  return (
    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
      <div className="flex items-center">
        <div className="mr-1 rtl:ml-1 rtl:mr-0 h-2 w-2 rounded-full" style={{ backgroundColor: colors.pending }}></div>
        <span className="text-muted-foreground">7 pending</span>
      </div>
      <div className="flex items-center">
        <div className="mr-1 rtl:ml-1 rtl:mr-0 h-2 w-2 rounded-full" style={{ backgroundColor: colors.assigned }}></div>
        <span className="text-muted-foreground">5 assigned</span>
      </div>
      <div className="flex items-center">
        <div
          className="mr-1 rtl:ml-1 rtl:mr-0 h-2 w-2 rounded-full"
          style={{ backgroundColor: colors.inProgress }}
        ></div>
        <span className="text-muted-foreground">3 in progress</span>
      </div>
      <div className="flex items-center">
        <div className="mr-1 rtl:ml-1 rtl:mr-0 h-2 w-2 rounded-full" style={{ backgroundColor: colors.done }}></div>
        <span className="text-muted-foreground">45 done</span>
      </div>
    </div>
  )
}
