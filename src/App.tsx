import { useState } from 'react'
import { useStore } from '@/store'
import { AddGoalDialog } from '@/components/AddGoalDialog'
import { ThemeToggle } from '@/components/ThemeToggle'
import { DataExportImport } from '@/components/DataExportImport'
import { CalendarGrid, MonthNav } from '@/components/CalendarGrid'
import { SummaryTab } from '@/components/SummaryTab'
import { EarningsTab } from '@/components/EarningsTab'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function App() {
  useStore()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())

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
        <div className="flex items-center gap-2">
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
        </Tabs>

        <p className="mt-4 text-xs text-muted-foreground">
          Veriler sadece bu cihazda (localStorage) saklanır. Hedef başlığına tıklayıp &quot;Hedefi sil&quot; ile silebilirsin.
        </p>
      </main>
    </div>
  )
}

export default App
