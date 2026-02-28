"use client"

import type React from "react"

import { useState } from "react"
import { UserPlus } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import { insertTenant } from "@/lib/services/tenants"
import { fetchProperties } from "@/lib/services/properties"
import { fetchUnitsByProperty } from "@/lib/services/units"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"

const initialFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  property: "",
  unit: "",
  moveInDate: "",
  leaseEndDate: "",
  rent: "",
  deposit: "",
}

export function AddTenantDialog({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useLanguage()
  const { toast } = useToast()
  const [formData, setFormData] = useState(initialFormData)

  const { data: properties } = useSupabaseQuery(fetchProperties)
  const { data: units } = useSupabaseQuery(
    () => formData.property ? fetchUnitsByProperty(formData.property) : Promise.resolve([]),
    [formData.property]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await insertTenant({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        property_id: formData.property || null,
        unit_id: formData.unit || null,
        move_in_date: formData.moveInDate || null,
        lease_end_date: formData.leaseEndDate || null,
        rent: formData.rent ? parseFloat(formData.rent) : null,
        deposit: formData.deposit ? parseFloat(formData.deposit) : null,
      })
      onSuccess?.()

      toast({
        title: "Success",
        description: "Tenant added successfully",
      })

      setFormData(initialFormData)
      setOpen(false)
    } catch {
      toast({
        title: "Error",
        description: "Failed to add tenant. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" /> {t("tenants.addTenant")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("tenants.addTenant")}</DialogTitle>
            <DialogDescription>Enter the tenant's information. Click save when you're done.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="Phone number" value={formData.phone} onChange={handleChange} />
              </div>
            </div>

            {/* Property & Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Property</Label>
                <Select
                  value={formData.property}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, property: value, unit: "" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
                  disabled={!formData.property}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.property ? "Select unit" : "Select property first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="moveInDate">Move-in Date</Label>
                <Input
                  id="moveInDate"
                  type="date"
                  value={formData.moveInDate}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaseEndDate">Lease End Date</Label>
                <Input
                  id="leaseEndDate"
                  type="date"
                  value={formData.leaseEndDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Rent & Deposit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rent">Monthly Rent (KWD)</Label>
                <Input
                  id="rent"
                  type="number"
                  placeholder="0.000"
                  min="0"
                  step="0.001"
                  value={formData.rent}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit">Deposit (KWD)</Label>
                <Input
                  id="deposit"
                  type="number"
                  placeholder="0.000"
                  min="0"
                  step="0.001"
                  value={formData.deposit}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
