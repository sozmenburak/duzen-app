import { useMemo } from 'react'
import type { Goal } from '@/types'
import { getHeatmapGrid } from '@/lib/summary'

const WEEKDAY_LABELS = ['Pzt', '', 'Çar', '', 'Cum', '', 'Paz']
const MONTH_LABELS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

interface ContributionHeatmapProps {
  goal: Goal
  daysBack?: number
  className?: string
}

export function ContributionHeatmap({ goal, daysBack = 364, className }: ContributionHeatmapProps) {
  const grid = useMemo(() => getHeatmapGrid(goal, daysBack), [goal, daysBack])

  const { weekCount, monthColumns } = useMemo(() => {
    const weekCount = grid[0]?.length ?? 0
    const today = new Date()
    const start = new Date(today)
    start.setDate(start.getDate() - daysBack)
    const monthCols: { col: number; label: string }[] = []
    let lastMonth = -1
    for (let col = 0; col < weekCount; col++) {
      const d = new Date(start)
      d.setDate(start.getDate() + col * 7)
      const m = d.getMonth()
      if (m !== lastMonth) {
        monthCols.push({ col, label: MONTH_LABELS[m] })
        lastMonth = m
      }
    }
    return { weekCount, monthColumns: monthCols }
  }, [grid, daysBack])

  const cellSize = 12
  const gap = 3
  const totalWidth = weekCount * cellSize + (weekCount - 1) * gap

  return (
    <div className={className}>
      <div className="flex gap-1 items-start">
        <div className="flex flex-col justify-around text-[10px] text-muted-foreground pt-7 pb-2 pr-1">
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className="h-3 flex items-center">
              {label}
            </span>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto min-w-0">
          <div className="inline-block" style={{ minWidth: totalWidth }}>
            <div
              className="relative h-4 mb-0.5 text-[10px] text-muted-foreground"
              style={{ width: totalWidth }}
            >
              {monthColumns.map(({ col, label }) => (
                <span
                  key={col}
                  className="absolute"
                  style={{ left: col * (cellSize + gap) }}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-[3px]">
              {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-[3px]">
                  {row.map((status, colIndex) => (
                    <div
                      key={colIndex}
                      className={cn(
                        'rounded-sm flex-shrink-0',
                        status === 'none' && 'bg-muted/50',
                        status === 'skip' && 'bg-destructive/30 dark:bg-destructive/40',
                        status === 'done' && 'bg-green-600 dark:bg-green-500'
                      )}
                      style={{ width: cellSize, height: cellSize }}
                      title={`${status === 'done' ? 'Yapıldı' : status === 'skip' ? 'Yapılmadı' : 'Veri yok'}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <span>Az</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-muted/50" title="Veri yok" />
          <div className="w-3 h-3 rounded-sm bg-destructive/30 dark:bg-destructive/40" title="Yapılmadı" />
          <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" title="Yapıldı" />
        </div>
        <span>Çok</span>
      </div>
    </div>
  )
}

function cn(...args: (string | boolean | undefined)[]) {
  return args.filter(Boolean).join(' ')
}
