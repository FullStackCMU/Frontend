import { Fragment } from "react";
import { EyeOff, TriangleAlert } from "lucide-react";
import { StatusLabel } from "../../../components/ui/StatusLabel";
import { cn } from "../../../lib/cn";
import type { OverviewGroup, RoundOverview } from "../../../types";

// ≥ 37.5% ของช่วงสเกล (1.5 คะแนนบน 1–5)
const GAP_RATIO = 0.375;
function isLargeGap(peer: number | null, self: number | null, min: number, max: number) {
  if (peer === null || self === null) return false;
  return Math.abs(self - peer) / (max - min) >= GAP_RATIO;
}

function SubHeads({ first }: { first: boolean }) {
  return (
    <>
      <th scope="col" className={cn("pt-0.5 pr-1.5 pb-2 pl-3 text-right font-semibold text-foreground", first && "border-l border-border")}>
        เพื่อน
      </th>
      <th scope="col" className="pt-0.5 pr-3 pb-2 pl-1.5 text-left font-normal">
        ตัวเอง
      </th>
    </>
  );
}

export default function ScoreTable({
  overview,
  groups,
  canRelease,
  onOpenStudent,
}: {
  overview: RoundOverview;
  // มากกว่าหนึ่งกลุ่มจะมีแถวหัวคั่นชื่อกลุ่ม
  groups: OverviewGroup[];
  // ปิดรับแล้ว — เริ่มบอกได้ว่าใครจะไม่เห็นผลเพราะผู้ประเมินไม่พอ
  canRelease: boolean;
  onOpenStudent: (studentId: string) => void;
}) {
  const scale = overview.round;
  // คู่ตัวเลขของแต่ละข้อชิดกันตรงกลาง: เพื่อนชิดขวา ตัวเองชิดซ้าย
  const peerCell = "py-2.5 pr-1.5 pl-3 text-right";
  const selfCell = "py-2.5 pr-3 pl-1.5 text-left";
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span>
          สเกล {scale.scaleMin}–{scale.scaleMax}
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
        <table className="w-full min-w-[860px] text-left text-sm whitespace-nowrap">
          <thead className="bg-muted text-xs text-muted-foreground">
            <tr>
              <th rowSpan={2} className="border-b border-border px-4 py-3 font-semibold">
                นักศึกษา
              </th>
              <th rowSpan={2} className="border-b border-border px-3 py-3 font-semibold">
                สถานะ
              </th>
              {overview.questions.map((q) => (
                <th key={q.id} colSpan={2} scope="colgroup" className="px-3 pt-3 text-center font-semibold" title={q.prompt}>
                  <span className="block">ข้อ {q.orderNo}</span>
                  <span className="mx-auto block max-w-[9rem] truncate font-normal">{q.prompt}</span>
                </th>
              ))}
              <th colSpan={2} scope="colgroup" className="border-l border-border px-3 pt-3 text-center font-semibold">
                <span className="block">รวม</span>
                <span className="block font-normal">เฉลี่ยทุกด้าน</span>
              </th>
              <th rowSpan={2} className="border-b border-border px-3 py-3 text-center font-semibold">
                ผู้ประเมิน
              </th>
            </tr>
            {/* บอกครั้งเดียวที่หัวตารางว่าตัวเลขไหนของใคร แทนการเขียนกำกับในทุกช่อง */}
            <tr className="border-b border-border text-[11px]">
              {[...overview.questions.map((q) => q.id), "overall"].map((id) => (
                <SubHeads key={id} first={id === "overall"} />
              ))}
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody key={g.id ?? "none"}>
              {groups.length > 1 && (
                <tr className="border-b border-border bg-secondary/60">
                  <th
                    colSpan={overview.questions.length * 2 + 5}
                    scope="colgroup"
                    className="px-4 py-2 text-xs font-semibold text-secondary-foreground"
                  >
                    {g.name}
                    <span className="ml-2 font-normal text-muted-foreground">
                      ส่งแล้ว {g.rows.filter((r) => r.submission?.status === "submitted").length}/{g.rows.length}
                    </span>
                  </th>
                </tr>
              )}
              {g.rows.map((row) => {
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
                      <StatusLabel status={row.submission?.status ?? "not_submitted"} />
                    </td>
                    {row.scores.map((s) => {
                      const gap = isLargeGap(s.peerAverage, s.selfScore, scale.scaleMin, scale.scaleMax);
                      const title = gap ? "ให้คะแนนตัวเองต่างจากที่เพื่อนให้มาก" : undefined;
                      return (
                        <Fragment key={s.questionId}>
                          <td className={cn(peerCell, "font-mono text-base font-bold text-foreground", gap && "bg-amber-50")} title={title}>
                            {s.peerAverage?.toFixed(1) ?? "—"}
                          </td>
                          <td
                            className={cn(selfCell, "font-mono", gap ? "bg-amber-50 font-semibold text-amber-700" : "text-muted-foreground")}
                            title={title}
                          >
                            <span className="inline-flex items-center gap-1">
                              {s.selfScore ?? "—"}
                              {gap && <TriangleAlert size={11} aria-label="ต่างจากเพื่อนมาก" />}
                            </span>
                          </td>
                        </Fragment>
                      );
                    })}
                    <td className={cn(peerCell, "border-l border-border font-mono text-base font-bold text-foreground")}>
                      {row.overall.peerAverage?.toFixed(1) ?? "—"}
                    </td>
                    <td className={cn(selfCell, "font-mono text-muted-foreground")}>{row.overall.selfAverage?.toFixed(1) ?? "—"}</td>
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
          ))}
        </table>
      </div>
    </>
  );
}
