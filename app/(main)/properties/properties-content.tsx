"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Download, MoreHorizontal, Search, FileText, Upload, Trash2, X, Loader2 } from "lucide-react"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PropertyFilters, type PropertyFilterState } from "@/components/properties/property-filters"
import { AddPropertyDialog } from "@/components/properties/add-property-dialog"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ExportFormatDialog } from "@/components/ui/export-format-dialog"
import { downloadExport, type ExportFormat } from "@/utils/export"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchProperties, deleteProperty, uploadPropertyDocument, deletePropertyDocument } from "@/lib/services/properties"

export default function PropertiesContent() {
  const { t } = useLanguage()
  const { formatCurrency, formatPercentage, formatNumberWithUnit } = useFormatter()
  const { toast } = useToast()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [filters, setFilters] = useState<PropertyFilterState>({
    types: { residential: true, commercial: true, mixed: true, investment: true },
  })
  const { data: properties, loading, refetch } = useSupabaseQuery(fetchProperties)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadForPropertyId, setUploadForPropertyId] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter properties by tab, dropdown filters, and search query
  const filteredProperties = properties.filter((property: any) => {
    // Tab filter
    if (activeTab === "residential" && property.type !== "residential") return false
    if (activeTab === "commercial" && property.type !== "commercial") return false
    if (activeTab === "investment" && property.type !== "investment") return false

    // Dropdown type filters (only apply on "all" tab)
    if (activeTab === "all") {
      if (property.type === "residential" && !filters.types.residential) return false
      if (property.type === "commercial" && !filters.types.commercial) return false
      if (property.type === "mixed" && !filters.types.mixed) return false
      if (property.type === "investment" && !filters.types.investment) return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = property.name?.toLowerCase().includes(query)
      const matchesAddress = property.address?.toLowerCase().includes(query)
      const matchesCity = property.city?.toLowerCase().includes(query)
      if (!matchesName && !matchesAddress && !matchesCity) return false
    }

    return true
  })

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

  const handleDeleteProperty = async (propertyId: string, propertyName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${propertyName}? This action cannot be undone.`)) return

    try {
      await deleteProperty(propertyId)
      await refetch()
      toast({
        title: t("properties.propertyDeleted"),
        description: `${propertyName} has been successfully deleted.`,
      })
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to delete property. It may have related units, tenants, or contracts.",
        variant: "destructive",
      })
    }
  }

  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadForPropertyId) return
    setIsUploading(true)
    try {
      await uploadPropertyDocument(uploadForPropertyId, uploadFile)
      await refetch()
      toast({ title: t("properties.documentUploaded"), description: t("properties.documentUploadedDesc") })
      setUploadFile(null)
      setUploadDialogOpen(false)
      setUploadForPropertyId(null)
    } catch (error: any) {
      console.error('Document upload error:', error)
      toast({ title: t("common.error"), description: error?.message || t("properties.documentUploadError"), variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteDocument = async (propertyId: string, documentUrl: string) => {
    if (!window.confirm(t("properties.confirmDeleteDocument"))) return
    try {
      await deletePropertyDocument(propertyId, documentUrl)
      await refetch()
      toast({ title: t("properties.documentDeleted"), description: t("properties.documentDeletedDesc") })
    } catch (error: any) {
      toast({ title: t("common.error"), description: error?.message || t("properties.documentDeleteError"), variant: "destructive" })
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === "application/pdf") {
        setUploadFile(droppedFile)
      } else {
        toast({ title: t("common.error"), description: t("contracts.pdfOnly"), variant: "destructive" })
      }
    }
  }

  const handleExportFormat = (format: ExportFormat) => {
    if (filteredProperties.length === 0) {
      toast({
        title: t("common.export"),
        description: "No data to export.",
        variant: "destructive",
      })
      return
    }

    const headers = [t("properties.propertyName"), t("properties.address"), t("properties.city"), t("properties.state"), t("properties.zip"), t("properties.type"), t("properties.units")]
    const rows = filteredProperties.map((p: any) => [
      p.name,
      p.address,
      p.city,
      p.state,
      p.zip,
      p.type,
      p.units,
    ])

    downloadExport(format, {
      headers,
      rows,
      title: t("common.properties"),
      filename: "properties",
    })
  }

  const renderTable = () => (
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
              <TableHead>{t("properties.currentPropertyValue")}</TableHead>
              <TableHead>{t("properties.document")}</TableHead>
              <TableHead className="text-right rtl:text-left">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredProperties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {t("properties.noProperties")}
                </TableCell>
              </TableRow>
            ) : (
              filteredProperties.map((property: any) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">{property.name}</TableCell>
                  <TableCell>{`${property.address}, ${property.city}, ${property.state}`}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {property.type === "residential" ? t("properties.residential") : property.type === "commercial" ? t("properties.commercial") : property.type === "investment" ? t("properties.investment") : t("properties.mixedUse")}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatNumberWithUnit(property.units, "units")}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-primary" style={{ width: "0%" }}></div>
                      </div>
                      <span className="ml-2 rtl:mr-2 rtl:ml-0 text-xs">{formatPercentage(0)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                  <TableCell>{formatCurrency(property.current_property_value || 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                  <TableCell>
                    {property.document_url ? (
                      <button
                        onClick={() => setPdfPreviewUrl(property.document_url)}
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer"
                      >
                        <FileText className="h-4 w-4" />
                        {t("properties.viewDocument")}
                      </button>
                    ) : (
                      <span className="text-muted-foreground text-sm">{t("properties.noDocument")}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right rtl:text-left">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Open menu">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(property.id)}>
                          {t("properties.viewDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditProperty(property.id)}>
                          {t("properties.editProperty")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewUnits(property.id)}>
                          {t("properties.viewUnits")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewTenants(property.id)}>
                          {t("properties.viewTenants")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setUploadForPropertyId(property.id)
                          setUploadDialogOpen(true)
                        }}>
                          <Upload className="me-2 h-4 w-4" />
                          {t("properties.uploadDocument")}
                        </DropdownMenuItem>
                        {property.document_url && (
                          <>
                            <DropdownMenuItem onClick={() => setPdfPreviewUrl(property.document_url)}>
                              <FileText className="me-2 h-4 w-4" />
                              {t("properties.viewDocument")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteDocument(property.id, property.document_url)}
                            >
                              <Trash2 className="me-2 h-4 w-4" />
                              {t("properties.deleteDocument")}
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteProperty(property.id, property.name)}
                        >
                          {t("properties.deleteProperty")}
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
  )

  return (
    <>
    <ExportFormatDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} onSelect={handleExportFormat} />
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BackToDashboard />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("properties.title")}</h2>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <AddPropertyDialog onSuccess={refetch} />
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">{t("properties.allProperties")}</TabsTrigger>
            <TabsTrigger value="residential">{t("properties.residential")}</TabsTrigger>
            <TabsTrigger value="commercial">{t("properties.commercial")}</TabsTrigger>
            <TabsTrigger value="investment">{t("properties.investment")}</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <PropertyFilters filters={filters} onFiltersChange={setFilters} />
            <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
              <Download className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
              {t("common.export")}
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2 rtl:space-x-reverse">
              <Input
                placeholder={t("properties.searchProperties")}
                className="h-9 w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline" size="sm" className="h-9" onClick={() => setSearchQuery("")} disabled={!searchQuery}>
                Clear
              </Button>
            </div>
          </div>
          {renderTable()}
        </div>
      </Tabs>
    </div>
    {/* Upload Document Dialog */}
    <Dialog open={uploadDialogOpen} onOpenChange={(isOpen) => {
      setUploadDialogOpen(isOpen)
      if (!isOpen) { setUploadFile(null); setUploadForPropertyId(null) }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("properties.uploadDocument")}</DialogTitle>
          <DialogDescription>{t("properties.uploadDocumentDesc")}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {uploadFile ? (
            <Alert variant="outline" className="border-primary/50">
              <FileText className="h-4 w-4" />
              <AlertTitle>{t("contracts.fileSelected")}</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span className="truncate pe-4">{uploadFile.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setUploadFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div
              className="border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) setUploadFile(e.target.files[0])
                }}
              />
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">{t("properties.uploadDocument")}</p>
              <p className="text-sm text-muted-foreground text-center mb-4">{t("contracts.supportedFormats")}</p>
              <Button variant="outline" type="button">{t("contracts.selectFile")}</Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={isUploading}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleUploadDocument} disabled={isUploading || !uploadFile}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("common.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {/* PDF Preview Dialog */}
    <Dialog open={!!pdfPreviewUrl} onOpenChange={(isOpen) => { if (!isOpen) setPdfPreviewUrl(null) }}>
      <DialogContent className="sm:max-w-[95vw] md:max-w-[900px] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 shrink-0 border-b">
          <DialogTitle>{t("properties.viewDocument")}</DialogTitle>
        </DialogHeader>
        {pdfPreviewUrl && (
          <iframe
            src={pdfPreviewUrl}
            className="w-full flex-1 min-h-0 border-0"
            title="Property Document PDF"
          />
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}
