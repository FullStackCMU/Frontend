import { cn } from "../../../lib/cn";
import { describeSignal, isWarning } from "../../../lib/signals";
import type { OverviewRow, RoundOverview, Signal } from "../../../types";

const firstName = (name: string) => name.split(" ")[0];

export default function SignalList({
  signals,
  rows,
  questions,
  limit,
}: {
  signals: Signal[];
  rows: OverviewRow[];
  questions: RoundOverview["questions"];
  limit?: number;
}) {
  const shown = limit ? signals.slice(0, limit) : signals;
  return (
    <ul className="flex flex-col gap-2">
      {shown.map((s, i) => (
        <li key={i} className="flex gap-2 text-xs leading-relaxed text-foreground">
          <span
            aria-hidden="true"
            className={cn("mt-1 h-3.5 w-1 shrink-0 rounded-full", isWarning(s) ? "bg-amber-400" : "bg-zinc-300")}
          />
          <span>
            <span className="font-bold">{firstName(rows.find((r) => r.student.id === s.studentId)?.student.name ?? "")}</span>{" "}
            {describeSignal(s, questions)}
          </span>
        </li>
      ))}
      {shown.length < signals.length && (
        <li className="pl-3 text-xs text-muted-foreground">อีก {signals.length - shown.length} รายการ</li>
      )}
    </ul>
  );
}
