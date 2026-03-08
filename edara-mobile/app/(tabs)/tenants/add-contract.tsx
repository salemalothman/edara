import { useState } from 'react'
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { FileUp, FileText, X } from 'lucide-react-native'
import * as DocumentPicker from 'expo-document-picker'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { usePermissions } from '../../../hooks/use-permissions'
import { uploadContractForTenant } from '../../../lib/services/contracts'
import { Button } from '../../../components/ui/Button'

export default function AddContractScreen() {
  const { tenantId, propertyId, unitId } = useLocalSearchParams<{
    tenantId: string
    propertyId?: string
    unitId?: string
  }>()
  const [pdfFile, setPdfFile] = useState<{ uri: string; name: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()
  const { colors } = useTheme()
  const { canCreate } = usePermissions()
  const router = useRouter()

  if (!canCreate) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>{t('permissions.adminRequired')}</Text>
      </View>
    )
  }

  const handlePickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      })
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0]
        setPdfFile({ uri: asset.uri, name: asset.name })
      }
    } catch (err) {
      console.error('Document picker error:', err)
    }
  }

  const handleUpload = async () => {
    if (!pdfFile) {
      Alert.alert(t('common.error'), t('contracts.selectPdfFirst'))
      return
    }
    if (!tenantId) {
      Alert.alert(t('common.error'), t('contracts.addError'))
      return
    }

    setLoading(true)
    try {
      await uploadContractForTenant(
        tenantId,
        propertyId || '',
        unitId || '',
        pdfFile.uri,
        pdfFile.name
      )
      router.back()
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Illustration area */}
        <View style={[styles.iconArea, { backgroundColor: colors.card }]}>
          <FileText size={48} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{t('contracts.uploadContractTitle')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('contracts.uploadContractDesc')}</Text>

        {/* Upload area */}
        {pdfFile ? (
          <View style={[styles.fileRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FileUp size={20} color={colors.primary} />
            <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>{pdfFile.name}</Text>
            <TouchableOpacity onPress={() => setPdfFile(null)}>
              <X size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.uploadArea, { borderColor: colors.primary, backgroundColor: colors.card }]}
            onPress={handlePickPdf}
          >
            <FileUp size={32} color={colors.primary} />
            <Text style={[styles.uploadText, { color: colors.primary }]}>{t('contracts.uploadPdf')}</Text>
            <Text style={[styles.uploadHint, { color: colors.textSecondary }]}>PDF</Text>
          </TouchableOpacity>
        )}

        <Button
          title={pdfFile ? t('contracts.uploadAndSave') : t('contracts.uploadPdf')}
          onPress={handleUpload}
          loading={loading}
          disabled={!pdfFile}
          style={styles.submitBtn}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  iconArea: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 32, paddingHorizontal: 16 },
  uploadArea: { width: '100%', borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 40, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
  uploadText: { fontSize: 16, fontWeight: '600' },
  uploadHint: { fontSize: 13 },
  fileRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 24 },
  fileName: { flex: 1, fontSize: 15 },
  submitBtn: { width: '100%' },
})
