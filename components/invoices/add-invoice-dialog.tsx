"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Receipt, Upload, Loader2, AlertCircle, CheckCircle2, FileText } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useFormatter } from "@/hooks/use-formatter"
import { insertInvoice, uploadInvoiceFile } from "@/lib/services/invoices"
import { fetchProperties } from "@/lib/services/properties"
import { fetchTenants } from "@/lib/services/tenants"
import { fetchUnitsByProperty } from "@/lib/services/units"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface InvoiceFormData {
  invoiceNumber: string
  tenantId: string
  propertyId: string
  unitId: string
  issueDate: Date | undefined
  dueDate: Date | undefined
  amount: string
  status: string
  description: string
  items: InvoiceItem[]
  sendNotification: boolean
  file: File | null
}

interface InvoiceItem {
  id: string
  description: string
  amount: string
}

export function AddInvoiceDialog({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [extractionComplete, setExtractionComplete] = useState(false)
  const [extractionError, setExtractionError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const { formatCurrency } = useFormatter()

  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: "",
    tenantId: "",
    propertyId: "",
    unitId: "",
    issueDate: undefined,
    dueDate: undefined,
    amount: "",
    status: "pending",
    description: "",
    items: [],
    sendNotification: true,
    file: null,
  })

  const { data: tenantsData } = useSupabaseQuery(fetchTenants)
  const tenants = tenantsData.map((t: any) => ({ id: t.id, name: `${t.first_name} ${t.last_name}` }))

  const { data: propertiesData } = useSupabaseQuery(fetchProperties)
  const properties = propertiesData.map((p: any) => ({ id: p.id, name: p.name }))

  const { data: filteredUnits } = useSupabaseQuery(
    () => formData.propertyId ? fetchUnitsByProperty(formData.propertyId) : Promise.resolve([]),
    [formData.propertyId]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    if (id === "propertyId") {
      setFormData((prev) => ({ ...prev, propertyId: value, unitId: "" }))
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }))
    }
  }

  const handleItemChange = (id: string, field: "description" | "amount", value: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }))
  }

  const addItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      description: "",
      amount: "",
    }
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }))
  }

  const removeItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }))
  }

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      const amount = Number.parseFloat(item.amount) || 0
      return total + amount
    }, 0)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setFormData((prev) => ({ ...prev, file }))

      // Start extraction process
      await extractInvoiceData(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const extractInvoiceData = async (file: File) => {
    setIsExtracting(true)
    setExtractionProgress(0)
    setExtractionComplete(false)
    setExtractionError(false)

    try {
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 150))
        setExtractionProgress(i)
      }

      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

      setFormData((prev) => ({
        ...prev,
        invoiceNumber,
        issueDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: "pending",
      }))

      setExtractionComplete(true)
      setActiveTab("details")
    } catch (error) {
      console.error("Error extracting invoice data:", error)
      setExtractionError(true)
      toast({
        title: t("invoices.extractionError"),
        description: t("invoices.extractionErrorDesc"),
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const validateForm = () => {
    const requiredFields = ["invoiceNumber", "tenantId", "propertyId", "unitId", "issueDate", "dueDate", "amount"]

    for (const field of requiredFields) {
      if (!formData[field as keyof InvoiceFormData]) {
        toast({
          title: t("validation.error"),
          description: t("validation.requiredFields"),
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      let fileUrl: string | null = null
      if (formData.file) {
        fileUrl = await uploadInvoiceFile(formData.file)
      }
      // Filter out items with empty descriptions or amounts
      const validItems = formData.items
        .filter((item) => item.description && item.amount)
        .map((item, i) => ({
          description: item.description,
          amount: parseFloat(item.amount) || 0,
          sort_order: i,
        }))

      await insertInvoice({
        invoice_number: formData.invoiceNumber,
        tenant_id: formData.tenantId,
        property_id: formData.propertyId,
        unit_id: formData.unitId,
        issue_date: formData.issueDate!.toISOString().split('T')[0],
        due_date: formData.dueDate!.toISOString().split('T')[0],
        amount: parseFloat(formData.amount),
        status: formData.status || 'pending',
        description: formData.description || null,
        send_notification: formData.sendNotification,
        file_url: fileUrl,
        items: validItems,
      })
      onSuccess?.()

      toast({
        title: t("invoices.addSuccess") || "Success",
        description: t("invoices.invoiceAdded") || "Invoice added successfully",
      })

      // Reset form and close dialog
      setFormData({
        invoiceNumber: "",
        tenantId: "",
        propertyId: "",
        unitId: "",
        issueDate: undefined,
        dueDate: undefined,
        amount: "",
        status: "pending",
        description: "",
        items: [],
        sendNotification: true,
        file: null,
      })
      setActiveTab("upload")
      setExtractionComplete(false)
      setOpen(false)
    } catch (error: any) {
      console.error("Invoice insert error:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to add invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (isOpen && !formData.invoiceNumber) {
        const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        setFormData((prev) => ({ ...prev, invoiceNumber }))
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Receipt className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" /> {t("invoices.addInvoice")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{t("invoices.addInvoice")}</DialogTitle>
          <DialogDescription>{t("invoices.addInvoiceDesc")}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">{t("invoices.upload")}</TabsTrigger>
            <TabsTrigger value="details" disabled={isExtracting}>
              {t("invoices.details")}
            </TabsTrigger>
            <TabsTrigger value="items" disabled={isExtracting}>
              {t("invoices.items")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div className="grid gap-6 py-4">
              <div
                className="border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={triggerFileInput}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">{t("invoices.uploadReceipt")}</p>
                <p className="text-sm text-muted-foreground text-center mb-4">{t("invoices.supportedFormats")}</p>
                <Button variant="outline" type="button">
                  {t("invoices.selectFile")}
                </Button>
              </div>

              {formData.file && (
                <div className="mt-4">
                  <Alert variant="outline" className="border-primary/50">
                    <FileText className="h-4 w-4" />
                    <AlertTitle>{t("invoices.fileSelected")}</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>{formData.file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </AlertDescription>
                  </Alert>

                  {isExtracting && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">{t("invoices.extractingData")}</p>
                      <Progress value={extractionProgress} className="h-2" />
                    </div>
                  )}

                  {extractionComplete && (
                    <Alert variant="default" className="mt-4 bg-green-50 text-green-800 border-green-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>{t("invoices.extractionComplete")}</AlertTitle>
                      <AlertDescription>{t("invoices.dataExtracted")}</AlertDescription>
                    </Alert>
                  )}

                  {extractionError && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{t("invoices.extractionFailed")}</AlertTitle>
                      <AlertDescription>{t("invoices.extractionFailedDesc")}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={() => setActiveTab("details")} disabled={isExtracting}>
                {t("common.next")}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">{t("invoices.invoiceNumber")} *</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleInputChange}
                    placeholder={t("invoices.invoiceNumberPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">{t("invoices.status")}</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder={t("invoices.selectStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 mr-2">
                            {t("status.pending")}
                          </Badge>
                          <span>{t("status.pending")}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="paid">
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 mr-2">
                            {t("status.paid")}
                          </Badge>
                          <span>{t("status.paid")}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="overdue">
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 mr-2">
                            {t("status.overdue")}
                          </Badge>
                          <span>{t("status.overdue")}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenantId">{t("invoices.tenant")} *</Label>
                  <Select value={formData.tenantId} onValueChange={(value) => handleSelectChange("tenantId", value)}>
                    <SelectTrigger id="tenantId">
                      <SelectValue placeholder={t("invoices.selectTenant")} />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="propertyId">{t("invoices.property")} *</Label>
                  <Select
                    value={formData.propertyId}
                    onValueChange={(value) => handleSelectChange("propertyId", value)}
                  >
                    <SelectTrigger id="propertyId">
                      <SelectValue placeholder={t("invoices.selectProperty")} />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitId">{t("invoices.unit")} *</Label>
                  <Select
                    value={formData.unitId}
                    onValueChange={(value) => handleSelectChange("unitId", value)}
                    disabled={!formData.propertyId}
                  >
                    <SelectTrigger id="unitId">
                      <SelectValue placeholder={t("invoices.selectUnit")} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUnits.map((unit: any) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">{t("invoices.amount")} *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">{t("invoices.issueDate")} *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.issueDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.issueDate ? (
                          format(formData.issueDate, "PPP")
                        ) : (
                          <span>{t("invoices.selectDate")}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.issueDate}
                        onSelect={(date) => setFormData((prev) => ({ ...prev, issueDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">{t("invoices.dueDate")} *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dueDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dueDate ? format(formData.dueDate, "PPP") : <span>{t("invoices.selectDate")}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate}
                        onSelect={(date) => setFormData((prev) => ({ ...prev, dueDate: date }))}
                        initialFocus
                        disabled={(date) => (formData.issueDate ? date < formData.issueDate : false)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("invoices.description")}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t("invoices.descriptionPlaceholder")}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch
                  id="sendNotification"
                  checked={formData.sendNotification}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, sendNotification: checked }))}
                />
                <Label htmlFor="sendNotification">{t("invoices.sendNotification")}</Label>
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setActiveTab("upload")}>
                {t("common.back")}
              </Button>
              <Button type="button" onClick={() => setActiveTab("items")}>
                {t("common.next")}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="items" className="mt-4">
            <div className="grid gap-4 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{t("invoices.invoiceItems")}</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  {t("invoices.addItem")}
                </Button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-md">
                  <p className="text-muted-foreground">{t("invoices.noItems")}</p>
                  <Button type="button" variant="outline" className="mt-4" onClick={addItem}>
                    {t("invoices.addFirstItem")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 items-start border p-4 rounded-md">
                      <div className="col-span-7 space-y-2">
                        <Label htmlFor={`item-desc-${item.id}`}>{t("invoices.itemDescription")}</Label>
                        <Input
                          id={`item-desc-${item.id}`}
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                          placeholder={t("invoices.itemDescriptionPlaceholder")}
                        />
                      </div>
                      <div className="col-span-4 space-y-2">
                        <Label htmlFor={`item-amount-${item.id}`}>{t("invoices.itemAmount")}</Label>
                        <Input
                          id={`item-amount-${item.id}`}
                          type="number"
                          value={item.amount}
                          onChange={(e) => handleItemChange(item.id, "amount", e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-1 pt-8">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeItem(item.id)}
                        >
                          <AlertCircle className="h-4 w-4" />
                          <span className="sr-only">{t("common.remove")}</span>
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between items-center border-t pt-4 mt-6">
                    <span className="font-medium">{t("invoices.total")}</span>
                    <span className="font-bold text-lg">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-start">
              <Button type="button" variant="outline" onClick={() => setActiveTab("details")}>
                {t("common.back")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
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
  )
}
