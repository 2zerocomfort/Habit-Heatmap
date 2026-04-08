import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { DayCell } from "@/components/DayCell";
import { DayData, getDayKey, getMonthTotal } from "@/lib/storage";
import { MONTH_NAMES, getDaysInMonth } from "@/lib/utils";

interface MonthViewProps {
  data: DayData;
  year: number;
  month: number;
  onIncrement: (key: string) => void;
  onReset: (key: string) => void;
  onBack: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthView({
  data,
  year,
  month,
  onIncrement,
  onReset,
  onBack,
  onPrevMonth,
  onNextMonth,
}: MonthViewProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = new Date(year, month, 1).getDay();
  const monthTotal = getMonthTotal(data, year, month);

  const today = new Date();
  const todayKey = getDayKey(today.getFullYear(), today.getMonth(), today.getDate());

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const isAtLatest = year >= currentYear && month >= currentMonth;

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const totalCells = Math.ceil(cells.length / 7) * 7;
  while (cells.length < totalCells) cells.push(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Year
        </button>
        <div className="flex items-center gap-3">
          <button onClick={onPrevMonth} className="p-1.5 rounded hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold">{MONTH_NAMES[month]}</h1>
            <p className="text-xs text-muted-foreground">{year}</p>
          </div>
          <button
            onClick={onNextMonth}
            disabled={isAtLatest}
            className="p-1.5 rounded hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="text-right min-w-[60px]">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-mono font-semibold text-primary">{monthTotal}</p>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-xs text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="w-full aspect-square" />;
              }
              const key = getDayKey(year, month, day);
              const count = data[key] ?? 0;
              const isToday = key === todayKey;

              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.01, duration: 0.15 }}
                  className={`relative flex flex-col items-center gap-1 ${isToday ? "ring-1 ring-white/40 rounded-md" : ""}`}
                >
                  <span className="text-xs text-muted-foreground mt-1">{day}</span>
                  <DayCell
                    count={count}
                    size="md"
                    label={`${MONTH_NAMES[month]} ${day}`}
                    onIncrement={() => onIncrement(key)}
                    onReset={() => onReset(key)}
                  />
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground">
            <span>Tip: click to add, long-press or right-click to reset</span>
          </div>
        </div>
      </main>
    </div>
  );
}
