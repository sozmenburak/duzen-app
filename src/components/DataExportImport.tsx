import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Upload, Database, FileSpreadsheet } from 'lucide-react'
import { pushStoreToSupabase } from '@/lib/supabaseSync'
import { useAuth } from '@/contexts/AuthContext'
import { exportData, importData, getStore } from '@/store'
import { exportStoreToExcel } from '@/lib/exportExcel'

export function DataExportImport() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `duzen-yedek-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportExcel = () => {
    const store = getStore()
    exportStoreToExcel(store)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const text = reader.result as string
      if (importData(text)) {
        if (user?.id) {
          const { error } = await pushStoreToSupabase(user.id)
          if (error) console.error('[DataExportImport] Import sonrası Supabase push hatası:', error)
        }
        window.location.reload()
      } else {
        alert('Geçersiz yedek dosyası. Lütfen daha önce Export ile aldığınız JSON dosyasını seçin.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" title="Veri yedekle / yükle">
            <Database className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Veri</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export al (JSON)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel olarak dışa aktar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-2" />
            Import et
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
