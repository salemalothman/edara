import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export type ExportFormat = "csv" | "pdf"

export interface ExportData {
  headers: string[]
  rows: (string | number)[][]
  title?: string
  filename: string
  /** Additional sections for multi-section reports */
  sections?: {
    title: string
    headers: string[]
    rows: (string | number)[][]
  }[]
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadCsv(data: ExportData) {
  const lines: string[][] = []

  if (data.title) {
    lines.push([data.title])
    lines.push([""])
  }

  lines.push(data.headers)
  lines.push(...data.rows.map(row => row.map(c => String(c))))

  if (data.sections) {
    for (const section of data.sections) {
      lines.push([""])
      lines.push([`--- ${section.title} ---`])
      lines.push(section.headers)
      lines.push(...section.rows.map(row => row.map(c => String(c))))
    }
  }

  const csv = lines.map(row => row.map(c => `"${c}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  downloadBlob(blob, data.filename.replace(/\.\w+$/, "") + ".csv")
}

let fontCache: string | null = null

async function loadArabicFont(): Promise<string> {
  if (fontCache) return fontCache
  const res = await fetch("/fonts/Amiri-Regular.ttf")
  const buffer = await res.arrayBuffer()
  const binary = new Uint8Array(buffer)
  let str = ""
  for (let i = 0; i < binary.length; i++) {
    str += String.fromCharCode(binary[i])
  }
  fontCache = btoa(str)
  return fontCache
}

export async function downloadPdf(data: ExportData) {
  const doc = new jsPDF()

  // Load and register Arabic font
  const fontBase64 = await loadArabicFont()
  doc.addFileToVFS("Amiri-Regular.ttf", fontBase64)
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal")
  doc.addFont("Amiri-Regular.ttf", "Amiri", "bold")
  doc.setFont("Amiri")

  let y = 15

  if (data.title) {
    doc.setFontSize(16)
    doc.text(data.title, 14, y)
    y += 10
  }

  const fontStyles = { font: "Amiri", fontSize: 8 }
  const headFontStyles = { font: "Amiri", fontStyle: "bold", fillColor: [41, 128, 185] as [number, number, number] }

  doc.setFontSize(10)
  autoTable(doc, {
    startY: y,
    head: [data.headers],
    body: data.rows.map(row => row.map(c => String(c))),
    styles: fontStyles,
    headStyles: headFontStyles,
  })

  if (data.sections) {
    for (const section of data.sections) {
      const prevTable = (doc as any).lastAutoTable
      y = prevTable ? prevTable.finalY + 12 : y + 10

      if (y > 260) {
        doc.addPage()
        y = 15
      }

      doc.setFont("Amiri")
      doc.setFontSize(12)
      doc.text(section.title, 14, y)
      y += 6

      autoTable(doc, {
        startY: y,
        head: [section.headers],
        body: section.rows.map(row => row.map(c => String(c))),
        styles: fontStyles,
        headStyles: headFontStyles,
      })
    }
  }

  doc.save(data.filename.replace(/\.\w+$/, "") + ".pdf")
}

export async function downloadExport(format: ExportFormat, data: ExportData) {
  if (format === "pdf") {
    await downloadPdf(data)
  } else {
    downloadCsv(data)
  }
}
