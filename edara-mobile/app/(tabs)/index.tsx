import { useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Building2, Users, FileText, Wrench, Bell, Settings } from 'lucide-react-native'
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

export default function DashboardScreen() {
  const { t } = useLanguage()
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

  const recentInvoices = invoices.slice(0, 5)

  if (loading && properties.length === 0) {
    return <LoadingSpinner />
  }

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
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
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

        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <Card style={styles.kpiCard}>
            <Building2 size={24} color={colors.primary} />
            <Text style={[styles.kpiValue, { color: colors.text }]}>{properties.length}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{t('navigation.properties')}</Text>
          </Card>
          <Card style={styles.kpiCard}>
            <Users size={24} color={colors.success} />
            <Text style={[styles.kpiValue, { color: colors.text }]}>{occupancyRate}%</Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{t('dashboard.occupancyRate')}</Text>
          </Card>
          <Card style={styles.kpiCard}>
            <FileText size={24} color={colors.warning} />
            <Text style={[styles.kpiValue, { color: colors.text }]}>{collectionRate}%</Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{t('dashboard.collectionRate')}</Text>
          </Card>
          <Card style={styles.kpiCard}>
            <Wrench size={24} color={colors.danger} />
            <Text style={[styles.kpiValue, { color: colors.text }]}>{pendingMaintenance}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{t('navigation.maintenance')}</Text>
          </Card>
        </View>

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
                  label={invoice.status}
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
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  kpiCard: { width: '47%', alignItems: 'center', paddingVertical: 20 },
  kpiValue: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  kpiLabel: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  quickActions: { marginBottom: 24 },
  quickAction: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1, marginEnd: 10 },
  quickActionText: { fontSize: 14, fontWeight: '500', marginStart: 8 },
  invoiceCard: { marginBottom: 8 },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceInfo: { flex: 1 },
  invoiceNumber: { fontSize: 15, fontWeight: '600' },
  invoiceTenant: { fontSize: 13, marginTop: 2 },
  invoiceRight: { alignItems: 'flex-end', gap: 4 },
  invoiceAmount: { fontSize: 15, fontWeight: '700' },
  bottomSpacer: { height: 24 },
})
