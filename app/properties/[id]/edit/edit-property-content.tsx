"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/hooks/use-language"
import { useToast } from "@/hooks/use-toast"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchPropertyById, updateProperty, uploadPropertyImages } from "@/lib/services/properties"
import { useRouter } from "next/navigation"

interface FormData {
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
}

export function EditPropertyContent({ propertyId }: { propertyId: string }) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: property, loading } = useSupabaseQuery(() => fetchPropertyById(propertyId), [propertyId])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newImages, setNewImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const [formData, setFormData] = useState<FormData>({
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
  })

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || "",
        type: property.type || "",
        address: property.address || "",
        city: property.city || "",
        state: property.state || "",
        zip: property.zip || "",
        units: String(property.units || ""),
        size: property.size ? String(property.size) : "",
        description: property.description || "",
        amenities: {
          parking: property.amenities?.parking || false,
          security: property.amenities?.security || false,
          elevator: property.amenities?.elevator || false,
          pool: property.amenities?.pool || false,
          gym: property.amenities?.gym || false,
          airConditioning: property.amenities?.airConditioning || false,
        },
      })
      setExistingImageUrls(property.image_urls || [])
    }
  }, [property])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleAmenityChange = (amenity: keyof FormData["amenities"], checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      amenities: { ...prev.amenities, [amenity]: checked },
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      setNewImages((prev) => [...prev, ...files])
      setPreviewUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
    }
  }

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setNewImages((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const requiredFields = ["name", "type", "address", "city", "state", "zip", "units"]
    for (const field of requiredFields) {
      if (!formData[field as keyof FormData]) {
        toast({ title: t("validation.error"), description: t("validation.requiredFields"), variant: "destructive" })
        return
      }
    }

    setIsSubmitting(true)
    try {
      let imageUrls = [...existingImageUrls]
      if (newImages.length > 0) {
        const uploaded = await uploadPropertyImages(newImages)
        imageUrls = [...imageUrls, ...uploaded]
      }
      await updateProperty(propertyId, {
        name: formData.name,
        type: formData.type,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        units: parseInt(formData.units),
        size: formData.size ? parseFloat(formData.size) : null,
        description: formData.description || null,
        amenities: formData.amenities,
        image_urls: imageUrls,
      })
      toast({ title: t("properties.propertyUpdated") || "Property updated successfully" })
      router.push(`/properties/${propertyId}`)
    } catch {
      toast({ title: t("properties.updateError") || "Failed to update property", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px] w-full" />
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

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <BackToDashboard route={`/properties/${propertyId}`} />

      <h2 className="text-3xl font-bold tracking-tight">{t("common.edit")} — {property.name}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("properties.details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("properties.propertyName")} *</Label>
                <Input id="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">{t("properties.type")} *</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData((prev) => ({ ...prev, type: v }))}>
                  <SelectTrigger id="type">
                    <SelectValue />
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
              <Input id="address" value={formData.address} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t("properties.city")} *</Label>
                <Input id="city" value={formData.city} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">{t("properties.state")} *</Label>
                <Input id="state" value={formData.state} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">{t("properties.zip")} *</Label>
                <Input id="zip" value={formData.zip} onChange={handleInputChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="units">{t("properties.units")} *</Label>
                <Input id="units" type="number" min="1" value={formData.units} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">{t("properties.size")}</Label>
                <Input id="size" type="number" min="1" value={formData.size} onChange={handleInputChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("properties.description")}</Label>
              <Textarea id="description" value={formData.description} onChange={handleInputChange} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("properties.amenities")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {(["parking", "security", "elevator", "pool", "gym", "airConditioning"] as const).map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Switch
                    id={amenity}
                    checked={formData.amenities[amenity]}
                    onCheckedChange={(checked) => handleAmenityChange(amenity, checked)}
                  />
                  <Label htmlFor={amenity}>{t(`properties.amenitiesItems.${amenity}`)}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("properties.images")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingImageUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {existingImageUrls.map((url, index) => (
                  <div key={url} className="relative group">
                    <img src={url} alt={`Property ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeExistingImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {previewUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={url} className="relative group">
                    <img src={url} alt={`New ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeNewImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
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
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push(`/properties/${propertyId}`)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("common.saving") || "Saving..." : t("common.save") || "Save"}
          </Button>
        </div>
      </form>
    </div>
  )
}
