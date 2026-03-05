import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'

export interface ExportData {
  headers: string[]
  rows: (string | number)[][]
  title?: string
  filename: string
}

export async function exportCsv(data: ExportData) {
  const lines: string[][] = []

  if (data.title) {
    lines.push([data.title])
    lines.push([''])
  }

  lines.push(data.headers)
  lines.push(...data.rows.map(row => row.map(c => String(c))))

  const csv = lines.map(row => row.map(c => `"${c}"`).join(',')).join('\n')
  const fileUri = `${FileSystem.documentDirectory}${data.filename.replace(/\.\w+$/, '')}.csv`

  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 })

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: data.title || 'Export',
    })
  }
}
