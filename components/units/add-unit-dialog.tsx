"use client"

import type React from "react"
import { useState } from "react"
import { Plus } from "lucide-react"
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
import { insertUnit } from "@/lib/services/units"

const initialFormData = {
  name: "",
  floor: "",
  size: "",
  rent_amount: "",
  status: "vacant",
}

export function AddUnitDialog({ propertyId, onSuccess }: { propertyId: string; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const [formData, setFormData] = useState(initialFormData)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast({ title: "Validation Error", description: "Unit name is required", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await insertUnit({
        property_id: propertyId,
        name: formData.name,
        floor: formData.floor ? parseInt(formData.floor) : null,
        size: formData.size ? parseFloat(formData.size) : null,
        rent_amount: formData.rent_amount ? parseFloat(formData.rent_amount) : null,
        status: formData.status,
      })
      onSuccess?.()
      toast({ title: "Success", description: "Unit added successfully" })
      setFormData(initialFormData)
      setOpen(false)
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to add unit", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" /> Add Unit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Unit</DialogTitle>
            <DialogDescription>Add a new unit to this property.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Unit Name *</Label>
              <Input id="name" placeholder="e.g. Apt 101, Office A" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input id="floor" type="number" placeholder="e.g. 1" value={formData.floor} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size (sqft)</Label>
                <Input id="size" type="number" placeholder="e.g. 850" min="0" value={formData.size} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rent_amount">Monthly Rent (KWD)</Label>
                <Input id="rent_amount" type="number" placeholder="0.000" min="0" step="0.001" value={formData.rent_amount} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
