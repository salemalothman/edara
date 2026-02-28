"use client"

import { Building2, MapPin, Home, Pencil, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchPropertyById } from "@/lib/services/properties"
import { fetchUnitsByProperty } from "@/lib/services/units"
import { fetchTenantsByProperty } from "@/lib/services/tenants"
import Link from "next/link"

export function PropertyDetailContent({ propertyId }: { propertyId: string }) {
  const { t } = useLanguage()
  const { formatCurrency } = useFormatter()
  const { data: property, loading } = useSupabaseQuery(() => fetchPropertyById(propertyId), [propertyId])
  const { data: units } = useSupabaseQuery(() => fetchUnitsByProperty(propertyId), [propertyId])
  const { data: tenants } = useSupabaseQuery(() => fetchTenantsByProperty(propertyId), [propertyId])

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BackToDashboard route="/properties" />
        <p className="text-muted-foreground">Property not found.</p>
      </div>
    )
  }

  const occupiedUnits = units.filter((u: any) => u.status === "occupied").length
  const vacantUnits = units.filter((u: any) => u.status === "vacant").length

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <BackToDashboard route="/properties" />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{property.name}</h2>
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {property.address}, {property.city}, {property.state} {property.zip}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/properties/${propertyId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {t("common.edit")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("properties.type")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-sm capitalize">{property.type}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("properties.totalUnits")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{property.units}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Occupied / Vacant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className="text-green-600">{occupiedUnits}</span>
              {" / "}
              <span className="text-yellow-600">{vacantUnits}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.tenants")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
      </div>

      {property.description && (
        <Card>
          <CardHeader>
            <CardTitle>{t("properties.description")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{property.description}</p>
          </CardContent>
        </Card>
      )}

      {property.size && (
        <Card>
          <CardHeader>
            <CardTitle>Size</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{property.size} sqft</p>
          </CardContent>
        </Card>
      )}

      {property.amenities && Object.keys(property.amenities).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(property.amenities)
                .filter(([, enabled]) => enabled)
                .map(([amenity]) => (
                  <Badge key={amenity} variant="secondary" className="capitalize">
                    {amenity.replace(/_/g, " ")}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Units</CardTitle>
              <CardDescription>Units in this property</CardDescription>
            </div>
            <Link href={`/properties/${propertyId}/units`}>
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {units.length === 0 ? (
              <p className="text-muted-foreground text-sm">No units found.</p>
            ) : (
              <div className="space-y-2">
                {units.slice(0, 5).map((unit: any) => (
                  <div key={unit.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{unit.name}</span>
                      {unit.floor && <span className="text-sm text-muted-foreground">Floor {unit.floor}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {unit.rent_amount && (
                        <span className="text-sm">{formatCurrency(Number(unit.rent_amount))}</span>
                      )}
                      <Badge variant={unit.status === "occupied" ? "default" : "secondary"} className="capitalize">
                        {unit.status || "vacant"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {units.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{units.length - 5} more units
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("common.tenants")}</CardTitle>
              <CardDescription>Tenants in this property</CardDescription>
            </div>
            <Link href={`/properties/${propertyId}/tenants`}>
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <p className="text-muted-foreground text-sm">No tenants found.</p>
            ) : (
              <div className="space-y-2">
                {tenants.slice(0, 5).map((tenant: any) => (
                  <div key={tenant.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <span className="font-medium">{tenant.first_name} {tenant.last_name}</span>
                      {tenant.unit?.name && (
                        <span className="text-sm text-muted-foreground ml-2 rtl:mr-2 rtl:ml-0">
                          {tenant.unit.name}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{tenant.email}</span>
                  </div>
                ))}
                {tenants.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{tenants.length - 5} more tenants
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
