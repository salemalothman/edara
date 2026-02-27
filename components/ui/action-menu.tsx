"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

export interface ActionItem {
  label: string
  onClick: () => void
  variant?: "default" | "destructive"
  separator?: boolean
}

export interface ActionGroup {
  label?: string
  items: ActionItem[]
}

interface ActionMenuProps {
  actions: ActionGroup[]
  align?: "start" | "end" | "center"
  side?: "top" | "right" | "bottom" | "left"
  triggerLabel?: string
}

export function ActionMenu({ actions, align = "end", side = "bottom", triggerLabel = "Open menu" }: ActionMenuProps) {
  const { t } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">{triggerLabel}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side}>
        {actions.map((group, groupIndex) => (
          <div key={groupIndex}>
            {group.label && <DropdownMenuLabel>{group.label}</DropdownMenuLabel>}
            {group.items.map((item, itemIndex) => (
              <div key={itemIndex}>
                <DropdownMenuItem
                  onClick={item.onClick}
                  className={item.variant === "destructive" ? "text-red-600" : undefined}
                >
                  {item.label}
                </DropdownMenuItem>
                {item.separator && <DropdownMenuSeparator />}
              </div>
            ))}
            {groupIndex < actions.length - 1 && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
