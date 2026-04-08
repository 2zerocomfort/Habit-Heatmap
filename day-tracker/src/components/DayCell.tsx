import { useRef } from "react";
import { cn, getCountColor } from "@/lib/utils";

interface DayCellProps {
  count: number;
  label?: string;
  size?: "sm" | "md";
  onIncrement: () => void;
  onReset: () => void;
}

const LONG_PRESS_MS = 600;

export function DayCell({ count, label, size = "sm", onIncrement, onReset }: DayCellProps) {
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
        "day-cell select-none",
        colorClass,
        size === "sm" ? "w-3 h-3" : "w-8 h-8",
      )}
      title={label ? `${label}: ${count}` : `Count: ${count}`}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onContextMenu={(e) => { e.preventDefault(); onReset(); }}
    >
      {size === "md" && count > 0 && (
        <span className="flex items-center justify-center h-full text-xs font-mono text-white/80 font-semibold">
          {count}
        </span>
      )}
    </div>
  );
}
