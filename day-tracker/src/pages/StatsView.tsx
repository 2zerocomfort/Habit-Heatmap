import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Flame, Calendar, TrendingUp, Activity } from "lucide-react";
import { DayData, getYearTotal, computeStreaks, getDayKey, TRACKING_START_KEY } from "@/lib/storage";
import { MONTH_SHORT, getDaysInMonth } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatsViewProps {
  data: DayData;
  onBack: () => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  delay?: number;
}

type ChartMode = "relapse" | "clean";

function StatCard({ icon, label, value, sub, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-mono font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </div>
    </motion.div>
  );
}

export function StatsView({ data, onBack }: StatsViewProps) {
  const [chartMode, setChartMode] = useState<ChartMode>("relapse");

  const currentYear = new Date().getFullYear();
  const yearTotal = getYearTotal(data, currentYear);
  const { currentStreak, longestStreak, relapseDays } = computeStreaks(data, currentYear);

  const today = new Date();
  const todayKey = getDayKey(today.getFullYear(), today.getMonth(), today.getDate());

  // Build monthly stats, respecting TRACKING_START_KEY and only up to today
  const monthStats = Array.from({ length: 12 }, (_, m) => {
    const daysInMonth = getDaysInMonth(currentYear, m);
    let trackable = 0;
    let relapseCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const key = getDayKey(currentYear, m, d);
      if (key < TRACKING_START_KEY) continue;
      if (key > todayKey) break;
      trackable++;
      if ((data[key] ?? 0) > 0) relapseCount++;
    }

    const cleanCount = trackable - relapseCount;
    const cleanPct = trackable > 0 ? Math.round((cleanCount / trackable) * 100) : null;

    return { month: m, trackable, relapseCount, cleanCount, cleanPct };
  });

  const activeMonths = monthStats.filter(m => m.trackable > 0);

  const chartValues = monthStats.map(m =>
    chartMode === "relapse" ? m.relapseCount : m.cleanCount
  );
  const maxVal = Math.max(...chartValues, 1);

  const bestMonth = activeMonths.length > 0
    ? activeMonths.reduce((a, b) => {
        const av = chartMode === "relapse" ? a.relapseCount : a.cleanCount;
        const bv = chartMode === "relapse" ? b.relapseCount : b.cleanCount;
        return av >= bv ? a : b;
      })
    : null;

  const barColor = chartMode === "relapse" ? "bg-primary" : "bg-emerald-600";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Year
        </button>
        <h1 className="text-lg font-semibold">{currentYear} Stats</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Activity className="w-5 h-5" />}
              label="Yearly Total"
              value={yearTotal}
              sub={`across ${relapseDays} relapse day${relapseDays === 1 ? "" : "s"}`}
              delay={0}
            />
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              label="Relapse Days"
              value={relapseDays}
              sub="days with count > 0"
              delay={0.05}
            />
            <StatCard
              icon={<Flame className="w-5 h-5" />}
              label="Clean Streak"
              value={currentStreak}
              sub={currentStreak === 1 ? "clean day" : "clean days"}
              delay={0.1}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Best Clean Streak"
              value={longestStreak}
              sub={longestStreak === 1 ? "clean day" : "clean days"}
              delay={0.15}
            />
          </div>

          {/* Monthly Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.25 }}
            className="bg-card border border-border rounded-lg p-5"
          >
            {/* Header row */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="text-sm font-medium">
                  Monthly Breakdown{" "}
                  <span className="text-muted-foreground font-normal">
                    ({chartMode === "relapse" ? "Relapse" : "Clean"})
                  </span>
                </h2>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  Tracking started: Apr 4, 2026
                </p>
              </div>

              {/* Toggle */}
              <div className="flex items-center bg-secondary rounded-md p-0.5 shrink-0">
                {(["relapse", "clean"] as ChartMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setChartMode(mode)}
                    className={cn(
                      "relative px-3 py-1 text-xs rounded transition-colors duration-150",
                      chartMode === mode
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {chartMode === mode && (
                      <motion.div
                        layoutId="chart-toggle-bg"
                        className="absolute inset-0 bg-background rounded shadow-sm"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 capitalize">{mode === "relapse" ? "Relapse" : "Clean"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Best label */}
            <div className="flex items-center justify-end mb-3 h-4">
              <AnimatePresence mode="wait">
                {bestMonth && (chartMode === "relapse" ? bestMonth.relapseCount : bestMonth.cleanCount) > 0 && (
                  <motion.span
                    key={chartMode}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="text-xs text-muted-foreground"
                  >
                    Best: {MONTH_SHORT[bestMonth.month]} (
                    {chartMode === "relapse" ? bestMonth.relapseCount : bestMonth.cleanCount})
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Bars */}
            <div className="space-y-2.5">
              {monthStats.map(({ month, trackable, relapseCount, cleanCount, cleanPct }, idx) => {
                const barVal = chartMode === "relapse" ? relapseCount : cleanCount;
                const barWidth = trackable > 0 ? `${(barVal / maxVal) * 100}%` : "0%";

                return (
                  <motion.div
                    key={month}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + idx * 0.02, duration: 0.2 }}
                    className="flex items-center gap-3"
                  >
                    {/* Month label */}
                    <span className="text-xs text-muted-foreground w-7 shrink-0">
                      {MONTH_SHORT[month]}
                    </span>

                    {/* Bar */}
                    <div className="flex-1 bg-secondary rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", trackable > 0 ? barColor : "")}
                        initial={{ width: 0 }}
                        animate={{ width: trackable > 0 ? barWidth : "0%" }}
                        transition={{
                          delay: 0.3 + idx * 0.02,
                          duration: 0.4,
                          ease: "easeOut",
                        }}
                      />
                    </div>

                    {/* Count */}
                    <span className="text-xs font-mono text-muted-foreground w-5 text-right shrink-0">
                      {trackable > 0 ? barVal : ""}
                    </span>

                    {/* Clean % */}
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${month}-${chartMode}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-xs font-mono w-9 text-right shrink-0"
                        style={{
                          color:
                            cleanPct === null
                              ? "transparent"
                              : cleanPct >= 80
                              ? "hsl(142, 60%, 45%)"
                              : cleanPct >= 50
                              ? "hsl(40, 80%, 55%)"
                              : "hsl(0, 60%, 55%)",
                        }}
                      >
                        {cleanPct !== null ? `${cleanPct}%` : ""}
                      </motion.span>
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer note */}
            <p className="text-[11px] text-muted-foreground/50 mt-4">
              % = clean days / trackable days &nbsp;·&nbsp; green ≥ 80% &nbsp;·&nbsp; yellow ≥ 50%
            </p>
          </motion.div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.25 }}
            className="bg-card border border-border rounded-lg p-5"
          >
            <h2 className="text-sm font-medium mb-3">Legend</h2>
            <div className="flex items-center gap-4 flex-wrap">
              {[
                { label: "0", cls: "count-0" },
                { label: "1", cls: "count-1" },
                { label: "2", cls: "count-2" },
                { label: "3", cls: "count-3" },
                { label: "4", cls: "count-4" },
                { label: "5", cls: "count-5" },
                { label: "6+", cls: "count-high" },
              ].map(({ label, cls }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded-sm ${cls}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Click a day to increment its count. Long-press or right-click to reset.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
