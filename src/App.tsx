import { useState } from 'react'
import { useStore } from '@/store'
import { FirstSetupScreen } from '@/components/FirstSetupScreen'
import { AddGoalDialog } from '@/components/AddGoalDialog'
import { ThemeToggle } from '@/components/ThemeToggle'
import { DataExportImport } from '@/components/DataExportImport'
import { ResetDangerModal } from '@/components/ResetDangerModal'
import { CalendarGrid, MonthNav } from '@/components/CalendarGrid'
import { SummaryTab } from '@/components/SummaryTab'
import { EarningsTab } from '@/components/EarningsTab'
import { DailyTab } from '@/components/DailyTab'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

function App() {
  const store = useStore()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [resetModalOpen, setResetModalOpen] = useState(false)

  if (store.goals.length === 0) {
    return <FirstSetupScreen />
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
    <div className="min-h-screen w-full bg-background text-foreground p-4 md:p-6">
      <header className="w-full mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Düzen</h1>
          <p className="text-sm text-muted-foreground">
            Günlük hedeflerini takip et. Hücreye tıkla: ✓ yapıldı → ✗ yapılmadı → boş
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 border-border"
            title="Veriyi sıfırla"
            aria-label="Veriyi sıfırla"
            onClick={() => setResetModalOpen(true)}
          >
            <RotateCcw className="h-[1.2rem] w-[1.2rem]" />
            Sıfırla
          </Button>
          <ThemeToggle />
          <DataExportImport />
          <AddGoalDialog />
        </div>
      </header>

      <main className="w-full">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="calendar">Takvim</TabsTrigger>
            <TabsTrigger value="summary">Özet</TabsTrigger>
            <TabsTrigger value="earnings">Para</TabsTrigger>
            <TabsTrigger value="daily">Günlük</TabsTrigger>
          </TabsList>
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
        </Tabs>

        
      </main>

      <ResetDangerModal open={resetModalOpen} onOpenChange={setResetModalOpen} />
    </div>
  )
}

export default App
