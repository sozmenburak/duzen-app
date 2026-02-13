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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LogOut, LogIn, Menu, Sun, Moon, Download, Upload, X } from 'lucide-react'

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
  const { user, loading: authLoading, signOut } = useAuth()
  const store = useStore()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
        {/* Mobil: Yeni hedef sola */}
        <div className="flex shrink-0 md:hidden">
          <AddGoalDialog />
        </div>
        {/* Masaüstü: sekmeler sol üstte */}
        <TabsList className="hidden md:flex mb-0 shrink-0">
          <TabsTrigger value="bugun">Bugün</TabsTrigger>
          <TabsTrigger value="calendar">Takvim</TabsTrigger>
          <TabsTrigger value="summary">Özet</TabsTrigger>
          <TabsTrigger value="earnings">Para</TabsTrigger>
          <TabsTrigger value="daily">Günlük</TabsTrigger>
        </TabsList>
        {/* Masaüstü: Tema, Veri, Yeni hedef, Çıkış. Mobil: sadece Menü butonu sağda */}
        <div className="flex flex-nowrap items-center justify-end gap-2 min-w-0 flex-1 md:flex-initial">
          <input
            ref={importFileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            className="md:hidden shrink-0 h-9 gap-2 px-3"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Menüyü aç"
          >
            <Menu className="h-[1.2rem] w-[1.2rem]" />
            Menü
          </Button>
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <DataExportImport />
            <AddGoalDialog />
            {user ? <SignOutButton /> : <SignInButton onClick={() => setAuthDialogOpen(true)} />}
          </div>
        </div>
      </header>

      {/* Mobil: tam ekran menü */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent
          showClose={false}
          className="md:hidden fixed inset-0 z-50 h-dvh w-full max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-background p-0 shadow-none duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border py-4 pl-8 pr-4">
              <DialogTitle className="text-lg font-semibold">Menü</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Menüyü kapat"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 p-4">
              <button
                type="button"
                className="flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left text-base transition-colors hover:bg-muted active:bg-muted"
                onClick={() => {
                  setTheme(store.theme === 'dark' ? 'light' : 'dark')
                  setMobileMenuOpen(false)
                }}
              >
                {store.theme === 'dark' ? (
                  <Sun className="h-5 w-5 shrink-0 text-foreground" />
                ) : (
                  <Moon className="h-5 w-5 shrink-0 text-foreground" />
                )}
                <span>Tema değiştir</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left text-base transition-colors hover:bg-muted active:bg-muted"
                onClick={() => {
                  handleExport()
                  setMobileMenuOpen(false)
                }}
              >
                <Download className="h-5 w-5 shrink-0 text-foreground" />
                <span>Veri yedekle</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left text-base transition-colors hover:bg-muted active:bg-muted"
                onClick={() => {
                  handleImportClick()
                  setMobileMenuOpen(false)
                }}
              >
                <Upload className="h-5 w-5 shrink-0 text-foreground" />
                <span>Veri yükle</span>
              </button>
              {user ? (
                <button
                  type="button"
                  className="mt-auto flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left text-base text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted"
                  onClick={() => {
                    signOut()
                    setMobileMenuOpen(false)
                  }}
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span>Çıkış yap</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="mt-auto flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left text-base transition-colors hover:bg-muted active:bg-muted"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setAuthDialogOpen(true)
                  }}
                >
                  <LogIn className="h-5 w-5 shrink-0 text-foreground" />
                  <span>Giriş yap</span>
                </button>
              )}
            </nav>
          </div>
        </DialogContent>
      </Dialog>

      <main className="w-full">
          {/* Mobilde: sekmeler header altında, ortada */}
          <TabsList className="mb-4 md:hidden w-full justify-center">
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
