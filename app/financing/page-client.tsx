"use client"

import { useState } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { useToast } from "@/hooks/use-toast"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { fetchProperties, updateProperty } from "@/lib/services/properties"

export function FinancingPageClient() {
  const { t } = useLanguage()
  const { formatCurrency } = useFormatter()
  const { toast } = useToast()
  const { data: properties, loading, refetch } = useSupabaseQuery(fetchProperties)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{
    current_property_value: string
    annual_debt_service: string
    total_cash_invested: string
  }>({ current_property_value: "", annual_debt_service: "", total_cash_invested: "" })
  const [saving, setSaving] = useState(false)

  const totalPropertyValue = properties.reduce((s: number, p: any) => s + (Number(p.current_property_value) || 0), 0)
  const totalDebtService = properties.reduce((s: number, p: any) => s + (Number(p.annual_debt_service) || 0), 0)
  const totalCashInvested = properties.reduce((s: number, p: any) => s + (Number(p.total_cash_invested) || 0), 0)

  const startEditing = (property: any) => {
    setEditingId(property.id)
    setEditValues({
      current_property_value: String(property.current_property_value || 0),
      annual_debt_service: String(property.annual_debt_service || 0),
      total_cash_invested: String(property.total_cash_invested || 0),
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
  }

  const handleSave = async (propertyId: string) => {
    setSaving(true)
    try {
      await updateProperty(propertyId, {
        current_property_value: Number(editValues.current_property_value) || 0,
        annual_debt_service: Number(editValues.annual_debt_service) || 0,
        total_cash_invested: Number(editValues.total_cash_invested) || 0,
      })
      setEditingId(null)
      await refetch()
      toast({ title: t("common.success"), description: t("financing.updateSuccess") })
    } catch (err: any) {
      toast({ title: t("common.error"), description: err?.message || "Failed to save", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BackToDashboard />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("financing.title")}</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-s-4 border-s-blue-500">
          <CardHeader className="pb-2">
            <CardDescription>{t("financing.totalPropertyValue")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-24" /> : (
              <div className="text-2xl font-bold">{formatCurrency(totalPropertyValue)}</div>
            )}
          </CardContent>
        </Card>
        <Card className="border-s-4 border-s-red-500">
          <CardHeader className="pb-2">
            <CardDescription>{t("financing.totalAnnualDebt")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-24" /> : (
              <div className="text-2xl font-bold">{formatCurrency(totalDebtService)}</div>
            )}
          </CardContent>
        </Card>
        <Card className="border-s-4 border-s-green-500">
          <CardHeader className="pb-2">
            <CardDescription>{t("financing.totalCashInvested")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-24" /> : (
              <div className="text-2xl font-bold">{formatCurrency(totalCashInvested)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Properties Table */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle>{t("financing.propertyFinancing")}</CardTitle>
          <CardDescription>{t("financing.propertyFinancingDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("properties.propertyName")}</TableHead>
                <TableHead>{t("properties.type")}</TableHead>
                <TableHead>{t("financing.currentPropertyValue")}</TableHead>
                <TableHead>{t("financing.annualDebtService")}</TableHead>
                <TableHead>{t("financing.totalCashInvested")}</TableHead>
                <TableHead className="text-right rtl:text-left">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t("properties.noProperties")}
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((property: any) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.name}</TableCell>
                    <TableCell className="capitalize">{property.type}</TableCell>
                    {editingId === property.id ? (
                      <>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-32"
                            value={editValues.current_property_value}
                            onChange={(e) => setEditValues(prev => ({ ...prev, current_property_value: e.target.value }))}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-32"
                            value={editValues.annual_debt_service}
                            onChange={(e) => setEditValues(prev => ({ ...prev, annual_debt_service: e.target.value }))}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-32"
                            value={editValues.total_cash_invested}
                            onChange={(e) => setEditValues(prev => ({ ...prev, total_cash_invested: e.target.value }))}
                          />
                        </TableCell>
                        <TableCell className="text-right rtl:text-left">
                          <div className="flex items-center justify-end gap-2 rtl:justify-start">
                            <Button size="sm" onClick={() => handleSave(property.id)} disabled={saving}>
                              <Save className="mr-1 rtl:ml-1 rtl:mr-0 h-3 w-3" />
                              {saving ? t("common.saving") : t("common.save")}
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing}>
                              {t("common.cancel")}
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{formatCurrency(property.current_property_value || 0)}</TableCell>
                        <TableCell>{formatCurrency(property.annual_debt_service || 0)}</TableCell>
                        <TableCell>{formatCurrency(property.total_cash_invested || 0)}</TableCell>
                        <TableCell className="text-right rtl:text-left">
                          <Button size="sm" variant="outline" onClick={() => startEditing(property)}>
                            {t("common.edit")}
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
