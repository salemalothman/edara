import { useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Building2, Users, FileText, Wrench, Bell, Settings, TrendingUp, TrendingDown, DollarSign } from 'lucide-react-native'
// Building2, Users, FileText, Wrench used in quick actions
import { useLanguage } from '../../contexts/language-context'
import { useTheme } from '../../contexts/theme-context'
import { useFormatter } from '../../hooks/use-formatter'
import { useSupabaseQuery } from '../../hooks/use-supabase-query'
import { fetchProperties } from '../../lib/services/properties'
import { fetchUnits } from '../../lib/services/units'
import { fetchInvoices } from '../../lib/services/invoices'
import { fetchMaintenanceRequests } from '../../lib/services/maintenance'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

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

  const loading = propsLoading || unitsLoading || invLoading || maintLoading

  const onRefresh = useCallback(() => {
    refetchProps()
    refetchUnits()
    refetchInv()
    refetchMaint()
  }, [])

  // Calculate KPIs
  const occupiedUnits = units.filter((u: any) => u.status === 'occupied').length
  const occupancyRate = units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0

  const paidInvoices = invoices.filter((i: any) => i.status === 'paid')
  const totalInvoiced = invoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0)
  const totalPaid = paidInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0)
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0

  const pendingMaintenance = maintenance.filter((m: any) => m.status === 'pending' || m.status === 'in_progress').length

  // Calculate monthly revenue & expenses data
  const { monthlyRevenue, monthlyExpenses, totalRevenue, totalExpenses, revenueByStatus } = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const revenue = new Array(12).fill(0)
    const expenses = new Array(12).fill(0)
    let paid = 0
    let pending = 0
    let overdue = 0

    invoices.forEach((inv: any) => {
      const date = new Date(inv.due_date || inv.created_at)
      if (date.getFullYear() === currentYear) {
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

    // Maintenance costs as expenses
    maintenance.forEach((m: any) => {
      const date = new Date(m.created_at)
      if (date.getFullYear() === currentYear && m.cost) {
        expenses[date.getMonth()] += m.cost
      }
    })

    return {
      monthlyRevenue: revenue,
      monthlyExpenses: expenses,
      totalRevenue: revenue.reduce((a, b) => a + b, 0),
      totalExpenses: expenses.reduce((a, b) => a + b, 0),
      revenueByStatus: { paid, pending, overdue },
    }
  }, [invoices, maintenance])

  const recentInvoices = invoices.slice(0, 5)

  if (loading && properties.length === 0) {
    return <LoadingSpinner />
  }

  // Chart helpers
  const maxRevenue = Math.max(...monthlyRevenue, 1)
  const maxExpense = Math.max(...monthlyExpenses, 1)
  const chartMax = Math.max(maxRevenue, maxExpense, 1)
  const currentMonth = new Date().getMonth()
  // Show last 6 months
  const chartMonths = Array.from({ length: 6 }, (_, i) => {
    const m = currentMonth - 5 + i
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
            { label: t('navigation.maintenance'), icon: Wrench, route: '/(tabs)/maintenance' as const },
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
  bottomSpacer: { height: 24 },
})
