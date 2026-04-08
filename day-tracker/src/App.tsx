import { useState, useCallback } from "react";
import { YearView } from "@/pages/YearView";
import { MonthView } from "@/pages/MonthView";
import { StatsView } from "@/pages/StatsView";
import { InstallBanner } from "@/components/InstallBanner";
import { loadData, saveData, incrementDay, resetDay, DayData } from "@/lib/storage";

type View =
  | { type: "year" }
  | { type: "month"; month: number; year: number }
  | { type: "stats" };

function App() {
  const [data, setData] = useState<DayData>(loadData);
  const [view, setView] = useState<View>({ type: "year" });

  const handleIncrement = useCallback((key: string) => {
    setData(prev => {
      const next = incrementDay(prev, key);
      saveData(next);
      return next;
    });
  }, []);

  const handleReset = useCallback((key: string) => {
    setData(prev => {
      const next = resetDay(prev, key);
      saveData(next);
      return next;
    });
  }, []);

  if (view.type === "stats") {
    return (
      <>
        <StatsView
          data={data}
          onBack={() => setView({ type: "year" })}
        />
        <InstallBanner />
      </>
    );
  }

  if (view.type === "month") {
    const { month, year } = view;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    function prevMonth() {
      const newMonth = month === 0 ? 11 : month - 1;
      const newYear = month === 0 ? year - 1 : year;
      setView({ type: "month", month: newMonth, year: newYear });
    }

    function nextMonth() {
      if (year >= currentYear && month >= currentMonth) return;
      const newMonth = month === 11 ? 0 : month + 1;
      const newYear = month === 11 ? year + 1 : year;
      setView({ type: "month", month: newMonth, year: newYear });
    }

    return (
      <>
        <MonthView
          data={data}
          year={year}
          month={month}
          onIncrement={handleIncrement}
          onReset={handleReset}
          onBack={() => setView({ type: "year" })}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />
        <InstallBanner />
      </>
    );
  }

  return (
    <>
      <YearView
        data={data}
        onIncrement={handleIncrement}
        onReset={handleReset}
        onMonthClick={(month) => setView({ type: "month", month, year: new Date().getFullYear() })}
        onNavigateStats={() => setView({ type: "stats" })}
      />
      <InstallBanner />
    </>
  );
}

export default App;
