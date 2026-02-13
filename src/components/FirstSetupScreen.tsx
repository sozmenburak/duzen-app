import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { pushStoreToSupabase } from '@/lib/supabaseSync'
import { addGoal, emit, importData, useStore } from '@/store'
import { dateToKey } from '@/types'
import { ArrowRight, FileUp, Plus, Target, Check, LogOut, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Taslak / öneri hedefler — kullanıcı bunları seçip toplu ekleyebilir */
const DRAFT_GOALS = [
  '3 litre su iç',
  '20 şınav çek',
  'Şeker kullanma',
  '8 saat uyu',
  'Dışarı çık',
  'Duş al',
  '30 sayfa kitap oku',
  'Sosyal medyadan uzak dur',
  'Egzersiz yap',
  'Erken kalk',
  'Günlük yaz',
  'Meditasyon yap',
]

type Step = 'choice' | 'add-goal'

export function FirstSetupScreen({ onOpenAuthDialog }: { onOpenAuthDialog?: () => void }) {
  useStore()
  const [step, setStep] = useState<Step>('choice')
  const [customTitle, setCustomTitle] = useState('')
  /** Yazıp Ekle ile eklenen hedefler (sırayla listelenir, henüz store'a gitmedi) */
  const [customAddedGoals, setCustomAddedGoals] = useState<string[]>([])
  /** Eklenen hedeflerden hangileri tikli (İleri'de eklenecek) */
  const [selectedCustomGoals, setSelectedCustomGoals] = useState<Set<string>>(new Set())
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  /** İleri aktif: en az bir tikli hedef var (eklediklerinden veya taslaktan) */
  const canFinish = selectedCustomGoals.size > 0 || selectedDrafts.size > 0

  const toggleDraft = (title: string) => {
    setSelectedDrafts((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  /** Kendi yazdığını listeye ekle (tikli); store'a göndermiyoruz, İleri'de gidecek */
  const addCustomGoalToList = () => {
    const t = customTitle.trim()
    if (!t) return
    setCustomAddedGoals((prev) => [...prev, t])
    setSelectedCustomGoals((prev) => new Set(prev).add(t))
    setCustomTitle('')
  }

  const toggleCustomGoal = (title: string) => {
    setSelectedCustomGoals((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  const handleGoToApp = () => {
    if (!canFinish) return
    const startDate = dateToKey(new Date())
    const allTitles = [...selectedCustomGoals, ...selectedDrafts]
    const seen = new Set<string>()
    allTitles.forEach((title) => {
      if (seen.has(title)) return
      seen.add(title)
      addGoal({ id: crypto.randomUUID(), title, startDate })
    })
    emit()
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const { user, signOut } = useAuth()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const text = reader.result as string
      if (importData(text)) {
        if (user?.id) {
          const { error } = await pushStoreToSupabase(user.id)
          if (error) console.error('[FirstSetupScreen] Import sonrası Supabase push hatası:', error)
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-4 md:p-8 overflow-auto">
      {user ? (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 text-muted-foreground"
          onClick={() => signOut()}
          title="Çıkış yap"
        >
          <LogOut className="h-4 w-4" />
          Çıkış
        </Button>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />

      {step === 'choice' && (
        <>
          <div className="text-center mb-8 max-w-md">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Düzen</h1>
            <p className="mt-2 text-muted-foreground">
              Günlük hedeflerini takip etmeye başlamak için aşağıdan bir yol seç.
            </p>
          </div>

          <div
            className={cn(
              'grid gap-4 w-full mx-auto sm:grid-cols-2',
              user ? 'max-w-md' : 'max-w-2xl lg:grid-cols-3'
            )}
          >
            <Card
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
              tabIndex={0}
              onClick={() => setStep('add-goal')}
              onKeyDown={(e) => e.key === 'Enter' && setStep('add-goal')}
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                  <Target className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">İlk hedefini ekle</CardTitle>
                <CardDescription>
                  Kendi hedefini yaz veya önerilen taslaklardan seç.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
              tabIndex={0}
              onClick={handleImportClick}
              onKeyDown={(e) => e.key === 'Enter' && handleImportClick()}
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                  <FileUp className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Import et</CardTitle>
                <CardDescription>
                  Daha önce yedeklediğin JSON dosyasını yükle.
                </CardDescription>
              </CardHeader>
            </Card>

            {!user && onOpenAuthDialog ? (
              <Card
                className="cursor-pointer transition-all hover:border-primary hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
                tabIndex={0}
                onClick={onOpenAuthDialog}
                onKeyDown={(e) => e.key === 'Enter' && onOpenAuthDialog()}
              >
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                    <LogIn className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Giriş yap</CardTitle>
                  <CardDescription>
                    Verilerini senkronize et; tüm cihazlarından aynı hedeflere eriş.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : null}
          </div>
          {!user && (
            <p className="mt-6 text-center text-sm text-muted-foreground/90 max-w-md">
              Verilerin kaybolmasın; giriş yaparak telefondan, bilgisayardan ve tüm cihazlarından aynı veriyi görüntüle ve yönet.
            </p>
          )}
        </>
      )}

      {step === 'add-goal' && (
        <Card className="w-full max-w-xl">
          <CardHeader className="pb-4">
            <button
              type="button"
              onClick={() => setStep('choice')}
              className="text-sm text-muted-foreground hover:text-foreground mb-2 -ml-1 w-fit"
            >
              ← Geri
            </button>
            <CardTitle>İlk hedefini ekle</CardTitle>
            <CardDescription>
              Kendi hedefini yazıp ekleyebilir veya aşağıdaki taslaklardan istediklerini işaretleyebilirsin. İleri’ye basınca seçtiklerin de eklenir ve uygulamaya geçilir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Kendi hedefini yaz */}
            <div className="space-y-2">
              <Label htmlFor="custom-goal">Kendi hedefin</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-goal"
                  placeholder="Örn: 10.000 adım at"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomGoalToList())}
                />
                <Button
                  type="button"
                  onClick={addCustomGoalToList}
                  disabled={!customTitle.trim()}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Ekle
                </Button>
              </div>
            </div>

            {/* Eklediğin hedefler — tikli listelenir, tik kaldırılabilir */}
            {customAddedGoals.length > 0 && (
              <div className="space-y-3">
                <Label>Eklediğin hedefler (tikini kaldırabilirsin)</Label>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {customAddedGoals.map((title, index) => (
                    <li key={`custom-${index}-${title}`}>
                      <label
                        className={cn(
                          'flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors',
                          'hover:bg-accent/50',
                          selectedCustomGoals.has(title) && 'border-primary bg-primary/5'
                        )}
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-input bg-background">
                          {selectedCustomGoals.has(title) ? (
                            <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                          ) : null}
                        </span>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={selectedCustomGoals.has(title)}
                          onChange={() => toggleCustomGoal(title)}
                        />
                        <span className="text-sm">{title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Taslaklar / Öneriler */}
            <div className="space-y-3">
              <Label>Önerilen hedefler (istediklerini işaretle, İleri’de hepsi eklenir)</Label>
              <ul className="grid gap-2 sm:grid-cols-2">
                {DRAFT_GOALS.map((title) => (
                  <li key={title}>
                    <label
                      className={cn(
                        'flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors',
                        'hover:bg-accent/50',
                        selectedDrafts.has(title) && 'border-primary bg-primary/5'
                      )}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-input bg-background">
                        {selectedDrafts.has(title) ? (
                          <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                        ) : null}
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selectedDrafts.has(title)}
                        onChange={() => toggleDraft(title)}
                      />
                      <span className="text-sm">{title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setStep('choice')} className="sm:mr-auto">
                Geri
              </Button>
              <Button
                onClick={handleGoToApp}
                disabled={!canFinish}
                className="gap-2"
              >
                İleri — Uygulamaya geç
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
