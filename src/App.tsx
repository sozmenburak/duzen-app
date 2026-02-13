import { useRef, useState } from 'react'
import { useStore, exportData, importData, setTheme } from '@/store'
import { pushStoreToSupabase } from '@/lib/supabaseSync'
import { useAuth } from '@/contexts/AuthContext'
import { FirstSetupScreen } from '@/components/FirstSetupScreen'
import { AuthDialog } from '@/components/AuthDialog'
import { SupabaseSync } from '@/components/SupabaseSync'
import { AddGoalDialog } from '@/components/AddGoalDialog'
import { ThemeToggle } from '@/components/ThemeToggle'
import { DataExportImport } from '@/components/DataExportImport'
import { ResetDangerModal } from '@/components/ResetDangerModal'
import { DeleteAccountModal } from '@/components/DeleteAccountModal'
import { CalendarGrid, MonthNav } from '@/components/CalendarGrid'
import { TodayTab } from '@/components/TodayTab'
import { SummaryTab } from '@/components/SummaryTab'
import { EarningsTab } from '@/components/EarningsTab'
import { DailyTab } from '@/components/DailyTab'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, LogIn, Menu, Sun, Moon, Download, Upload } from 'lucide-react'

function SignOutButton() {
  const { signOut } = useAuth()
  return (
    <Button
      variant="outline"
      size="sm"
      className="shrink-0 h-9 px-2 sm:px-3"
      onClick={() => signOut()}
      title="Çıkış yap"
      aria-label="Çıkış yap"
    >
      <LogOut className="h-[1.2rem] w-[1.2rem] shrink-0" />
      <span>Çıkış</span>
    </Button>
  )
}

function SignInButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="shrink-0 h-9 px-2 sm:px-3"
      onClick={onClick}
      title="Giriş yap — verilerini senkronize et"
      aria-label="Giriş yap"
    >
      <LogIn className="h-[1.2rem] w-[1.2rem] shrink-0" />
      <span>Giriş yap</span>
    </Button>
  )
}

function App() {
  const { user, loading: authLoading } = useAuth()
  const store = useStore()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const importFileInputRef = useRef<HTMLInputElement>(null)

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

  const handleImportClick = () => importFileInputRef.current?.click()

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const text = reader.result as string
      if (importData(text)) {
        if (user?.id) {
          const { error } = await pushStoreToSupabase(user.id)
          if (error) console.error('[App] Import sonrası Supabase push hatası:', error)
        }
        window.location.reload()
      } else {
        alert('Geçersiz yedek dosyası. Lütfen daha önce Export ile aldığınız JSON dosyasını seçin.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">Yükleniyor…</p>
      </div>
    )
  }

  if (store.goals.length === 0) {
    return (
      <>
        <SupabaseSync />
        <FirstSetupScreen onOpenAuthDialog={() => setAuthDialogOpen(true)} />
        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      </>
    )
  }

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  return (
    <>
      <SupabaseSync />
      <div className="min-h-screen w-full bg-background text-foreground p-4 md:p-6">
      <Tabs defaultValue="bugun" className="w-full">
      <header className="w-full mb-6 flex flex-row items-center justify-between gap-2 min-w-0">
        {/* Masaüstünde: sekmeler sol üstte; mobilde sekmeler main içinde */}
        <TabsList className="hidden md:flex mb-0 shrink-0">
          <TabsTrigger value="bugun">Bugün</TabsTrigger>
          <TabsTrigger value="calendar">Takvim</TabsTrigger>
          <TabsTrigger value="summary">Özet</TabsTrigger>
          <TabsTrigger value="earnings">Para</TabsTrigger>
          <TabsTrigger value="daily">Günlük</TabsTrigger>
        </TabsList>
        {/* Masaüstü: Tema, Veri, Yeni hedef, Çıkış. Mobil: Menü (Tema/Veri) + Yeni hedef + Giriş/Çıkış — metinler açık */}
        <div className="flex flex-nowrap items-center justify-end gap-2 min-w-0 flex-1 md:flex-initial">
          <input
            ref={importFileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportFileChange}
          />
          {/* Mobil: tek "Menü" dropdown ile Tema ve Veri (metinli) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden shrink-0 h-9 gap-2 px-3">
                <Menu className="h-[1.2rem] w-[1.2rem]" />
                Menü
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onClick={() => setTheme(store.theme === 'dark' ? 'light' : 'dark')}>
                {store.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                Tema değiştir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4" />
                Veri yedekle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImportClick}>
                <Upload className="h-4 w-4" />
                Veri yükle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Masaüstü: ayrı Tema ve Veri butonları */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <div className="hidden md:block">
            <DataExportImport />
          </div>
          <AddGoalDialog />
          {user ? <SignOutButton /> : <SignInButton onClick={() => setAuthDialogOpen(true)} />}
        </div>
      </header>

      <main className="w-full">
          {/* Mobilde: sekmeler header altında */}
          <TabsList className="mb-4 md:hidden">
            <TabsTrigger value="bugun">Bugün</TabsTrigger>
            <TabsTrigger value="calendar">Takvim</TabsTrigger>
            <TabsTrigger value="summary">Özet</TabsTrigger>
            <TabsTrigger value="earnings">Para</TabsTrigger>
            <TabsTrigger value="daily">Günlük</TabsTrigger>
          </TabsList>
          <TabsContent value="bugun">
            <TodayTab />
          </TabsContent>
          <TabsContent value="calendar">
            <Card>
              <CardHeader className="pb-2">
                <MonthNav
                  year={year}
                  month={month}
                  onPrev={prevMonth}
                  onNext={nextMonth}
                />
              </CardHeader>
              <CardContent className="p-0 sm:p-4 pt-0">
                <CalendarGrid year={year} month={month} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="summary">
            <SummaryTab />
          </TabsContent>
          <TabsContent value="earnings">
            <EarningsTab />
          </TabsContent>
          <TabsContent value="daily">
            <DailyTab />
          </TabsContent>
      </main>

      {/* Tehlikeli işlem: sayfa altında, dikkat çekmeyecek şekilde */}
      <footer className="mt-8 pt-6 border-t border-border/50 flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => setResetModalOpen(true)}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2"
        >
          Veriyi sıfırla
        </button>
        {user && (
          <button
            type="button"
            onClick={() => setDeleteAccountModalOpen(true)}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2"
          >
            Hesabımı sil
          </button>
        )}
      </footer>
      </Tabs>

      <ResetDangerModal open={resetModalOpen} onOpenChange={setResetModalOpen} />
      <DeleteAccountModal open={deleteAccountModalOpen} onOpenChange={setDeleteAccountModalOpen} />
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
    </>
  )
}

export default App
