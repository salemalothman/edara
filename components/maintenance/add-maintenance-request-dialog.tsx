"use client"

import type React from "react"

import { useState, useRef } from "react"
import { WrenchIcon, Loader2, AlertCircle, Camera, ImageIcon } from "lucide-react"
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
import { insertMaintenanceRequest, uploadMaintenanceImages } from "@/lib/services/maintenance"
import { fetchProperties } from "@/lib/services/properties"
import { fetchUnitsByProperty } from "@/lib/services/units"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MaintenanceRequestFormData {
  title: string
  propertyId: string
  unitId: string
  category: string
  priority: string
  description: string
  availableDates: string
  contactPreference: string
  images: File[]
}

export function AddMaintenanceRequestDialog({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useLanguage()
  const { toast } = useToast()

  const [formData, setFormData] = useState<MaintenanceRequestFormData>({
    title: "",
    propertyId: "",
    unitId: "",
    category: "",
    priority: "medium",
    description: "",
    availableDates: "",
    contactPreference: "email",
    images: [],
  })

  const { data: properties } = useSupabaseQuery(fetchProperties)
  const { data: units } = useSupabaseQuery(
    () => formData.propertyId ? fetchUnitsByProperty(formData.propertyId) : Promise.resolve([]),
    [formData.propertyId]
  )

  const categories = [
    { id: "plumbing", name: t("maintenance.categories.plumbing") },
    { id: "electrical", name: t("maintenance.categories.electrical") },
    { id: "hvac", name: t("maintenance.categories.hvac") },
    { id: "appliance", name: t("maintenance.categories.appliance") },
    { id: "structural", name: t("maintenance.categories.structural") },
    { id: "pest", name: t("maintenance.categories.pest") },
    { id: "other", name: t("maintenance.categories.other") },
  ]

  const filteredUnits = units

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newFiles],
      }))

      // Create preview URLs for the images
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file))
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls])
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))

    // Revoke the URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index])
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const validateForm = () => {
    const requiredFields = ["title", "propertyId", "unitId", "category", "priority", "description"]
    for (const field of requiredFields) {
      if (!formData[field as keyof MaintenanceRequestFormData]) {
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
      let imageUrls: string[] = []
      if (formData.images.length > 0) {
        imageUrls = await uploadMaintenanceImages(formData.images)
      }

      await insertMaintenanceRequest({
        title: formData.title,
        property_id: formData.propertyId,
        unit_id: formData.unitId,
        category: formData.category,
        priority: formData.priority,
        description: formData.description,
        available_dates: formData.availableDates || null,
        contact_preference: formData.contactPreference,
        image_urls: imageUrls,
      })

      onSuccess?.()

      toast({
        title: t("maintenance.addSuccess"),
        description: t("maintenance.requestAdded"),
      })

      // Reset form and close dialog
      setFormData({
        title: "",
        propertyId: "",
        unitId: "",
        category: "",
        priority: "medium",
        description: "",
        availableDates: "",
        contactPreference: "email",
        images: [],
      })
      setPreviewUrls([])
      setOpen(false)
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("maintenance.addError"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextTab = () => {
    if (activeTab === "details") {
      setActiveTab("images")
    }
  }

  const prevTab = () => {
    if (activeTab === "images") {
      setActiveTab("details")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <WrenchIcon className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" /> {t("maintenance.addRequest")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{t("maintenance.addRequest")}</DialogTitle>
          <DialogDescription>{t("maintenance.addRequestDesc")}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">{t("maintenance.details")}</TabsTrigger>
            <TabsTrigger value="images">{t("maintenance.images")}</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("maintenance.issueTitle")} *</Label>
                <Input
                  id="title"
                  placeholder={t("maintenance.issueTitlePlaceholder")}
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyId">{t("maintenance.property")} *</Label>
                  <Select
                    value={formData.propertyId}
                    onValueChange={(value) => handleSelectChange("propertyId", value)}
                  >
                    <SelectTrigger id="propertyId">
                      <SelectValue placeholder={t("maintenance.selectProperty")} />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property: any) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitId">{t("maintenance.unit")} *</Label>
                  <Select
                    value={formData.unitId}
                    onValueChange={(value) => handleSelectChange("unitId", value)}
                    disabled={!formData.propertyId}
                  >
                    <SelectTrigger id="unitId">
                      <SelectValue placeholder={t("maintenance.selectUnit")} />
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
                  <Label htmlFor="category">{t("maintenance.category")} *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder={t("maintenance.selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("maintenance.priority")} *</Label>
                  <RadioGroup
                    value={formData.priority}
                    onValueChange={(value) => handleSelectChange("priority", value)}
                    className="flex space-x-4 rtl:space-x-reverse pt-2"
                  >
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <RadioGroupItem value="low" id="priority-low" />
                      <Label htmlFor="priority-low" className="flex items-center">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 mr-1">
                          {t("maintenance.priorities.low")}
                        </Badge>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <RadioGroupItem value="medium" id="priority-medium" />
                      <Label htmlFor="priority-medium" className="flex items-center">
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 mr-1">
                          {t("maintenance.priorities.medium")}
                        </Badge>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <RadioGroupItem value="high" id="priority-high" />
                      <Label htmlFor="priority-high" className="flex items-center">
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 mr-1">
                          {t("maintenance.priorities.high")}
                        </Badge>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("maintenance.description")} *</Label>
                <Textarea
                  id="description"
                  placeholder={t("maintenance.descriptionPlaceholder")}
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availableDates">{t("maintenance.availableDates")}</Label>
                <Input
                  id="availableDates"
                  placeholder={t("maintenance.availableDatesPlaceholder")}
                  value={formData.availableDates}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("maintenance.contactPreference")}</Label>
                <RadioGroup
                  value={formData.contactPreference}
                  onValueChange={(value) => handleSelectChange("contactPreference", value)}
                  className="flex space-x-4 rtl:space-x-reverse pt-2"
                >
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="email" id="contact-email" />
                    <Label htmlFor="contact-email">{t("maintenance.contactMethods.email")}</Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="phone" id="contact-phone" />
                    <Label htmlFor="contact-phone">{t("maintenance.contactMethods.phone")}</Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="sms" id="contact-sms" />
                    <Label htmlFor="contact-sms">{t("maintenance.contactMethods.sms")}</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={nextTab}>
                {t("common.next")}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="images" className="mt-4">
            <div className="grid gap-6 py-4">
              <h3 className="text-lg font-medium">{t("maintenance.issueImages")}</h3>
              <div className="grid gap-4">
                <div
                  className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={triggerFileInput}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                  />
                  <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    {t("maintenance.dragDropImages")}
                    <br />
                    <span className="text-primary font-medium">{t("maintenance.browseFiles")}</span>
                  </p>
                </div>

                {previewUrls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url || "/placeholder.svg"}
                          alt={`Issue image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <AlertCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p>{t("maintenance.noImages")}</p>
                    <p className="text-sm">{t("maintenance.imagesHelp")}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={prevTab}>
                {t("common.back")}
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
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          {activeTab === "images" && (
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
