import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClass } from "../../../components/ui/button-variants";
import { Card } from "../../../components/ui/Card";
import { isWarning, type NamedGroup } from "../../../lib/signals";
import type { CourseRound, RoundOverview, Signal } from "../../../types";
import ScoreTable from "./ScoreTable";
import SignalList from "./SignalList";
import TeamMap, { type MapMode } from "./TeamMap";

function SignalPanel({
  title,
  hint,
  empty,
  signals,
  group,
  overview,
}: {
  title: string;
  hint: string;
  empty: string;
  signals: Signal[];
  group: NamedGroup;
  overview: RoundOverview;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
      {signals.length > 0 ? (
        <SignalList
          signals={[...signals.filter(isWarning), ...signals.filter((s) => !isWarning(s))]}
          rows={group.rows}
          questions={overview.questions}
        />
      ) : (
        <p className="text-xs text-muted-foreground">{empty}</p>
      )}
    </Card>
  );
}

function NavButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={buttonClass({ variant: "outline", size: "sm" })}>
      {children}
    </Link>
  );
}

export default function GroupView({
  overview,
  groups,
  group,
  canRelease,
  linkTo,
  mapMode,
  onMapModeChange,
  earlierRounds,
  compareRound,
  compare,
  onCompareChange,
  onOpenStudent,
}: {
  overview: RoundOverview;
  groups: NamedGroup[];
  group: NamedGroup;
  canRelease: boolean;
  linkTo: (groupId?: string) => string;
  mapMode: MapMode;
  onMapModeChange: (mode: MapMode) => void;
  earlierRounds: CourseRound[];
  compareRound: CourseRound | undefined;
  compare: RoundOverview | undefined;
  onCompareChange: (roundId: string | null) => void;
  onOpenStudent: (studentId: string) => void;
}) {
  const index = groups.indexOf(group);
  const prev = groups[index - 1];
  const next = groups[index + 1];
  const submitted = group.rows.filter((r) => r.submission?.status === "submitted").length;

  return (
    <section aria-label={group.name} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            to={linkTo()}
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft size={15} />
            ทุกกลุ่ม
          </Link>
          <h2 className="text-xl font-bold text-foreground">{group.name}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {group.rows.length} คน · ส่งแล้ว {submitted}/{group.rows.length}
          </p>
        </div>
        <nav aria-label="สลับกลุ่ม" className="flex items-center gap-2">
          {prev && (
            <NavButton to={linkTo(prev.id)}>
              <ChevronLeft size={14} />
              {prev.name}
            </NavButton>
          )}
          {next && (
            <NavButton to={linkTo(next.id)}>
              {next.name}
              <ChevronRight size={14} />
            </NavButton>
          )}
        </nav>
      </div>

      <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <TeamMap
          overview={overview}
          group={group}
          mode={mapMode}
          onModeChange={onMapModeChange}
          earlierRounds={earlierRounds}
          compareRound={compareRound}
          compare={compare}
          onCompareChange={onCompareChange}
          onOpenStudent={onOpenStudent}
        />
        <div className="flex flex-col gap-4">
        <SignalPanel
          title="สัญญาณจากผลที่ได้รับ"
          hint="คะแนนที่เพื่อนให้"
          empty={submitted > 0 ? "ไม่พบสิ่งที่ควรดูเพิ่มจากคะแนนที่ได้รับ" : "ยังไม่มีใครส่งในรอบนี้"}
          signals={group.signals.received}
          group={group}
          overview={overview}
        />
        <SignalPanel
          title="สัญญาณการเป็นผู้ให้ฟีดแบ็ก"
          hint="คะแนนจากใครเชื่อถือได้แค่ไหน"
          empty={submitted > 0 ? "ไม่พบสิ่งผิดปกติในการให้คะแนนและข้อความถึงเพื่อน" : "ยังไม่มีใครส่งในรอบนี้"}
          signals={group.signals.givers}
          group={group}
          overview={overview}
        />
        </div>
      </div>

      <details>
        <summary className="mb-3 cursor-pointer text-sm font-semibold text-foreground">ตารางคะแนนรายด้าน</summary>
        <ScoreTable overview={overview} rows={group.rows} canRelease={canRelease} onOpenStudent={onOpenStudent} />
      </details>
    </section>
  );
}
