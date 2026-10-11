import { EyeOff, TriangleAlert } from "lucide-react";
import { StatusPill } from "../../../components/ui/StatusPill";
import { cn } from "../../../lib/cn";
import type { OverviewRow, RoundOverview } from "../../../types";

// ≥ 37.5% ของช่วงสเกล (1.5 คะแนนบน 1–5)
const GAP_RATIO = 0.375;
function isLargeGap(peer: number | null, self: number | null, min: number, max: number) {
  if (peer === null || self === null) return false;
  return Math.abs(self - peer) / (max - min) >= GAP_RATIO;
}

export default function ScoreTable({
  overview,
  rows,
  canRelease,
  onOpenStudent,
}: {
  overview: RoundOverview;
  rows: OverviewRow[];
  // ปิดรับแล้ว — เริ่มบอกได้ว่าใครจะไม่เห็นผลเพราะผู้ประเมินไม่พอ
  canRelease: boolean;
  onOpenStudent: (studentId: string) => void;
}) {
  const scale = overview.round;
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span>
          <span className="font-bold text-foreground">ตัวเลขใหญ่</span> = เฉลี่ยจากเพื่อน,{" "}
          <span className="font-bold text-foreground">ตัวเล็ก</span> = ให้ตัวเอง (สเกล {scale.scaleMin}–{scale.scaleMax})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded border border-amber-300 bg-amber-100" /> ให้ตัวเองต่างจากเพื่อนมาก
        </span>
        {canRelease && (
          <span className="flex items-center gap-1">
            <EyeOff size={12} /> ผู้ประเมินไม่ถึง {overview.minPeers} คน — นักศึกษาไม่เห็นผลของตัวเอง
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-border bg-muted text-xs text-muted-foreground">
              <th className="px-4 py-3 font-semibold">นักศึกษา</th>
              <th className="px-3 py-3 font-semibold">สถานะ</th>
              {overview.questions.map((q) => (
                <th key={q.id} className="px-3 py-3 text-center font-semibold" title={q.prompt}>
                  <span className="block">ข้อ {q.orderNo}</span>
                  <span className="mx-auto block max-w-[9rem] truncate font-normal">{q.prompt}</span>
                </th>
              ))}
              <th className="px-3 py-3 text-center font-semibold">
                <span className="block">รวม</span>
                <span className="block font-normal">เฉลี่ยทุกด้าน</span>
              </th>
              <th className="px-3 py-3 text-center font-semibold">ผู้ประเมิน</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const below = canRelease && row.peerCount < overview.minPeers;
              return (
                <tr key={row.student.id} className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/60">
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => onOpenStudent(row.student.id)}
                      className="text-left font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {row.student.name}
                    </button>
                    <span className="block font-mono text-[11px] text-muted-foreground">{row.student.studentId}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusPill status={row.submission?.status ?? "not_submitted"} />
                  </td>
                  {row.scores.map((s) => {
                    const gap = isLargeGap(s.peerAverage, s.selfScore, scale.scaleMin, scale.scaleMax);
                    return (
                      <td
                        key={s.questionId}
                        className={cn("px-3 py-2.5 text-center", gap && "bg-amber-50")}
                        title={gap ? "ให้คะแนนตัวเองต่างจากที่เพื่อนให้มาก" : undefined}
                      >
                        <span className="block font-mono text-base font-bold text-foreground">
                          {s.peerAverage?.toFixed(1) ?? "—"}
                        </span>
                        <span className={cn("flex items-center justify-center gap-0.5 font-mono text-[11px]", gap ? "font-semibold text-amber-700" : "text-muted-foreground")}>
                          {gap && <TriangleAlert size={10} />}
                          ตัวเอง {s.selfScore ?? "—"}
                        </span>
                      </td>
                    );
                  })}
                  <td className="border-l border-border px-3 py-2.5 text-center">
                    <span className="block font-mono text-base font-bold text-foreground">
                      {row.overall.peerAverage?.toFixed(1) ?? "—"}
                    </span>
                    <span className="block font-mono text-[11px] text-muted-foreground">
                      ตัวเอง {row.overall.selfAverage?.toFixed(1) ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("inline-flex items-center gap-1 font-mono", below ? "text-amber-700" : "text-foreground")}>
                      {below && <EyeOff size={12} aria-label="นักศึกษาไม่เห็นผล" />}
                      {row.peerCount}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
