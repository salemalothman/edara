"use client"

import type React from "react"

import { useState } from "react"
import { Filter, Download, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PropertyFilters } from "@/components/properties/property-filters"
import { AddPropertyDialog } from "@/components/properties/add-property-dialog"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function PropertiesContent() {
  const { t } = useLanguage()
  const { formatCurrency, formatPercentage, formatNumberWithUnit } = useFormatter()
  const { toast } = useToast()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  // Action handlers
  const handleViewDetails = (propertyId: string) => {
    router.push(`/properties/${propertyId}`)
  }

  const handleEditProperty = (propertyId: string) => {
    router.push(`/properties/${propertyId}/edit`)
  }

  const handleViewUnits = (propertyId: string) => {
    router.push(`/properties/${propertyId}/units`)
  }

  const handleViewTenants = (propertyId: string) => {
    router.push(`/properties/${propertyId}/tenants`)
  }

  const handleDeleteProperty = (propertyId: string, propertyName: string) => {
    if (window.confirm(`Are you sure you want to delete ${propertyName}? This action cannot be undone.`)) {
      // Simulate API call
      setTimeout(() => {
        toast({
          title: "Property Deleted",
          description: `${propertyName} has been successfully deleted.`,
        })
      }, 500)
    }
  }

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your data is being exported. You'll be notified when it's ready to download.",
    })

    // Simulate export process
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully.",
      })
    }, 2000)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Search Results",
      description: `Showing results for "${searchQuery}"`,
    })
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BackToDashboard />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("properties.title")}</h2>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <AddPropertyDialog />
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">{t("properties.allProperties")}</TabsTrigger>
            <TabsTrigger value="residential">{t("properties.residential")}</TabsTrigger>
            <TabsTrigger value="commercial">{t("properties.commercial")}</TabsTrigger>
            <TabsTrigger value="vacant">{t("properties.vacantUnits")}</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <PropertyFilters />
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {t("common.export")}
            </Button>
          </div>
        </div>
        <TabsContent value="all" className="space-y-4">
          <div className="flex items-center justify-between">
            <form onSubmit={handleSearch} className="flex flex-1 items-center space-x-2 rtl:space-x-reverse">
              <Input
                placeholder={t("properties.searchProperties")}
                className="h-9 w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline" size="sm" className="h-9" type="submit">
                <Filter className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                {t("common.filter")}
              </Button>
            </form>
          </div>
          <Card>
            <CardHeader className="p-4">
              <CardTitle>{t("properties.allProperties")}</CardTitle>
              <CardDescription>{t("properties.manageProperties")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("properties.propertyName")}</TableHead>
                    <TableHead>{t("properties.address")}</TableHead>
                    <TableHead>{t("properties.type")}</TableHead>
                    <TableHead>{t("properties.units")}</TableHead>
                    <TableHead>{t("properties.occupancy")}</TableHead>
                    <TableHead>{t("properties.monthlyRevenue")}</TableHead>
                    <TableHead className="text-right rtl:text-left">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Sunset Towers</TableCell>
                    <TableCell>123 Main St, City, State</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t("properties.residential")}</Badge>
                    </TableCell>
                    <TableCell>{formatNumberWithUnit(24, "units")}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div className="h-2 rounded-full bg-primary" style={{ width: "92%" }}></div>
                        </div>
                        <span className="ml-2 rtl:mr-2 rtl:ml-0 text-xs">{formatPercentage(0.92)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(42500)}</TableCell>
                    <TableCell className="text-right rtl:text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Open menu">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails("sunset-towers")}>
                            {t("properties.viewDetails")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditProperty("sunset-towers")}>
                            {t("properties.editProperty")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewUnits("sunset-towers")}>
                            {t("properties.viewUnits")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewTenants("sunset-towers")}>
                            {t("properties.viewTenants")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteProperty("sunset-towers", "Sunset Towers")}
                          >
                            {t("properties.deleteProperty")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Ocean View Apartments</TableCell>
                    <TableCell>456 Beach Rd, Coastal City, State</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t("properties.residential")}</Badge>
                    </TableCell>
                    <TableCell>{formatNumberWithUnit(18, "units")}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div className="h-2 rounded-full bg-primary" style={{ width: "83%" }}></div>
                        </div>
                        <span className="ml-2 rtl:mr-2 rtl:ml-0 text-xs">{formatPercentage(0.83)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(36200)}</TableCell>
                    <TableCell className="text-right rtl:text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                          <DropdownMenuItem>{t("properties.viewDetails")}</DropdownMenuItem>
                          <DropdownMenuItem>{t("properties.editProperty")}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>{t("properties.viewUnits")}</DropdownMenuItem>
                          <DropdownMenuItem>{t("properties.viewTenants")}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">{t("properties.deleteProperty")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Downtown Business Center</TableCell>
                    <TableCell>789 Commerce Ave, Metro City, State</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t("properties.commercial")}</Badge>
                    </TableCell>
                    <TableCell>{formatNumberWithUnit(12, "units")}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div className="h-2 rounded-full bg-primary" style={{ width: "75%" }}></div>
                        </div>
                        <span className="ml-2 rtl:mr-2 rtl:ml-0 text-xs">{formatPercentage(0.75)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(28800)}</TableCell>
                    <TableCell className="text-right rtl:text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                          <DropdownMenuItem>{t("properties.viewDetails")}</DropdownMenuItem>
                          <DropdownMenuItem>{t("properties.editProperty")}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>{t("properties.viewUnits")}</DropdownMenuItem>
                          <DropdownMenuItem>{t("properties.viewTenants")}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">{t("properties.deleteProperty")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Parkside Residences</TableCell>
                    <TableCell>321 Park Lane, Green City, State</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t("properties.residential")}</Badge>
                    </TableCell>
                    <TableCell>{formatNumberWithUnit(32, "units")}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div className="h-2 rounded-full bg-primary" style={{ width: "88%" }}></div>
                        </div>
                        <span className="ml-2 rtl:mr-2 rtl:ml-0 text-xs">{formatPercentage(0.88)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(52800)}</TableCell>
                    <TableCell className="text-right rtl:text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                          <DropdownMenuItem>{t("properties.viewDetails")}</DropdownMenuItem>
                          <DropdownMenuItem>{t("properties.editProperty")}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>{t("properties.viewUnits")}</DropdownMenuItem>
                          <DropdownMenuItem>{t("properties.viewTenants")}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">{t("properties.deleteProperty")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Retail Plaza</TableCell>
                    <TableCell>555 Shopping Blvd, Market City, State</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t("properties.commercial")}</Badge>
                    </TableCell>
                    <TableCell>{formatNumberWithUnit(8, "units")}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div className="h-2 rounded-full bg-primary" style={{ width: "100%" }}></div>
                        </div>
                        <span className="ml-2 rtl:mr-2 rtl:ml-0 text-xs">{formatPercentage(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(32000)}</TableCell>
                    <TableCell className="text-right rtl:text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                          <DropdownMenuItem>{t("properties.viewDetails")}</DropdownMenuItem>
                          <DropdownMenuItem>{t("properties.editProperty")}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>{t("properties.viewUnits")}</DropdownMenuItem>
                          <DropdownMenuItem>{t("properties.viewTenants")}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">{t("properties.deleteProperty")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="residential" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("properties.residential")}</CardTitle>
              <CardDescription>View and manage your residential properties</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Residential properties content would go here */}
              <div className="text-center py-4 text-muted-foreground">
                Residential properties would be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="commercial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("properties.commercial")}</CardTitle>
              <CardDescription>View and manage your commercial properties</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Commercial properties content would go here */}
              <div className="text-center py-4 text-muted-foreground">
                Commercial properties would be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="vacant" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("properties.vacantUnits")}</CardTitle>
              <CardDescription>View and manage your vacant units</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Vacant units content would go here */}
              <div className="text-center py-4 text-muted-foreground">Vacant units would be displayed here</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
