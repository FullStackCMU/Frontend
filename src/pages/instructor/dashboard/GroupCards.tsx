import { Link } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { groupSignals, groupsByAttention, warningCount } from "../../../lib/signals";
import type { RoundOverview } from "../../../types";
import SignalList from "./SignalList";

const submittedCount = (rows: RoundOverview["groups"][number]["rows"]) =>
  rows.filter((r) => r.submission?.status === "submitted").length;

export default function GroupCards({
  overview,
  courseId,
  linkTo,
}: {
  overview: RoundOverview;
  courseId: string;
  linkTo: (groupId: string) => string;
}) {
  const groups = groupsByAttention(overview);
  const ungrouped = overview.groups.find((g) => g.id === null);
  const flagged = groups.filter((g) => warningCount(g) > 0).length;

  return (
    <section aria-label="กลุ่มในรอบนี้">
      <p className="mb-3 text-sm text-muted-foreground">
        {groups.length} กลุ่ม
        {flagged > 0 && (
          <>
            {" · "}
            <span className="font-semibold text-amber-700">{flagged} กลุ่มมีสัญญาณที่ควรดู</span> (เรียงขึ้นก่อน)
          </>
        )}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => {
          const signals = groupSignals(g);
          const warnings = warningCount(g);
          const submitted = submittedCount(g.rows);
          return (
            <Link
              key={g.id}
              to={linkTo(g.id)}
              className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Card padding="none" interactive className="flex h-full flex-col gap-3 px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-bold text-foreground transition-colors group-hover:text-primary">{g.name}</h2>
                  {warnings > 0 && (
                    <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                      {warnings} สัญญาณ
                    </span>
                  )}
                </div>

                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">
                    {g.rows.length} คน · ส่งแล้ว {submitted}/{g.rows.length}
                  </p>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(submitted / g.rows.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  {signals.length > 0 ? (
                    <SignalList signals={signals} rows={g.rows} questions={overview.questions} limit={3} />
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {submitted > 0 && <CircleCheck size={13} className="shrink-0 text-emerald-500" />}
                      {submitted > 0 ? "ไม่พบสิ่งที่ควรดูเพิ่ม" : "ยังไม่มีใครส่งในรอบนี้"}
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {ungrouped && (
        <p className="mt-4 text-xs text-muted-foreground">
          ยังไม่มีกลุ่ม {ungrouped.rows.length} คน: {ungrouped.rows.map((r) => r.student.name).join(", ")} ·{" "}
          <Link to={`/courses/${courseId}/groups`} className="font-medium text-primary hover:underline">
            จัดกลุ่ม
          </Link>
        </p>
      )}
    </section>
  );
}
