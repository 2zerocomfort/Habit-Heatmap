import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, BarChart2 } from "lucide-react";
import { DayData, getDayKey, getMonthTotal } from "@/lib/storage";
import { MONTH_SHORT, getDaysInMonth, getCountColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface YearViewProps {
  data: DayData;
  onIncrement: (key: string) => void;
  onReset: (key: string) => void;
  onMonthClick: (month: number) => void;
  onNavigateStats: () => void;
}

const DAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];
const LONG_PRESS_MS = 600;

interface MiniDayCellProps {
  day: number;
  count: number;
  isToday: boolean;
  label: string;
  onIncrement: () => void;
  onReset: () => void;
}

function MiniDayCell({ day, count, isToday, label, onIncrement, onReset }: MiniDayCellProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  function startPress() {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      onReset();
    }, LONG_PRESS_MS);
  }

  function endPress() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!didLongPress.current) {
      onIncrement();
    }
  }

  function cancelPress() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    didLongPress.current = false;
  }

  const colorClass = getCountColor(count);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-between select-none cursor-pointer rounded-sm",
        "w-full aspect-square min-w-[18px] min-h-[18px]",
        "transition-all duration-100 ease-out",
        "hover:ring-1 hover:ring-white/25 hover:scale-110 hover:z-10",
        "active:scale-95",
        colorClass,
        isToday && "ring-1 ring-white/60",
      )}
      title={`${label}: ${count}`}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onContextMenu={(e) => { e.preventDefault(); onReset(); }}
    >
      <span
        className={cn(
          "text-[8px] leading-none font-medium pt-[2px] pl-[2px] self-start",
          count > 0 ? "text-white/70" : "text-white/30",
        )}
      >
        {day}
      </span>
      {count > 0 && (
        <span className="text-[7px] leading-none font-mono font-bold text-white/80 pb-[2px]">
          {count}
        </span>
      )}
    </div>
  );
}

export function YearView({ data, onIncrement, onReset, onMonthClick, onNavigateStats }: YearViewProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const today = new Date();
  const todayKey = getDayKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setYear(y => y - 1)}
            className="p-1.5 rounded hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight">{year}</h1>
          <button
            onClick={() => setYear(y => y + 1)}
            disabled={year >= currentYear}
            className="p-1.5 rounded hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <button
          onClick={onNavigateStats}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <BarChart2 className="w-4 h-4" />
          Stats
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 12 }, (_, monthIdx) => {
            const daysInMonth = getDaysInMonth(year, monthIdx);
            const monthTotal = getMonthTotal(data, year, monthIdx);
            const firstDow = new Date(year, monthIdx, 1).getDay();

            return (
              <motion.div
                key={monthIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: monthIdx * 0.03, duration: 0.25 }}
                className="bg-card rounded-lg p-4 border border-border hover:border-border/60 transition-colors group cursor-pointer"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest("[data-day-cell]")) return;
                  onMonthClick(monthIdx);
                }}
              >
                {/* Month header */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {MONTH_SHORT[monthIdx]}
                  </span>
                  <span className={cn(
                    "text-xs font-mono",
                    monthTotal > 0 ? "text-muted-foreground" : "text-muted-foreground/30"
                  )}>
                    {monthTotal > 0 ? monthTotal : "—"}
                  </span>
                </div>

                {/* Day name headers */}
                <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                  {DAY_HEADERS.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center text-[8px] text-muted-foreground/50 font-medium py-0.5"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-0.5">
                  {/* Empty cells for offset */}
                  {Array.from({ length: firstDow }, (_, i) => (
                    <div key={`blank-${i}`} className="aspect-square" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }, (_, dayIdx) => {
                    const day = dayIdx + 1;
                    const key = getDayKey(year, monthIdx, day);
                    const count = data[key] ?? 0;
                    const isToday = key === todayKey;

                    return (
                      <div key={day} data-day-cell="true">
                        <MiniDayCell
                          day={day}
                          count={count}
                          isToday={isToday}
                          label={`${MONTH_SHORT[monthIdx]} ${day}, ${year}`}
                          onIncrement={() => onIncrement(key)}
                          onReset={() => onReset(key)}
                        />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="max-w-5xl mx-auto mt-6 flex items-center gap-3 justify-end text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1 items-center">
            {[0, 1, 2, 3, 4, 5].map(c => (
              <div key={c} className={`w-3 h-3 rounded-sm count-${c}`} />
            ))}
            <div className="w-3 h-3 rounded-sm count-high" />
          </div>
          <span>More</span>
        </div>
      </main>
    </div>
  );
}
