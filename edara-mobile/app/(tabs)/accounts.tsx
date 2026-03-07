import { useState, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { Lock, AlertTriangle, Building2 } from 'lucide-react-native'
import { useLanguage } from '../../contexts/language-context'
import { useTheme } from '../../contexts/theme-context'
import { useFormatter } from '../../hooks/use-formatter'
import { useSupabaseQuery } from '../../hooks/use-supabase-query'
import { fetchInvoices } from '../../lib/services/invoices'
import { fetchExpenses, fetchApprovedMaintenanceCosts } from '../../lib/services/expenses'
import { fetchProperties } from '../../lib/services/properties'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { isPeriodLocked } from '../../utils/period-lock'

const MONTHS = [
  { value: 'all', labelKey: 'accounting.allMonths' },
  { value: '1', labelKey: 'dashboard.months.jan' },
  { value: '2', labelKey: 'dashboard.months.feb' },
  { value: '3', labelKey: 'dashboard.months.mar' },
  { value: '4', labelKey: 'dashboard.months.apr' },
  { value: '5', labelKey: 'dashboard.months.may' },
  { value: '6', labelKey: 'dashboard.months.jun' },
  { value: '7', labelKey: 'dashboard.months.jul' },
  { value: '8', labelKey: 'dashboard.months.aug' },
  { value: '9', labelKey: 'dashboard.months.sep' },
  { value: '10', labelKey: 'dashboard.months.oct' },
  { value: '11', labelKey: 'dashboard.months.nov' },
  { value: '12', labelKey: 'dashboard.months.dec' },
]

export default function AccountsScreen() {
  const { t } = useLanguage()
  const { colors } = useTheme()
  const { formatCurrency } = useFormatter()

  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1))
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()))
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [showPropertyPicker, setShowPropertyPicker] = useState(false)

  const { data: invoices, loading: invLoading, refetch: refetchInv } = useSupabaseQuery(fetchInvoices)
  const { data: expensesData, loading: expLoading, refetch: refetchExp } = useSupabaseQuery(fetchExpenses)
  const { data: maintCosts, loading: maintLoading, refetch: refetchMaint } = useSupabaseQuery(fetchApprovedMaintenanceCosts)
  const { data: properties } = useSupabaseQuery(fetchProperties)

  const loading = invLoading || expLoading || maintLoading

  useFocusEffect(useCallback(() => {
    refetchInv(); refetchExp(); refetchMaint()
  }, []))

  const onRefresh = useCallback(() => {
    refetchInv(); refetchExp(); refetchMaint()
  }, [])

  const locked = isPeriodLocked(selectedMonth, selectedYear)

  // Generate year options
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return ['all', ...Array.from({ length: 5 }, (_, i) => String(currentYear - i))]
  }, [])

  // Filter and compute accounting data
  const accountingData = useMemo(() => {
    const matchesDate = (dateStr: string | null | undefined) => {
      if (!dateStr) return false
      const date = new Date(dateStr)
      if (selectedYear !== 'all' && date.getFullYear() !== parseInt(selectedYear)) return false
      if (selectedMonth !== 'all' && date.getMonth() + 1 !== parseInt(selectedMonth)) return false
      return true
    }

    const paidMap = new Map<string, { name: string; amount: number }>()
    const pendingMap = new Map<string, { name: string; amount: number }>()

    invoices.forEach((inv: any) => {
      const invDate = inv.issue_date || inv.due_date || inv.created_at
      if (!matchesDate(invDate)) return
      if (propertyFilter !== 'all' && inv.property_id !== propertyFilter) return

      const tenantName = inv.tenant ? `${inv.tenant.first_name} ${inv.tenant.last_name}` : 'Unknown'
      const tenantId = inv.tenant_id || inv.id
      const amount = Number(inv.amount) || 0

      if (inv.status === 'paid') {
        const existing = paidMap.get(tenantId)
        paidMap.set(tenantId, { name: tenantName, amount: (existing?.amount || 0) + amount })
      } else {
        const existing = pendingMap.get(tenantId)
        pendingMap.set(tenantId, { name: tenantName, amount: (existing?.amount || 0) + amount })
      }
    })

    const allExpenses: { description: string; amount: number; category?: string }[] = []
    expensesData.forEach((e: any) => {
      const expDate = e.date || e.created_at
      if (!matchesDate(expDate)) return
      if (propertyFilter !== 'all' && e.property_id !== propertyFilter) return
      allExpenses.push({ description: e.description || 'Expense', amount: Number(e.amount) || 0, category: e.category })
    })
    maintCosts.forEach((m: any) => {
      if (!matchesDate(m.created_at)) return
      if (propertyFilter !== 'all' && m.property_id !== propertyFilter) return
      allExpenses.push({ description: m.title || m.category || 'Maintenance', amount: Number(m.cost) || 0, category: m.category })
    })

    const paidTenants = Array.from(paidMap.values()).sort((a, b) => b.amount - a.amount)
    const pendingTenants = Array.from(pendingMap.values()).sort((a, b) => b.amount - a.amount)
    const totalPaid = paidTenants.reduce((s, r) => s + r.amount, 0)
    const totalPending = pendingTenants.reduce((s, r) => s + r.amount, 0)
    const totalExpenses = allExpenses.reduce((s, r) => s + r.amount, 0)
    const netTotal = totalPaid - totalExpenses

    return { paidTenants, pendingTenants, expenses: allExpenses, totalPaid, totalPending, totalExpenses, netTotal }
  }, [invoices, expensesData, maintCosts, selectedMonth, selectedYear, propertyFilter])

  const renderPickerDropdown = (
    items: { value: string; label: string }[],
    selected: string,
    onSelect: (value: string) => void,
    onClose: () => void
  ) => (
    <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
        {items.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.dropdownItem, selected === item.value && { backgroundColor: colors.primary + '15' }]}
            onPress={() => { onSelect(item.value); onClose() }}
          >
            <Text style={[styles.dropdownItemText, { color: selected === item.value ? colors.primary : colors.text }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={[styles.title, { color: colors.text }]}>{t('accounting.accounts')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('accounting.accountsDescription')}</Text>

        {/* Month/Year Filters */}
        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{t('accounting.filterByMonth')}</Text>
            <TouchableOpacity
              style={[styles.filterBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => { setShowMonthPicker(!showMonthPicker); setShowYearPicker(false); setShowPropertyPicker(false) }}
            >
              <Text style={[styles.filterBtnText, { color: colors.text }]}>
                {selectedMonth === 'all' ? t('accounting.allMonths') : t(MONTHS.find(m => m.value === selectedMonth)?.labelKey || '')}
              </Text>
            </TouchableOpacity>
            {showMonthPicker && renderPickerDropdown(
              MONTHS.map(m => ({ value: m.value, label: m.value === 'all' ? t('accounting.allMonths') : t(m.labelKey) })),
              selectedMonth,
              setSelectedMonth,
              () => setShowMonthPicker(false)
            )}
          </View>

          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{t('accounting.filterByYear')}</Text>
            <TouchableOpacity
              style={[styles.filterBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => { setShowYearPicker(!showYearPicker); setShowMonthPicker(false); setShowPropertyPicker(false) }}
            >
              <Text style={[styles.filterBtnText, { color: colors.text }]}>
                {selectedYear === 'all' ? t('accounting.allYears') : selectedYear}
              </Text>
            </TouchableOpacity>
            {showYearPicker && renderPickerDropdown(
              years.map(y => ({ value: y, label: y === 'all' ? t('accounting.allYears') : y })),
              selectedYear,
              setSelectedYear,
              () => setShowYearPicker(false)
            )}
          </View>

          <View style={styles.filterBadge}>
            {locked ? (
              <Badge label={t('accounting.lockedPeriod')} variant="danger" />
            ) : (
              <Badge label={t('accounting.currentPeriod')} variant="success" />
            )}
          </View>
        </View>

        {/* Property Filter */}
        <View style={[styles.propertyFilterRow, { zIndex: 5 }]}>
          <Building2 size={16} color={colors.textSecondary} />
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}
            onPress={() => { setShowPropertyPicker(!showPropertyPicker); setShowMonthPicker(false); setShowYearPicker(false) }}
          >
            <Text style={[styles.filterBtnText, { color: colors.text }]} numberOfLines={1}>
              {propertyFilter === 'all'
                ? t('common.allProperties')
                : (properties as any[]).find((p) => p.id === propertyFilter)?.name || t('common.allProperties')}
            </Text>
          </TouchableOpacity>
          {propertyFilter !== 'all' && (
            <TouchableOpacity onPress={() => setPropertyFilter('all')}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>{t('common.all')}</Text>
            </TouchableOpacity>
          )}
        </View>
        {showPropertyPicker && (
          <View style={[styles.propertyDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              <TouchableOpacity
                style={[styles.dropdownItem, propertyFilter === 'all' && { backgroundColor: colors.primary + '15' }]}
                onPress={() => { setPropertyFilter('all'); setShowPropertyPicker(false) }}
              >
                <Text style={[styles.dropdownItemText, { color: propertyFilter === 'all' ? colors.primary : colors.text }]}>
                  {t('common.allProperties')}
                </Text>
              </TouchableOpacity>
              {properties.map((p: any) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.dropdownItem, propertyFilter === p.id && { backgroundColor: colors.primary + '15' }]}
                  onPress={() => { setPropertyFilter(p.id); setShowPropertyPicker(false) }}
                >
                  <Text style={[styles.dropdownItemText, { color: propertyFilter === p.id ? colors.primary : colors.text }]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Period Lock Banner */}
        {locked && (
          <View style={[styles.lockBanner, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
            <Lock size={18} color={colors.warning} />
            <View style={styles.lockBannerText}>
              <Text style={[styles.lockTitle, { color: colors.text }]}>{t('accounting.periodLocked')}</Text>
              <Text style={[styles.lockDesc, { color: colors.textSecondary }]}>{t('accounting.periodLockedDesc')}</Text>
            </View>
          </View>
        )}

        {/* KPI Summary Cards */}
        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { borderLeftWidth: 3, borderLeftColor: colors.success }]}>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{t('accounting.totalPaid')}</Text>
            <Text style={[styles.kpiValue, { color: colors.success }]}>{formatCurrency(accountingData.totalPaid)}</Text>
          </Card>
          <Card style={[styles.kpiCard, { borderLeftWidth: 3, borderLeftColor: colors.warning }]}>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{t('accounting.totalPending')}</Text>
            <Text style={[styles.kpiValue, { color: colors.warning }]}>{formatCurrency(accountingData.totalPending)}</Text>
          </Card>
        </View>
        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { borderLeftWidth: 3, borderLeftColor: colors.danger }]}>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{t('accounting.totalExpenses')}</Text>
            <Text style={[styles.kpiValue, { color: colors.danger }]}>{formatCurrency(accountingData.totalExpenses)}</Text>
          </Card>
          <Card style={[styles.kpiCard, { borderLeftWidth: 3, borderLeftColor: accountingData.netTotal >= 0 ? colors.success : colors.danger }]}>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{t('accounting.netTotal')}</Text>
            <Text style={[styles.kpiValue, { color: accountingData.netTotal >= 0 ? colors.success : colors.danger }]}>
              {formatCurrency(accountingData.netTotal)}
            </Text>
          </Card>
        </View>

        {/* Paid Tenants */}
        <Card style={styles.tableCard}>
          <Text style={[styles.tableTitle, { color: colors.text }]}>{t('accounting.paidTenants')}</Text>
          {accountingData.paidTenants.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('accounting.noPaidTenants')}</Text>
          ) : (
            accountingData.paidTenants.map((row, i) => (
              <View key={i} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.rowName, { color: colors.text }]}>{row.name}</Text>
                <View style={styles.rowRight}>
                  <Text style={[styles.rowAmount, { color: colors.success }]}>{formatCurrency(row.amount)}</Text>
                  <Badge label={t('status.paid')} variant="success" />
                </View>
              </View>
            ))
          )}
          <View style={[styles.totalRow, { backgroundColor: colors.background }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>{t('invoices.total')}</Text>
            <Text style={[styles.totalValue, { color: colors.success }]}>{formatCurrency(accountingData.totalPaid)}</Text>
          </View>
        </Card>

        {/* Pending Tenants */}
        <Card style={styles.tableCard}>
          <Text style={[styles.tableTitle, { color: colors.text }]}>{t('accounting.pendingTenants')}</Text>
          {accountingData.pendingTenants.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('accounting.noPendingTenants')}</Text>
          ) : (
            accountingData.pendingTenants.map((row, i) => (
              <View key={i} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.rowName, { color: colors.text }]}>{row.name}</Text>
                <View style={styles.rowRight}>
                  <Text style={[styles.rowAmount, { color: colors.warning }]}>{formatCurrency(row.amount)}</Text>
                  <Badge label={t('status.pending')} variant="warning" />
                </View>
              </View>
            ))
          )}
          <View style={[styles.totalRow, { backgroundColor: colors.background }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>{t('invoices.total')}</Text>
            <Text style={[styles.totalValue, { color: colors.warning }]}>{formatCurrency(accountingData.totalPending)}</Text>
          </View>
        </Card>

        {/* All Expenses */}
        <Card style={styles.tableCard}>
          <Text style={[styles.tableTitle, { color: colors.text }]}>{t('accounting.allExpenses')}</Text>
          {accountingData.expenses.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('accounting.noExpenses')}</Text>
          ) : (
            accountingData.expenses.map((row, i) => (
              <View key={i} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                <View style={styles.expenseInfo}>
                  <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>{row.description}</Text>
                  {row.category && <Badge label={row.category} />}
                </View>
                <Text style={[styles.rowAmount, { color: colors.danger }]}>{formatCurrency(row.amount)}</Text>
              </View>
            ))
          )}
          <View style={[styles.totalRow, { backgroundColor: colors.background }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>{t('invoices.total')}</Text>
            <Text style={[styles.totalValue, { color: colors.danger }]}>{formatCurrency(accountingData.totalExpenses)}</Text>
          </View>
        </Card>

        {/* Net Total */}
        <Card style={[styles.tableCard, { borderLeftWidth: 4, borderLeftColor: accountingData.netTotal >= 0 ? colors.success : colors.danger }]}>
          <Text style={[styles.tableTitle, { color: colors.text }]}>{t('accounting.netTotal')}</Text>
          <Text style={[styles.netDesc, { color: colors.textSecondary }]}>{t('accounting.netTotalDesc')}</Text>
          <View style={styles.netBreakdown}>
            <View style={styles.netItem}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t('accounting.paidTenants')}</Text>
              <Text style={{ color: colors.success, fontSize: 15, fontWeight: '600' }}>{formatCurrency(accountingData.totalPaid)}</Text>
            </View>
            <View style={styles.netItem}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t('accounting.allExpenses')}</Text>
              <Text style={{ color: colors.danger, fontSize: 15, fontWeight: '600' }}>{formatCurrency(accountingData.totalExpenses)}</Text>
            </View>
          </View>
          <View style={[styles.netTotalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.netTotalValue, { color: accountingData.netTotal >= 0 ? colors.success : colors.danger }]}>
              {formatCurrency(accountingData.netTotal)}
            </Text>
          </View>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 16 },

  // Filters
  filterRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 16, zIndex: 10 },
  filterGroup: { flex: 1, zIndex: 10 },
  filterLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  filterBtnText: { fontSize: 14, fontWeight: '500' },
  filterBadge: { paddingBottom: 10 },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, borderRadius: 8, borderWidth: 1, marginTop: 4, zIndex: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  dropdownScroll: { maxHeight: 200 },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 10 },
  dropdownItemText: { fontSize: 14 },

  // Property filter
  propertyFilterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  propertyDropdown: { borderRadius: 8, borderWidth: 1, marginBottom: 12, zIndex: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },

  // Lock banner
  lockBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  lockBannerText: { flex: 1 },
  lockTitle: { fontSize: 14, fontWeight: '700' },
  lockDesc: { fontSize: 12, marginTop: 2 },

  // KPI cards
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  kpiCard: { flex: 1, paddingVertical: 14, paddingHorizontal: 12 },
  kpiLabel: { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  kpiValue: { fontSize: 18, fontWeight: '800' },

  // Table cards
  tableCard: { marginTop: 8, marginBottom: 4, paddingVertical: 12 },
  tableTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  rowName: { fontSize: 14, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowAmount: { fontSize: 14, fontWeight: '600' },
  expenseInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 6, marginTop: 6 },
  totalLabel: { fontSize: 14, fontWeight: '700' },
  totalValue: { fontSize: 15, fontWeight: '800' },
  emptyText: { fontSize: 13, fontStyle: 'italic', paddingVertical: 8 },

  // Net total
  netDesc: { fontSize: 12, marginBottom: 12 },
  netBreakdown: { gap: 8, marginBottom: 12 },
  netItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netTotalRow: { borderTopWidth: 1, paddingTop: 12, alignItems: 'center' },
  netTotalValue: { fontSize: 24, fontWeight: '800' },

  bottomSpacer: { height: 24 },
})
