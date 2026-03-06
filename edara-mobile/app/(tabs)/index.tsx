import { useState, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { Building2, Users, FileText, Receipt, Wrench, Bell, Settings, TrendingUp, TrendingDown, DollarSign, ChevronDown, ChevronUp, Share2 } from 'lucide-react-native'
import { useLanguage } from '../../contexts/language-context'
import { useTheme } from '../../contexts/theme-context'
import { useFormatter } from '../../hooks/use-formatter'
import { useSupabaseQuery } from '../../hooks/use-supabase-query'
import { fetchProperties } from '../../lib/services/properties'
import { fetchUnits } from '../../lib/services/units'
import { fetchInvoices } from '../../lib/services/invoices'
import { fetchMaintenanceRequests } from '../../lib/services/maintenance'
import { fetchExpenses, fetchApprovedMaintenanceCosts } from '../../lib/services/expenses'
import { fetchTenants } from '../../lib/services/tenants'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Button } from '../../components/ui/Button'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

const SCREEN_WIDTH = Dimensions.get('window').width

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export default function DashboardScreen() {
  const { t, language } = useLanguage()
  const { colors } = useTheme()
  const { formatCurrency } = useFormatter()
  const router = useRouter()

  const { data: properties, loading: propsLoading, refetch: refetchProps } = useSupabaseQuery(fetchProperties)
  const { data: units, loading: unitsLoading, refetch: refetchUnits } = useSupabaseQuery(fetchUnits)
  const { data: invoices, loading: invLoading, refetch: refetchInv } = useSupabaseQuery(fetchInvoices)
  const { data: maintenance, loading: maintLoading, refetch: refetchMaint } = useSupabaseQuery(fetchMaintenanceRequests)
  const { data: expensesData, loading: expLoading, refetch: refetchExp } = useSupabaseQuery(fetchExpenses)
  const { data: maintCosts, loading: maintCostLoading, refetch: refetchMaintCost } = useSupabaseQuery(fetchApprovedMaintenanceCosts)
  const { data: tenants, loading: tenLoading, refetch: refetchTen } = useSupabaseQuery(fetchTenants)

  const [selectedPeriod, setSelectedPeriod] = useState<'1m' | '3m' | '6m'>('6m')
  const [showAccounting, setShowAccounting] = useState(false)

  const loading = propsLoading || unitsLoading || invLoading || maintLoading || expLoading || maintCostLoading || tenLoading

  useFocusEffect(useCallback(() => {
    refetchProps(); refetchUnits(); refetchInv(); refetchMaint(); refetchExp(); refetchMaintCost(); refetchTen()
  }, []))

  const onRefresh = useCallback(() => {
    refetchProps()
    refetchUnits()
    refetchInv()
    refetchMaint()
    refetchExp()
    refetchMaintCost()
    refetchTen()
  }, [])

  // Calculate KPIs — derive occupancy from active tenants, not unit.status
  const occupiedUnitIds = new Set(
    tenants.filter((t: any) => t.unit_id && t.status !== 'former').map((t: any) => t.unit_id)
  )
  const occupiedUnits = units.filter((u: any) => occupiedUnitIds.has(u.id)).length
  const occupancyRate = units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0

  const paidInvoices = invoices.filter((i: any) => i.status === 'paid')
  const totalInvoiced = invoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0)
  const totalPaid = paidInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0)
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0

  const pendingMaintenance = maintenance.filter((m: any) => m.status === 'pending' || m.status === 'in_progress').length

  // Period start date based on selected period
  const periodStart = useMemo(() => {
    const d = new Date()
    if (selectedPeriod === '1m') d.setMonth(d.getMonth() - 1)
    else if (selectedPeriod === '3m') d.setMonth(d.getMonth() - 3)
    else d.setMonth(d.getMonth() - 6)
    return d
  }, [selectedPeriod])

  // Calculate monthly revenue & expenses data
  const { monthlyRevenue, monthlyExpenses, totalRevenue, totalExpenses, revenueByStatus } = useMemo(() => {
    const revenue = new Array(12).fill(0)
    const expenses = new Array(12).fill(0)
    let paid = 0
    let pending = 0
    let overdue = 0

    invoices.forEach((inv: any) => {
      const date = new Date(inv.due_date || inv.created_at)
      if (date >= periodStart) {
        const month = date.getMonth()
        if (inv.status === 'paid') {
          revenue[month] += inv.amount || 0
          paid += inv.amount || 0
        } else if (inv.status === 'overdue') {
          overdue += inv.amount || 0
        } else {
          pending += inv.amount || 0
        }
      }
    })

    // Maintenance costs as expenses (completed with cost)
    maintenance.forEach((m: any) => {
      const date = new Date(m.created_at)
      if (date >= periodStart && m.status === 'completed' && m.cost) {
        expenses[date.getMonth()] += m.cost
      }
    })

    // Manual expenses
    expensesData.forEach((e: any) => {
      const date = new Date(e.date || e.created_at)
      if (date >= periodStart) {
        expenses[date.getMonth()] += e.amount || 0
      }
    })

    return {
      monthlyRevenue: revenue,
      monthlyExpenses: expenses,
      totalRevenue: revenue.reduce((a, b) => a + b, 0),
      totalExpenses: expenses.reduce((a, b) => a + b, 0),
      revenueByStatus: { paid, pending, overdue },
    }
  }, [invoices, maintenance, expensesData, periodStart])

  const recentInvoices = invoices.slice(0, 5)

  // Accounting data
  const accountingData = useMemo(() => {
    const paidMap = new Map<string, { name: string; amount: number }>()
    const pendingMap = new Map<string, { name: string; amount: number }>()

    invoices.forEach((inv: any) => {
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

    const allExpenses: { description: string; amount: number }[] = []
    expensesData.forEach((e: any) => {
      allExpenses.push({ description: e.description || 'Expense', amount: Number(e.amount) || 0 })
    })
    maintCosts.forEach((m: any) => {
      allExpenses.push({ description: m.title || m.category || 'Maintenance', amount: Number(m.cost) || 0 })
    })

    const paidTenants = Array.from(paidMap.values()).sort((a, b) => b.amount - a.amount)
    const pendingTenants = Array.from(pendingMap.values()).sort((a, b) => b.amount - a.amount)
    const totalPaid = paidTenants.reduce((s, r) => s + r.amount, 0)
    const totalPending = pendingTenants.reduce((s, r) => s + r.amount, 0)
    const totalExpenses = allExpenses.reduce((s, r) => s + r.amount, 0)
    const netTotal = totalPaid - totalExpenses

    return { paidTenants, pendingTenants, expenses: allExpenses, totalPaid, totalPending, totalExpenses, netTotal }
  }, [invoices, expensesData, maintCosts])

  const handleAccountingReport = async () => {
    try {
      const { paidTenants, pendingTenants, expenses, totalPaid, totalPending, totalExpenses, netTotal } = accountingData

      const tableStyle = `style="width:100%;border-collapse:collapse;margin-bottom:20px"`
      const thStyle = `style="background:#2980b3;color:#fff;padding:8px 12px;text-align:start;font-size:13px"`
      const tdStyle = `style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px"`
      const totalRow = `style="font-weight:bold;background:#f5f5f5;padding:8px 12px;font-size:13px"`

      const buildTable = (title: string, headers: string[], rows: string[][], total: string) => `
        <h3 style="margin:20px 0 8px;color:#333">${title}</h3>
        <table ${tableStyle}>
          <thead><tr>${headers.map(h => `<th ${thStyle}>${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map(r => `<tr>${r.map(c => `<td ${tdStyle}>${c}</td>`).join('')}</tr>`).join('')}
            <tr><td ${totalRow}>${t('invoices.total')}</td><td ${totalRow}>${total}</td></tr>
          </tbody>
        </table>`

      const html = `
        <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
        <head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;padding:24px;color:#333}</style></head>
        <body>
          <h1 style="color:#2980b3;margin-bottom:4px">${t('accounting.title')}</h1>
          <p style="color:#888;margin-top:0">${new Date().toLocaleDateString(language === 'ar' ? 'ar-KW' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          ${buildTable(
            t('accounting.paidTenants'),
            [t('tenants.name'), t('invoices.amount')],
            paidTenants.map(r => [r.name, formatCurrency(r.amount)]),
            formatCurrency(totalPaid)
          )}
          ${buildTable(
            t('accounting.pendingTenants'),
            [t('tenants.name'), t('invoices.amount')],
            pendingTenants.map(r => [r.name, formatCurrency(r.amount)]),
            formatCurrency(totalPending)
          )}
          ${buildTable(
            t('accounting.allExpenses'),
            [t('expenses.description'), t('invoices.amount')],
            expenses.map(r => [r.description, formatCurrency(r.amount)]),
            formatCurrency(totalExpenses)
          )}
          <div style="margin-top:24px;padding:16px;background:${netTotal >= 0 ? '#e8f5e9' : '#fce4ec'};border-radius:8px">
            <h3 style="margin:0 0 8px;color:${netTotal >= 0 ? '#2e7d32' : '#c62828'}">${t('accounting.netTotal')}</h3>
            <p style="margin:4px 0;color:#555">${t('accounting.paidTenants')}: ${formatCurrency(totalPaid)}</p>
            <p style="margin:4px 0;color:#555">${t('accounting.allExpenses')}: ${formatCurrency(totalExpenses)}</p>
            <p style="margin:8px 0 0;font-size:20px;font-weight:bold;color:${netTotal >= 0 ? '#2e7d32' : '#c62828'}">${formatCurrency(netTotal)}</p>
          </div>
        </body></html>`

      const { uri } = await Print.printToFileAsync({ html })
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: t('accounting.report') })
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || 'Failed to generate report')
    }
  }

  if (loading && properties.length === 0) {
    return <LoadingSpinner />
  }

  // Chart helpers
  const maxRevenue = Math.max(...monthlyRevenue, 1)
  const maxExpense = Math.max(...monthlyExpenses, 1)
  const chartMax = Math.max(maxRevenue, maxExpense, 1)
  const currentMonth = new Date().getMonth()
  const chartMonthCount = selectedPeriod === '1m' ? 1 : selectedPeriod === '3m' ? 3 : 6
  const chartMonths = Array.from({ length: chartMonthCount }, (_, i) => {
    const m = currentMonth - (chartMonthCount - 1) + i
    return m < 0 ? m + 12 : m
  })

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>{t('dashboard.title')}</Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {new Date().toLocaleDateString(language === 'ar' ? 'ar-KW' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => {}} style={styles.iconBtn}>
              <Bell size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} style={styles.iconBtn}>
              <Settings size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Period Filter */}
        <View style={styles.periodRow}>
          {(['1m', '3m', '6m'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodBtn, { backgroundColor: selectedPeriod === period ? colors.primary : colors.card, borderColor: colors.border }]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={{ color: selectedPeriod === period ? '#fff' : colors.text, fontSize: 13, fontWeight: '600' }}>
                {t(`dashboard.period${period}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Financial Overview */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.financialOverview')}</Text>
        <View style={styles.financialCards}>
          <Card style={[styles.finCard, { borderLeftColor: colors.success, borderLeftWidth: 3 }]}>
            <View style={styles.finCardHeader}>
              <TrendingUp size={18} color={colors.success} />
              <Text style={[styles.finCardLabel, { color: colors.textSecondary }]}>{t('dashboard.revenue')}</Text>
            </View>
            <Text style={[styles.finCardValue, { color: colors.success }]}>{formatCurrency(totalRevenue)}</Text>
          </Card>
          <Card style={[styles.finCard, { borderLeftColor: colors.danger, borderLeftWidth: 3 }]}>
            <View style={styles.finCardHeader}>
              <TrendingDown size={18} color={colors.danger} />
              <Text style={[styles.finCardLabel, { color: colors.textSecondary }]}>{t('dashboard.expenses')}</Text>
            </View>
            <Text style={[styles.finCardValue, { color: colors.danger }]}>{formatCurrency(totalExpenses)}</Text>
          </Card>
          <Card style={[styles.finCard, { borderLeftColor: colors.primary, borderLeftWidth: 3 }]}>
            <View style={styles.finCardHeader}>
              <DollarSign size={18} color={colors.primary} />
              <Text style={[styles.finCardLabel, { color: colors.textSecondary }]}>{t('dashboard.netIncome')}</Text>
            </View>
            <Text style={[styles.finCardValue, { color: totalRevenue - totalExpenses >= 0 ? colors.success : colors.danger }]}>
              {formatCurrency(totalRevenue - totalExpenses)}
            </Text>
          </Card>
        </View>

        {/* Revenue vs Expenses Bar Chart */}
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('dashboard.revenueVsExpenses')}</Text>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>{t('dashboard.last6Months')}</Text>

          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('dashboard.revenue')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('dashboard.expenses')}</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            {chartMonths.map((monthIdx, i) => {
              const revHeight = chartMax > 0 ? (monthlyRevenue[monthIdx] / chartMax) * 120 : 0
              const expHeight = chartMax > 0 ? (monthlyExpenses[monthIdx] / chartMax) * 120 : 0
              return (
                <View key={i} style={styles.chartColumn}>
                  <View style={styles.barsRow}>
                    <View style={styles.barWrapper}>
                      <View style={[styles.bar, { height: Math.max(revHeight, 2), backgroundColor: colors.success, borderRadius: 4 }]} />
                    </View>
                    <View style={styles.barWrapper}>
                      <View style={[styles.bar, { height: Math.max(expHeight, 2), backgroundColor: colors.danger, borderRadius: 4 }]} />
                    </View>
                  </View>
                  <Text style={[styles.chartLabel, { color: colors.textSecondary, fontWeight: monthIdx === currentMonth ? '700' : '400' }]}>
                    {t(`dashboard.months.${MONTH_KEYS[monthIdx]}`)}
                  </Text>
                </View>
              )
            })}
          </View>
        </Card>

        {/* Invoice Status Breakdown */}
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('dashboard.invoiceStatus')}</Text>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>{t('dashboard.currentYearBreakdown')}</Text>

          {/* Horizontal stacked bar */}
          <View style={styles.stackedBarContainer}>
            {totalInvoiced > 0 ? (
              <View style={styles.stackedBar}>
                {revenueByStatus.paid > 0 && (
                  <View style={[styles.stackedSegment, { flex: revenueByStatus.paid, backgroundColor: colors.success, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderTopRightRadius: revenueByStatus.pending === 0 && revenueByStatus.overdue === 0 ? 8 : 0, borderBottomRightRadius: revenueByStatus.pending === 0 && revenueByStatus.overdue === 0 ? 8 : 0 }]} />
                )}
                {revenueByStatus.pending > 0 && (
                  <View style={[styles.stackedSegment, { flex: revenueByStatus.pending, backgroundColor: colors.warning, borderTopLeftRadius: revenueByStatus.paid === 0 ? 8 : 0, borderBottomLeftRadius: revenueByStatus.paid === 0 ? 8 : 0, borderTopRightRadius: revenueByStatus.overdue === 0 ? 8 : 0, borderBottomRightRadius: revenueByStatus.overdue === 0 ? 8 : 0 }]} />
                )}
                {revenueByStatus.overdue > 0 && (
                  <View style={[styles.stackedSegment, { flex: revenueByStatus.overdue, backgroundColor: colors.danger, borderTopRightRadius: 8, borderBottomRightRadius: 8, borderTopLeftRadius: revenueByStatus.paid === 0 && revenueByStatus.pending === 0 ? 8 : 0, borderBottomLeftRadius: revenueByStatus.paid === 0 && revenueByStatus.pending === 0 ? 8 : 0 }]} />
                )}
              </View>
            ) : (
              <View style={[styles.stackedBar, { backgroundColor: colors.border, borderRadius: 8 }]}>
                <View style={{ flex: 1 }} />
              </View>
            )}
          </View>

          <View style={styles.statusLegend}>
            <View style={styles.statusItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>{t('dashboard.paid')}</Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>{formatCurrency(revenueByStatus.paid)}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>{t('dashboard.pending')}</Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>{formatCurrency(revenueByStatus.pending)}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>{t('dashboard.overdue')}</Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>{formatCurrency(revenueByStatus.overdue)}</Text>
            </View>
          </View>
        </Card>

        {/* Occupancy Chart */}
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('dashboard.occupancy')}</Text>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>{units.length} {t('dashboard.totalUnits')}</Text>

          <View style={styles.occupancyRow}>
            {/* Circular progress indicator */}
            <View style={styles.circleContainer}>
              <View style={[styles.circleOuter, { borderColor: colors.border }]}>
                <View style={[styles.circleProgress, {
                  borderColor: occupancyRate >= 70 ? colors.success : occupancyRate >= 40 ? colors.warning : colors.danger,
                  borderTopColor: 'transparent',
                  transform: [{ rotate: `${(occupancyRate / 100) * 360}deg` }],
                }]} />
                <View style={[styles.circleInner, { backgroundColor: colors.card }]}>
                  <Text style={[styles.circleValue, { color: colors.text }]}>{occupancyRate}%</Text>
                </View>
              </View>
            </View>

            <View style={styles.occupancyDetails}>
              <View style={styles.occupancyItem}>
                <View style={[styles.occupancyDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.occupancyLabel, { color: colors.textSecondary }]}>{t('dashboard.occupied')}</Text>
                <Text style={[styles.occupancyValue, { color: colors.text }]}>{occupiedUnits}</Text>
              </View>
              <View style={styles.occupancyItem}>
                <View style={[styles.occupancyDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.occupancyLabel, { color: colors.textSecondary }]}>{t('dashboard.vacant')}</Text>
                <Text style={[styles.occupancyValue, { color: colors.text }]}>{units.length - occupiedUnits}</Text>
              </View>
              <View style={styles.occupancyItem}>
                <View style={[styles.occupancyDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.occupancyLabel, { color: colors.textSecondary }]}>{t('navigation.properties')}</Text>
                <Text style={[styles.occupancyValue, { color: colors.text }]}>{properties.length}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.quickActions')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
          {[
            { label: t('navigation.properties'), icon: Building2, route: '/(tabs)/properties' as const },
            { label: t('navigation.tenants'), icon: Users, route: '/(tabs)/tenants' as const },
            { label: t('navigation.invoices'), icon: FileText, route: '/(tabs)/invoices' as const },
            { label: t('navigation.expenses'), icon: Receipt, route: '/(tabs)/expenses' as const },
            { label: t('navigation.maintenance'), icon: Wrench, route: '/(tabs)/maintenance' as const },
            { label: t('navigation.financing'), icon: DollarSign, route: '/(tabs)/financing' as const },
          ].map((item) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(item.route)}
            >
              <item.icon size={20} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recent Invoices */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.recentInvoices')}</Text>
        {recentInvoices.map((invoice: any) => (
          <Card key={invoice.id} style={styles.invoiceCard}>
            <View style={styles.invoiceRow}>
              <View style={styles.invoiceInfo}>
                <Text style={[styles.invoiceNumber, { color: colors.text }]}>{invoice.invoice_number}</Text>
                <Text style={[styles.invoiceTenant, { color: colors.textSecondary }]}>
                  {invoice.tenant ? `${invoice.tenant.first_name} ${invoice.tenant.last_name}` : '—'}
                </Text>
              </View>
              <View style={styles.invoiceRight}>
                <Text style={[styles.invoiceAmount, { color: colors.text }]}>
                  {formatCurrency(invoice.amount)}
                </Text>
                <Badge
                  label={t(`status.${invoice.status}`)}
                  variant={
                    invoice.status === 'paid' ? 'success' :
                    invoice.status === 'overdue' ? 'danger' : 'warning'
                  }
                />
              </View>
            </View>
          </Card>
        ))}

        {/* Accounting Section */}
        <TouchableOpacity
          style={[styles.accountingHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowAccounting(!showAccounting)}
        >
          <View style={styles.accountingHeaderLeft}>
            <Receipt size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>{t('accounting.title')}</Text>
          </View>
          {showAccounting ? <ChevronUp size={20} color={colors.textSecondary} /> : <ChevronDown size={20} color={colors.textSecondary} />}
        </TouchableOpacity>

        {showAccounting && (
          <View style={styles.accountingContent}>
            {/* Paid Tenants */}
            <Card style={styles.accountingCard}>
              <Text style={[styles.accountingCardTitle, { color: colors.text }]}>{t('accounting.paidTenants')}</Text>
              {accountingData.paidTenants.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('accounting.noPaidTenants')}</Text>
              ) : (
                accountingData.paidTenants.map((row, i) => (
                  <View key={i} style={[styles.accountingRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.accountingName, { color: colors.text }]}>{row.name}</Text>
                    <Text style={[styles.accountingAmount, { color: colors.success }]}>{formatCurrency(row.amount)}</Text>
                  </View>
                ))
              )}
              <View style={[styles.accountingTotalRow, { backgroundColor: colors.background }]}>
                <Text style={[styles.accountingTotalLabel, { color: colors.text }]}>{t('invoices.total')}</Text>
                <Text style={[styles.accountingTotalValue, { color: colors.success }]}>{formatCurrency(accountingData.totalPaid)}</Text>
              </View>
            </Card>

            {/* Pending Tenants */}
            <Card style={styles.accountingCard}>
              <Text style={[styles.accountingCardTitle, { color: colors.text }]}>{t('accounting.pendingTenants')}</Text>
              {accountingData.pendingTenants.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('accounting.noPendingTenants')}</Text>
              ) : (
                accountingData.pendingTenants.map((row, i) => (
                  <View key={i} style={[styles.accountingRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.accountingName, { color: colors.text }]}>{row.name}</Text>
                    <Text style={[styles.accountingAmount, { color: colors.warning }]}>{formatCurrency(row.amount)}</Text>
                  </View>
                ))
              )}
              <View style={[styles.accountingTotalRow, { backgroundColor: colors.background }]}>
                <Text style={[styles.accountingTotalLabel, { color: colors.text }]}>{t('invoices.total')}</Text>
                <Text style={[styles.accountingTotalValue, { color: colors.warning }]}>{formatCurrency(accountingData.totalPending)}</Text>
              </View>
            </Card>

            {/* All Expenses */}
            <Card style={styles.accountingCard}>
              <Text style={[styles.accountingCardTitle, { color: colors.text }]}>{t('accounting.allExpenses')}</Text>
              {accountingData.expenses.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('accounting.noExpenses')}</Text>
              ) : (
                accountingData.expenses.map((row, i) => (
                  <View key={i} style={[styles.accountingRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.accountingName, { color: colors.text }]} numberOfLines={1}>{row.description}</Text>
                    <Text style={[styles.accountingAmount, { color: colors.danger }]}>{formatCurrency(row.amount)}</Text>
                  </View>
                ))
              )}
              <View style={[styles.accountingTotalRow, { backgroundColor: colors.background }]}>
                <Text style={[styles.accountingTotalLabel, { color: colors.text }]}>{t('invoices.total')}</Text>
                <Text style={[styles.accountingTotalValue, { color: colors.danger }]}>{formatCurrency(accountingData.totalExpenses)}</Text>
              </View>
            </Card>

            {/* Net Total */}
            <Card style={[styles.accountingCard, { borderLeftWidth: 4, borderLeftColor: accountingData.netTotal >= 0 ? colors.success : colors.danger }]}>
              <Text style={[styles.accountingCardTitle, { color: colors.text }]}>{t('accounting.netTotal')}</Text>
              <Text style={[styles.netTotalDesc, { color: colors.textSecondary }]}>{t('accounting.netTotalDesc')}</Text>
              <View style={styles.netTotalBreakdown}>
                <View style={styles.netTotalItem}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t('accounting.paidTenants')}</Text>
                  <Text style={{ color: colors.success, fontSize: 15, fontWeight: '600' }}>{formatCurrency(accountingData.totalPaid)}</Text>
                </View>
                <View style={styles.netTotalItem}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t('accounting.allExpenses')}</Text>
                  <Text style={{ color: colors.danger, fontSize: 15, fontWeight: '600' }}>{formatCurrency(accountingData.totalExpenses)}</Text>
                </View>
              </View>
              <View style={[styles.netTotalValueRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.netTotalValueText, { color: accountingData.netTotal >= 0 ? colors.success : colors.danger }]}>
                  {formatCurrency(accountingData.netTotal)}
                </Text>
              </View>
            </Card>

            {/* Generate Report Button */}
            <Button
              title={t('accounting.generateReport')}
              onPress={handleAccountingReport}
              icon={<Share2 size={18} color="#fff" />}
              style={{ marginBottom: 8 }}
            />
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8, marginBottom: 24 },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8 },
  greeting: { fontSize: 28, fontWeight: '800' },
  date: { fontSize: 14, marginTop: 4 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  periodBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },

  // Financial overview cards
  financialCards: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  finCard: { flex: 1, paddingVertical: 14, paddingHorizontal: 12 },
  finCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  finCardLabel: { fontSize: 11, fontWeight: '500' },
  finCardValue: { fontSize: 16, fontWeight: '800' },

  // Chart card
  chartCard: { marginBottom: 16, paddingVertical: 16 },
  chartTitle: { fontSize: 16, fontWeight: '700' },
  chartSubtitle: { fontSize: 12, marginTop: 2, marginBottom: 12 },
  chartLegend: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12 },

  // Bar chart
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150, paddingTop: 10 },
  chartColumn: { flex: 1, alignItems: 'center' },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 130 },
  barWrapper: { width: 16, justifyContent: 'flex-end', height: '100%' },
  bar: { width: 16, minHeight: 2 },
  chartLabel: { fontSize: 11, marginTop: 6 },

  // Stacked bar
  stackedBarContainer: { marginBottom: 16 },
  stackedBar: { flexDirection: 'row', height: 14, borderRadius: 8, overflow: 'hidden' },
  stackedSegment: { height: '100%' },

  // Status legend
  statusLegend: { gap: 10 },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusLabel: { fontSize: 13, flex: 1 },
  statusValue: { fontSize: 14, fontWeight: '600' },

  // Occupancy
  occupancyRow: { flexDirection: 'row', alignItems: 'center', gap: 24, marginTop: 8 },
  circleContainer: { alignItems: 'center' },
  circleOuter: { width: 100, height: 100, borderRadius: 50, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  circleProgress: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 8 },
  circleInner: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  circleValue: { fontSize: 22, fontWeight: '800' },
  occupancyDetails: { flex: 1, gap: 12 },
  occupancyItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  occupancyDot: { width: 10, height: 10, borderRadius: 5 },
  occupancyLabel: { fontSize: 13, flex: 1 },
  occupancyValue: { fontSize: 16, fontWeight: '700' },

  // Quick actions
  quickActions: { marginBottom: 24 },
  quickAction: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1, marginEnd: 10 },
  quickActionText: { fontSize: 14, fontWeight: '500', marginStart: 8 },

  // Invoices
  invoiceCard: { marginBottom: 8 },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceInfo: { flex: 1 },
  invoiceNumber: { fontSize: 15, fontWeight: '600' },
  invoiceTenant: { fontSize: 13, marginTop: 2 },
  invoiceRight: { alignItems: 'flex-end', gap: 4 },
  invoiceAmount: { fontSize: 15, fontWeight: '700' },

  // Accounting
  accountingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  accountingHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  accountingContent: { gap: 12, marginBottom: 12 },
  accountingCard: { paddingVertical: 12 },
  accountingCardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  accountingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  accountingName: { fontSize: 14, flex: 1 },
  accountingAmount: { fontSize: 14, fontWeight: '600' },
  accountingTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 6, marginTop: 6 },
  accountingTotalLabel: { fontSize: 14, fontWeight: '700' },
  accountingTotalValue: { fontSize: 15, fontWeight: '800' },
  emptyText: { fontSize: 13, fontStyle: 'italic', paddingVertical: 8 },
  netTotalDesc: { fontSize: 12, marginBottom: 12 },
  netTotalBreakdown: { gap: 8, marginBottom: 12 },
  netTotalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netTotalValueRow: { borderTopWidth: 1, paddingTop: 12, alignItems: 'center' },
  netTotalValueText: { fontSize: 24, fontWeight: '800' },

  bottomSpacer: { height: 24 },
})
