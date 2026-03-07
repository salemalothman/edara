"use client"

import { Filter, Download, MoreHorizontal, Search } from "lucide-react"

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AddTenantDialog } from "@/components/tenants/add-tenant-dialog"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { useLanguage } from "@/hooks/use-language"

export default function TenantsClientPage() {
  const { t } = useLanguage()
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BackToDashboard />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("tenants.title")}</h2>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <AddTenantDialog />
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">{t("tenants.allTenants")}</TabsTrigger>
            <TabsTrigger value="active">{t("tenants.active")}</TabsTrigger>
            <TabsTrigger value="pending">{t("tenants.pending")}</TabsTrigger>
            <TabsTrigger value="former">{t("tenants.former")}</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {t("common.filter")}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {t("common.export")}
            </Button>
          </div>
        </div>
        <TabsContent value="all" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
              <Input placeholder="Search tenants..." className="h-9 w-[300px]" />
              <Button variant="outline" size="sm" className="h-9">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
          <Card>
            <CardHeader className="p-4">
              <CardTitle>All Tenants</CardTitle>
              <CardDescription>Manage your tenants and their information</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Property/Unit</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Lease Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Move-in Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Avatar className="h-9 w-9 mr-2">
                          <AvatarImage src="/placeholder.svg?height=36&width=36" alt="Avatar" />
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <div>
                          <div>John Doe</div>
                          <div className="text-xs text-muted-foreground">john.doe@example.com</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>Sunset Towers, Apt 301</TableCell>
                    <TableCell>(555) 123-4567</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Current</Badge>
                    </TableCell>
                    <TableCell>Jan 15, 2023</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit tenant</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>View lease</DropdownMenuItem>
                          <DropdownMenuItem>Payment history</DropdownMenuItem>
                          <DropdownMenuItem>Maintenance requests</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Terminate lease</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Avatar className="h-9 w-9 mr-2">
                          <AvatarImage src="/placeholder.svg?height=36&width=36" alt="Avatar" />
                          <AvatarFallback>MS</AvatarFallback>
                        </Avatar>
                        <div>
                          <div>Maria Smith</div>
                          <div className="text-xs text-muted-foreground">maria.smith@example.com</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>Ocean View Apartments, Unit 205</TableCell>
                    <TableCell>(555) 987-6543</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
                    </TableCell>
                    <TableCell>Mar 3, 2023</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit tenant</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>View lease</DropdownMenuItem>
                          <DropdownMenuItem>Payment history</DropdownMenuItem>
                          <DropdownMenuItem>Maintenance requests</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Terminate lease</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Avatar className="h-9 w-9 mr-2">
                          <AvatarImage src="/placeholder.svg?height=36&width=36" alt="Avatar" />
                          <AvatarFallback>RJ</AvatarFallback>
                        </Avatar>
                        <div>
                          <div>Robert Johnson</div>
                          <div className="text-xs text-muted-foreground">robert.johnson@example.com</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>Parkside Residences, Villa 12</TableCell>
                    <TableCell>(555) 456-7890</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>
                    </TableCell>
                    <TableCell>Nov 10, 2022</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit tenant</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>View lease</DropdownMenuItem>
                          <DropdownMenuItem>Payment history</DropdownMenuItem>
                          <DropdownMenuItem>Maintenance requests</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Terminate lease</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Avatar className="h-9 w-9 mr-2">
                          <AvatarImage src="/placeholder.svg?height=36&width=36" alt="Avatar" />
                          <AvatarFallback>AL</AvatarFallback>
                        </Avatar>
                        <div>
                          <div>Amanda Lee</div>
                          <div className="text-xs text-muted-foreground">amanda.lee@example.com</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>Downtown Business Center, Office 405</TableCell>
                    <TableCell>(555) 789-0123</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Current</Badge>
                    </TableCell>
                    <TableCell>Feb 22, 2023</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit tenant</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>View lease</DropdownMenuItem>
                          <DropdownMenuItem>Payment history</DropdownMenuItem>
                          <DropdownMenuItem>Maintenance requests</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Terminate lease</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Avatar className="h-9 w-9 mr-2">
                          <AvatarImage src="/placeholder.svg?height=36&width=36" alt="Avatar" />
                          <AvatarFallback>DW</AvatarFallback>
                        </Avatar>
                        <div>
                          <div>David Wilson</div>
                          <div className="text-xs text-muted-foreground">david.wilson@example.com</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>Retail Plaza, Shop 3</TableCell>
                    <TableCell>(555) 234-5678</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Current</Badge>
                    </TableCell>
                    <TableCell>Apr 5, 2023</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit tenant</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>View lease</DropdownMenuItem>
                          <DropdownMenuItem>Payment history</DropdownMenuItem>
                          <DropdownMenuItem>Maintenance requests</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Terminate lease</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Tenants</CardTitle>
              <CardDescription>View and manage your active tenants</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Active tenants content would go here */}
              <div className="text-center py-4 text-muted-foreground">Active tenants would be displayed here</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Tenants</CardTitle>
              <CardDescription>View and manage tenants with pending applications or move-ins</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Pending tenants content would go here */}
              <div className="text-center py-4 text-muted-foreground">Pending tenants would be displayed here</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="former" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Former Tenants</CardTitle>
              <CardDescription>View and manage your former tenants</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Former tenants content would go here */}
              <div className="text-center py-4 text-muted-foreground">Former tenants would be displayed here</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
