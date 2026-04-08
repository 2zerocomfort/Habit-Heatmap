const STORAGE_KEY = "day-tracker-data";

export type DayData = Record<string, number>;

export function loadData(): DayData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DayData;
  } catch {
    return {};
  }
}

export function saveData(data: DayData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getDayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function incrementDay(data: DayData, key: string): DayData {
  return { ...data, [key]: (data[key] ?? 0) + 1 };
}

export function resetDay(data: DayData, key: string): DayData {
  const next = { ...data };
  delete next[key];
  return next;
}

export function getMonthTotal(data: DayData, year: number, month: number): number {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  return Object.entries(data)
    .filter(([k]) => k.startsWith(prefix))
    .reduce((sum, [, v]) => sum + v, 0);
}

export function getYearTotal(data: DayData, year: number): number {
  const prefix = `${year}-`;
  return Object.entries(data)
    .filter(([k]) => k.startsWith(prefix))
    .reduce((sum, [, v]) => sum + v, 0);
}

// The date from which streak tracking begins (inclusive)
export const TRACKING_START_KEY = "2026-04-04";

export function computeStreaks(data: DayData, year: number): {
  currentStreak: number;
  longestStreak: number;
  relapseDays: number;
} {
  const today = new Date();
  const todayKey = getDayKey(today.getFullYear(), today.getMonth(), today.getDate());

  // Build all day keys from TRACKING_START up to and including today
  const allKeys: string[] = [];
  outer: for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = getDayKey(year, m, d);
      if (key >= TRACKING_START_KEY) allKeys.push(key);
      if (key === todayKey) break outer;
    }
  }

  // Count relapse days: any day where count > 0
  let relapseDays = 0;
  for (const key of allKeys) {
    if ((data[key] ?? 0) > 0) relapseDays++;
  }

  // Longest clean streak: forward scan, only clean days (count === 0)
  let longestStreak = 0;
  let running = 0;
  for (const key of allKeys) {
    if ((data[key] ?? 0) === 0) {
      running++;
      if (running > longestStreak) longestStreak = running;
    } else {
      running = 0;
    }
  }

  // Current clean streak: walk backwards from today, stop at first relapse
  let currentStreak = 0;
  for (let i = allKeys.length - 1; i >= 0; i--) {
    if ((data[allKeys[i]] ?? 0) === 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak, relapseDays };
}
