"use client"

import { useState } from "react"
import { Receipt, Loader2 } from "lucide-react"
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
import { insertExpense } from "@/lib/services/expenses"
import { fetchProperties } from "@/lib/services/properties"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"

export function AddExpenseDialog({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useLanguage()
  const { toast } = useToast()

  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("other")
  const [propertyId, setPropertyId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  const { data: properties } = useSupabaseQuery(fetchProperties)

  const categories = [
    { id: "guard", label: t("expenses.guard") },
    { id: "cleaning", label: t("expenses.cleaning") },
    { id: "utilities", label: t("expenses.utilities") },
    { id: "repairs", label: t("expenses.repairs") },
    { id: "insurance", label: t("expenses.insurance") },
    { id: "management", label: t("expenses.management") },
    { id: "other", label: t("expenses.other") },
  ]

  const handleSubmit = async () => {
    if (!description || !amount) {
      toast({
        title: t("common.error"),
        description: t("expenses.requiredFieldsError"),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await insertExpense({
        description,
        amount: parseFloat(amount),
        category,
        property_id: propertyId || null,
        date,
      })

      onSuccess?.()
      toast({
        title: t("common.success"),
        description: t("expenses.addSuccess"),
      })

      // Reset form
      setDescription("")
      setAmount("")
      setCategory("other")
      setPropertyId("")
      setDate(new Date().toISOString().split("T")[0])
      setOpen(false)
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error?.message || t("expenses.addError"),
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
          <Receipt className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" /> {t("expenses.addExpense")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("expenses.addExpense")}</DialogTitle>
          <DialogDescription>{t("expenses.addExpenseDesc")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">{t("expenses.description")} *</Label>
            <Input
              id="description"
              placeholder={t("expenses.description")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t("expenses.amount")} *</Label>
              <Input
                id="amount"
                type="number"
                step="0.001"
                placeholder="0.000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">{t("expenses.date")} *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t("expenses.category")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyId">{t("expenses.property")}</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger id="propertyId">
                <SelectValue placeholder={t("expenses.allProperties")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— {t("common.all")} —</SelectItem>
                {properties.map((property: any) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
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
