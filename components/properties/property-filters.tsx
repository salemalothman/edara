"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter } from "lucide-react"

export function PropertyFilters() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Filter Properties</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Property Type</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked>Residential</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>Commercial</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>Mixed-Use</DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Occupancy Status</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked>Fully Occupied</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>Partially Vacant</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>Fully Vacant</DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Location</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked>City Center</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>Suburban</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>Coastal</DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
