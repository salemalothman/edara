import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { FileText, X } from 'lucide-react-native'
import { useLanguage } from '../../contexts/language-context'
import { useTheme } from '../../contexts/theme-context'
import { exportCsv, type ExportData } from '../../utils/export'

interface ExportSheetProps {
  visible: boolean
  onClose: () => void
  data: ExportData
}

export function ExportSheet({ visible, onClose, data }: ExportSheetProps) {
  const { t } = useLanguage()
  const { colors } = useTheme()

  const handleExport = async () => {
    await exportCsv(data)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t('common.exportAs')}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.option, { borderColor: colors.border }]} onPress={handleExport}>
            <FileText size={20} color={colors.primary} />
            <View style={styles.optionText}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>{t('common.csv')}</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>{t('export.csvDesc')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: '600' },
  optionDesc: { fontSize: 13, marginTop: 2 },
})
