"use client"

import type React from "react"

import { useRef } from "react"
import { Plus, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/hooks/use-language"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { FormDialog } from "@/components/ui/form-dialog"
import { useDialogForm } from "@/hooks/use-dialog-form"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { insertProperty, uploadPropertyImages } from "@/lib/services/properties"

interface PropertyFormData {
  name: string
  type: string
  address: string
  city: string
  state: string
  zip: string
  units: string
  size: string
  description: string
  amenities: {
    parking: boolean
    security: boolean
    elevator: boolean
    pool: boolean
    gym: boolean
    airConditioning: boolean
  }
  images: File[]
}

const initialFormData: PropertyFormData = {
  name: "",
  type: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  units: "",
  size: "",
  description: "",
  amenities: {
    parking: false,
    security: false,
    elevator: false,
    pool: false,
    gym: false,
    airConditioning: false,
  },
  images: [],
}

export function AddPropertyDialog({ onSuccess }: { onSuccess?: () => void } = {}) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const validateForm = (data: PropertyFormData) => {
    const requiredFields = ["name", "type", "address", "city", "state", "zip", "units"]
    for (const field of requiredFields) {
      if (!data[field as keyof PropertyFormData]) {
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

  const { open, setOpen, isSubmitting, formData, setFormData, handleInputChange, handleSelectChange, handleSubmit } =
    useDialogForm<PropertyFormData>({
      initialData: initialFormData,
      validationFn: validateForm,
      onSubmit: async (data) => {
        let imageUrls: string[] = []
        if (data.images.length > 0) {
          imageUrls = await uploadPropertyImages(data.images)
        }
        await insertProperty({
          name: data.name,
          type: data.type,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          units: parseInt(data.units),
          size: data.size ? parseFloat(data.size) : null,
          description: data.description || null,
          amenities: data.amenities,
          image_urls: imageUrls,
        })
        onSuccess?.()
      },
      successMessage: t("properties.propertyAdded"),
      errorMessage: t("properties.addError"),
    })

  const handleAmenityChange = (amenity: keyof PropertyFormData["amenities"], checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: checked,
      },
    }))
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

  const nextTab = () => {
    if (activeTab === "details") {
      setActiveTab("amenities")
    } else if (activeTab === "amenities") {
      setActiveTab("images")
    }
  }

  const prevTab = () => {
    if (activeTab === "images") {
      setActiveTab("amenities")
    } else if (activeTab === "amenities") {
      setActiveTab("details")
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      title={t("properties.addProperty")}
      description={t("properties.addPropertyDesc")}
      isSubmitting={isSubmitting}
      onSubmit={activeTab === "images" ? handleSubmit : undefined}
      maxWidth="lg"
      trigger={
        <Button>
          <Plus className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" /> {t("properties.addProperty")}
        </Button>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">{t("properties.details")}</TabsTrigger>
          <TabsTrigger value="amenities">{t("properties.amenities")}</TabsTrigger>
          <TabsTrigger value="images">{t("properties.images")}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("properties.propertyName")} *</Label>
                <Input
                  id="name"
                  placeholder={t("properties.propertyNamePlaceholder")}
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">{t("properties.type")} *</Label>
                <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder={t("properties.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">{t("properties.residential")}</SelectItem>
                    <SelectItem value="commercial">{t("properties.commercial")}</SelectItem>
                    <SelectItem value="mixed">{t("properties.mixedUse")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t("properties.address")} *</Label>
              <Input
                id="address"
                placeholder={t("properties.addressPlaceholder")}
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t("properties.city")} *</Label>
                <Input
                  id="city"
                  placeholder={t("properties.cityPlaceholder")}
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">{t("properties.state")} *</Label>
                <Input
                  id="state"
                  placeholder={t("properties.statePlaceholder")}
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">{t("properties.zip")} *</Label>
                <Input
                  id="zip"
                  placeholder={t("properties.zipPlaceholder")}
                  value={formData.zip}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="units">{t("properties.units")} *</Label>
                <Input
                  id="units"
                  type="number"
                  placeholder="0"
                  min="1"
                  value={formData.units}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">{t("properties.size")}</Label>
                <Input
                  id="size"
                  type="number"
                  placeholder="0"
                  min="1"
                  value={formData.size}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("properties.description")}</Label>
              <Textarea
                id="description"
                placeholder={t("properties.descriptionPlaceholder")}
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={nextTab}>
              {t("common.next")}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="amenities" className="mt-4">
          <div className="grid gap-6 py-4">
            <h3 className="text-lg font-medium">{t("properties.availableAmenities")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch
                  id="parking"
                  checked={formData.amenities.parking}
                  onCheckedChange={(checked) => handleAmenityChange("parking", checked)}
                />
                <Label htmlFor="parking">{t("properties.amenitiesItems.parking")}</Label>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch
                  id="security"
                  checked={formData.amenities.security}
                  onCheckedChange={(checked) => handleAmenityChange("security", checked)}
                />
                <Label htmlFor="security">{t("properties.amenitiesItems.security")}</Label>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch
                  id="elevator"
                  checked={formData.amenities.elevator}
                  onCheckedChange={(checked) => handleAmenityChange("elevator", checked)}
                />
                <Label htmlFor="elevator">{t("properties.amenitiesItems.elevator")}</Label>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch
                  id="pool"
                  checked={formData.amenities.pool}
                  onCheckedChange={(checked) => handleAmenityChange("pool", checked)}
                />
                <Label htmlFor="pool">{t("properties.amenitiesItems.pool")}</Label>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch
                  id="gym"
                  checked={formData.amenities.gym}
                  onCheckedChange={(checked) => handleAmenityChange("gym", checked)}
                />
                <Label htmlFor="gym">{t("properties.amenitiesItems.gym")}</Label>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch
                  id="airConditioning"
                  checked={formData.amenities.airConditioning}
                  onCheckedChange={(checked) => handleAmenityChange("airConditioning", checked)}
                />
                <Label htmlFor="airConditioning">{t("properties.amenitiesItems.airConditioning")}</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={prevTab}>
              {t("common.back")}
            </Button>
            <Button type="button" onClick={nextTab}>
              {t("common.next")}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          <div className="grid gap-6 py-4">
            <h3 className="text-lg font-medium">{t("properties.propertyImages")}</h3>
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
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  {t("properties.dragDropImages")}
                  <br />
                  <span className="text-primary font-medium">{t("properties.browseFiles")}</span>
                </p>
              </div>

              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Property image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={prevTab}>
              {t("common.back")}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </FormDialog>
  )
}
