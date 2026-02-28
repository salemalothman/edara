"use client"

import type React from "react"

import { useState, useRef } from "react"
import { FileText, Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
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
import { insertContract, uploadContractFile } from "@/lib/services/contracts"
import { fetchProperties } from "@/lib/services/properties"
import { fetchTenants } from "@/lib/services/tenants"
import { fetchUnitsByProperty } from "@/lib/services/units"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContractFormData {
  contractId: string
  tenantId: string
  propertyId: string
  unitId: string
  startDate: Date | undefined
  endDate: Date | undefined
  rentAmount: string
  depositAmount: string
  paymentFrequency: string
  terms: string
  file: File | null
}

export function AddContractDialog({ onSuccess }: { onSuccess?: () => void } = {}) {
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

  const [formData, setFormData] = useState<ContractFormData>({
    contractId: "",
    tenantId: "",
    propertyId: "",
    unitId: "",
    startDate: undefined,
    endDate: undefined,
    rentAmount: "",
    depositAmount: "",
    paymentFrequency: "",
    terms: "",
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setFormData((prev) => ({ ...prev, file }))

      // Start extraction process
      await extractContractData(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const extractContractData = async (file: File) => {
    setIsExtracting(true)
    setExtractionProgress(0)
    setExtractionComplete(false)
    setExtractionError(false)

    try {
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 150))
        setExtractionProgress(i)
      }

      const contractId = `CONT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

      setFormData((prev) => ({
        ...prev,
        contractId,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        paymentFrequency: "monthly",
      }))

      setExtractionComplete(true)
      setActiveTab("details")
    } catch (error) {
      console.error("Error extracting contract data:", error)
      setExtractionError(true)
      toast({
        title: t("contracts.extractionError"),
        description: t("contracts.extractionErrorDesc"),
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const validateForm = () => {
    const requiredFields = ["contractId", "tenantId", "propertyId", "unitId", "startDate", "endDate", "rentAmount"]

    for (const field of requiredFields) {
      if (!formData[field as keyof ContractFormData]) {
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
        fileUrl = await uploadContractFile(formData.file)
      }
      await insertContract({
        contract_id: formData.contractId,
        tenant_id: formData.tenantId,
        property_id: formData.propertyId,
        unit_id: formData.unitId,
        start_date: formData.startDate!.toISOString().split('T')[0],
        end_date: formData.endDate!.toISOString().split('T')[0],
        rent_amount: parseFloat(formData.rentAmount),
        deposit_amount: formData.depositAmount ? parseFloat(formData.depositAmount) : null,
        payment_frequency: formData.paymentFrequency || 'monthly',
        terms: formData.terms || null,
        file_url: fileUrl,
      })
      onSuccess?.()

      toast({
        title: t("contracts.addSuccess"),
        description: t("contracts.contractAdded"),
      })

      // Reset form and close dialog
      setFormData({
        contractId: "",
        tenantId: "",
        propertyId: "",
        unitId: "",
        startDate: undefined,
        endDate: undefined,
        rentAmount: "",
        depositAmount: "",
        paymentFrequency: "",
        terms: "",
        file: null,
      })
      setExtractionComplete(false)
      setOpen(false)
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("contracts.addError"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (isOpen && !formData.contractId) {
        const contractId = `CONT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        setFormData((prev) => ({ ...prev, contractId }))
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <FileText className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" /> {t("contracts.addContract")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{t("contracts.addContract")}</DialogTitle>
          <DialogDescription>{t("contracts.addContractDesc")}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">{t("contracts.upload")}</TabsTrigger>
            <TabsTrigger value="details" disabled={isExtracting}>
              {t("contracts.details")}
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
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">{t("contracts.uploadContract")}</p>
                <p className="text-sm text-muted-foreground text-center mb-4">{t("contracts.supportedFormats")}</p>
                <Button variant="outline" type="button">
                  {t("contracts.selectFile")}
                </Button>
              </div>

              {formData.file && (
                <div className="mt-4">
                  <Alert variant="outline" className="border-primary/50">
                    <FileText className="h-4 w-4" />
                    <AlertTitle>{t("contracts.fileSelected")}</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>{formData.file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </AlertDescription>
                  </Alert>

                  {isExtracting && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">{t("contracts.extractingData")}</p>
                      <Progress value={extractionProgress} className="h-2" />
                    </div>
                  )}

                  {extractionComplete && (
                    <Alert variant="default" className="mt-4 bg-green-50 text-green-800 border-green-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>{t("contracts.extractionComplete")}</AlertTitle>
                      <AlertDescription>{t("contracts.dataExtracted")}</AlertDescription>
                    </Alert>
                  )}

                  {extractionError && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{t("contracts.extractionFailed")}</AlertTitle>
                      <AlertDescription>{t("contracts.extractionFailedDesc")}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              {formData.file && extractionComplete && (
                <Button type="button" onClick={() => setActiveTab("details")}>
                  {t("common.next")}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractId">{t("contracts.contractId")} *</Label>
                  <Input
                    id="contractId"
                    value={formData.contractId}
                    onChange={handleInputChange}
                    placeholder={t("contracts.contractIdPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenantId">{t("contracts.tenant")} *</Label>
                  <Select value={formData.tenantId} onValueChange={(value) => handleSelectChange("tenantId", value)}>
                    <SelectTrigger id="tenantId">
                      <SelectValue placeholder={t("contracts.selectTenant")} />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyId">{t("contracts.property")} *</Label>
                  <Select
                    value={formData.propertyId}
                    onValueChange={(value) => handleSelectChange("propertyId", value)}
                  >
                    <SelectTrigger id="propertyId">
                      <SelectValue placeholder={t("contracts.selectProperty")} />
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
                <div className="space-y-2">
                  <Label htmlFor="unitId">{t("contracts.unit")} *</Label>
                  <Select
                    value={formData.unitId}
                    onValueChange={(value) => handleSelectChange("unitId", value)}
                    disabled={!formData.propertyId}
                  >
                    <SelectTrigger id="unitId">
                      <SelectValue placeholder={t("contracts.selectUnit")} />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t("contracts.startDate")} *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? (
                          format(formData.startDate, "PPP")
                        ) : (
                          <span>{t("contracts.selectDate")}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => setFormData((prev) => ({ ...prev, startDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">{t("contracts.endDate")} *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, "PPP") : <span>{t("contracts.selectDate")}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => setFormData((prev) => ({ ...prev, endDate: date }))}
                        initialFocus
                        disabled={(date) => (formData.startDate ? date < formData.startDate : false)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rentAmount">{t("contracts.rentAmount")} *</Label>
                  <Input
                    id="rentAmount"
                    type="number"
                    value={formData.rentAmount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">{t("contracts.depositAmount")}</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    value={formData.depositAmount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentFrequency">{t("contracts.paymentFrequency")}</Label>
                <Select
                  value={formData.paymentFrequency}
                  onValueChange={(value) => handleSelectChange("paymentFrequency", value)}
                >
                  <SelectTrigger id="paymentFrequency">
                    <SelectValue placeholder={t("contracts.selectFrequency")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t("contracts.monthly")}</SelectItem>
                    <SelectItem value="quarterly">{t("contracts.quarterly")}</SelectItem>
                    <SelectItem value="biannually">{t("contracts.biannually")}</SelectItem>
                    <SelectItem value="annually">{t("contracts.annually")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">{t("contracts.terms")}</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={handleInputChange}
                  placeholder={t("contracts.termsPlaceholder")}
                  rows={4}
                />
              </div>
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
