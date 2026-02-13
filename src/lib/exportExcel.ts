import * as XLSX from 'xlsx-js-style'
import type { Store } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  done: '✓',
  skip: '-',
  '': '',
}

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

/** Sütun indeksini Excel harfine çevirir (0→A, 26→AA) */
function colToLetter(n: number): string {
  let s = ''
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  }
  return s
}

const THIN = 'thin' as const
const BORDER_HEADER = {
  top: { style: THIN, color: { rgb: '7A9BB8' } },
  bottom: { style: THIN, color: { rgb: '7A9BB8' } },
  left: { style: THIN, color: { rgb: '7A9BB8' } },
  right: { style: THIN, color: { rgb: '7A9BB8' } },
}
const BORDER_TARIH = {
  top: { style: THIN, color: { rgb: 'B8C5D4' } },
  bottom: { style: THIN, color: { rgb: 'B8C5D4' } },
  left: { style: THIN, color: { rgb: 'B8C5D4' } },
  right: { style: THIN, color: { rgb: 'B8C5D4' } },
}

const HEADER_STYLE = {
  fill: { fgColor: { rgb: '3D5A80' } },
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Segoe UI' },
  alignment: { horizontal: 'center' as const, vertical: 'center' as const, wrapText: true },
  border: BORDER_HEADER,
}
const TARIH_STYLE = {
  fill: { fgColor: { rgb: 'E8EDF4' } },
  font: { sz: 11, name: 'Segoe UI' },
  alignment: { vertical: 'center' as const },
  border: BORDER_TARIH,
}

/** YYYY-MM-DD → "12 Şubat 2026 Perşembe" */
function formatTarih(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const gun = date.getDate()
  const ay = AYLAR[date.getMonth()]
  const yil = date.getFullYear()
  const haftaGunu = GUNLER[date.getDay()]
  return `${gun} ${ay} ${yil} ${haftaGunu}`
}

/**
 * Store verisini tek sayfa "Düzenim" ile Excel (.xlsx) olarak indirir.
 * Sütunlar: Tarih, hedefler (tamamlanma), Su, Yorum, Kilo, Para
 */
export function exportStoreToExcel(store: Store): void {
  const wb = XLSX.utils.book_new()
  const goalTitles = store.goals.map((g) => g.title)
  const goalIds = store.goals.map((g) => g.id)

  // Tüm tarihleri topla (completions, comments, earnings, water, weight)
  const dateSet = new Set<string>()
  Object.keys(store.completions || {}).forEach((k) => dateSet.add(k))
  Object.keys(store.comments || {}).forEach((k) => dateSet.add(k))
  Object.keys(store.earnings || {}).forEach((k) => dateSet.add(k))
  Object.keys(store.waterIntake || {}).forEach((k) => dateSet.add(k))
  Object.keys(store.weightMeasurements || {}).forEach((k) => dateSet.add(k))
  const dateKeys = Array.from(dateSet).sort()

  const header = ['Tarih', ...goalTitles, 'Su', 'Yorum', 'Kilo', 'Para']
  const rows = dateKeys.map((dateKey) => {
    const row: (string | number)[] = [formatTarih(dateKey)]

    // Hedef tamamlanmaları
    for (const goalId of goalIds) {
      const status = store.completions?.[dateKey]?.[goalId] ?? ''
      row.push(STATUS_LABEL[String(status ?? '')] ?? '')
    }

    // Su, Yorum, Kilo, Para (hedef gibi ek sütunlar)
    row.push(store.waterIntake?.[dateKey] ?? '')
    row.push(store.comments?.[dateKey] ?? '')
    row.push(store.weightMeasurements?.[dateKey] ?? '')
    const earning = store.earnings?.[dateKey]
    row.push(earning != null ? earning.amount : '')

    return row
  })

  const sheetData = [header, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(sheetData)
  const colCount = header.length
  const rowCount = rows.length + 1

  // Sütun genişlikleri: Tarih geniş, hedefler okunaklı, Su/Kilo/Para dar, Yorum geniş
  const goalColCount = goalTitles.length
  const defaultGoalWch = 16
  ws['!cols'] = [
    { wch: 28 }, // Tarih
    ...Array(goalColCount).fill({ wch: defaultGoalWch }),
    { wch: 6 },  // Su
    { wch: 42 }, // Yorum
    { wch: 8 },  // Kilo
    { wch: 10 }, // Para
  ]

  // Header satırı (1. satır): arka plan, yazı, çizgiler
  for (let c = 0; c < colCount; c++) {
    const ref = `${colToLetter(c)}1`
    if (ws[ref]) ws[ref].s = HEADER_STYLE
  }

  // Tarih sütunu (A sütunu, 2. satırdan itibaren): açık arka plan + çizgiler
  for (let r = 2; r <= rowCount; r++) {
    const ref = `A${r}`
    if (ws[ref]) ws[ref].s = TARIH_STYLE
  }

  // Tüm hücrelere ince çizgi (tablo ızgarası renkli alanlarda da kaybolmasın)
  const BORDER_DATA = {
    top: { style: THIN, color: { rgb: 'DDE1E6' } },
    bottom: { style: THIN, color: { rgb: 'DDE1E6' } },
    left: { style: THIN, color: { rgb: 'DDE1E6' } },
    right: { style: THIN, color: { rgb: 'DDE1E6' } },
  }
  for (let r = 1; r <= rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      const ref = `${colToLetter(c)}${r}`
      const cell = ws[ref]
      if (cell) {
        if (!cell.s) cell.s = {}
        cell.s.border = r === 1 ? BORDER_HEADER : c === 0 ? BORDER_TARIH : BORDER_DATA
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Düzenim')

  const filename = `duzen-${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, filename)
}
