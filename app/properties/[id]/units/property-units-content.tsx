"use client"

import { Home, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { useToast } from "@/hooks/use-toast"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchPropertyById } from "@/lib/services/properties"
import { fetchUnitsByProperty, updateUnit, deleteUnit } from "@/lib/services/units"
import { AddUnitDialog } from "@/components/units/add-unit-dialog"

export function PropertyUnitsContent({ propertyId }: { propertyId: string }) {
  const { t } = useLanguage()
  const { formatCurrency } = useFormatter()
  const { toast } = useToast()
  const { data: property, loading: loadingProperty } = useSupabaseQuery(() => fetchPropertyById(propertyId), [propertyId])
  const { data: units, loading: loadingUnits, refetch } = useSupabaseQuery(() => fetchUnitsByProperty(propertyId), [propertyId])

  const loading = loadingProperty || loadingUnits

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateUnit(id, { status: newStatus })
      refetch()
      toast({ title: "Success", description: `Unit status updated to ${newStatus}` })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to update status", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return
    try {
      await deleteUnit(id)
      refetch()
      toast({ title: "Success", description: "Unit deleted" })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to delete unit", variant: "destructive" })
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <BackToDashboard route={`/properties/${propertyId}`} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {loading ? <Skeleton className="h-8 w-48 inline-block" /> : `${property?.name} — Units`}
          </h2>
        </div>
        <AddUnitDialog propertyId={propertyId} onSuccess={refetch} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Units</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12" /> : units.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Occupied</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? <Skeleton className="h-7 w-12" /> : units.filter((u: any) => u.status === "occupied").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vacant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {loading ? <Skeleton className="h-7 w-12" /> : units.filter((u: any) => u.status === "vacant" || !u.status).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Units</CardTitle>
          <CardDescription>Units in this property</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right rtl:text-left">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : units.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No units found. Click &quot;Add Unit&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                units.map((unit: any) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        {unit.name}
                      </div>
                    </TableCell>
                    <TableCell>{unit.floor || "—"}</TableCell>
                    <TableCell>{unit.size ? `${unit.size} sqft` : "—"}</TableCell>
                    <TableCell>{unit.rent_amount ? formatCurrency(Number(unit.rent_amount)) : "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={unit.status === "occupied" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {unit.status || "vacant"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right rtl:text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Change Status</DropdownMenuLabel>
                          {unit.status !== "vacant" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(unit.id, "vacant")}>
                              Mark as Vacant
                            </DropdownMenuItem>
                          )}
                          {unit.status !== "occupied" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(unit.id, "occupied")}>
                              Mark as Occupied
                            </DropdownMenuItem>
                          )}
                          {unit.status !== "maintenance" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(unit.id, "maintenance")}>
                              Under Maintenance
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(unit.id)}>
                            Delete Unit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
