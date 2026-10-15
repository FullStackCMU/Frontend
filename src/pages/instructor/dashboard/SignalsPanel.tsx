import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { ToneLabel } from "../../../components/ui/StatusLabel";
import { groupSignals, isWarning, warningCount, type NamedGroup } from "../../../lib/signals";
import type { RoundOverview, Signal } from "../../../types";
import SignalList from "./SignalList";

function Panel({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
      {children}
    </Card>
  );
}

const warningsFirst = (signals: Signal[]) => [...signals.filter(isWarning), ...signals.filter((s) => !isWarning(s))];

// ทั้งวิชา = สัญญาณแยกตามกลุ่ม (ย่อ), เลือกกลุ่มแล้ว = สัญญาณครบสองด้านของกลุ่มนั้น
export default function SignalsPanel({
  overview,
  groups,
  group,
  linkTo,
}: {
  overview: RoundOverview;
  groups: NamedGroup[];
  group: NamedGroup | null;
  linkTo: (groupId: string) => string;
}) {
  const submitted = (g: NamedGroup) => g.rows.some((r) => r.submission?.status === "submitted");

  if (group) {
    const empty = (text: string) => (
      <p className="text-xs text-muted-foreground">{submitted(group) ? text : "ยังไม่มีใครส่งในรอบนี้"}</p>
    );
    return (
      <div className="flex flex-col gap-4">
        <Panel title="สัญญาณจากผลที่ได้รับ" hint="คะแนนที่เพื่อนให้">
          {group.signals.received.length > 0 ? (
            <SignalList signals={warningsFirst(group.signals.received)} rows={group.rows} questions={overview.questions} />
          ) : (
            empty("ไม่พบสิ่งที่ควรดูเพิ่มจากคะแนนที่ได้รับ")
          )}
        </Panel>
        <Panel title="สัญญาณการเป็นผู้ให้ฟีดแบ็ก" hint="คะแนนจากใครเชื่อถือได้แค่ไหน">
          {group.signals.givers.length > 0 ? (
            <SignalList signals={warningsFirst(group.signals.givers)} rows={group.rows} questions={overview.questions} />
          ) : (
            empty("ไม่พบสิ่งผิดปกติในการให้คะแนนและข้อความถึงเพื่อน")
          )}
        </Panel>
      </div>
    );
  }

  const flagged = groups.filter((g) => groupSignals(g).length > 0);
  return (
    <Panel title="สัญญาณที่ควรดู" hint="แยกตามกลุ่ม · กดชื่อกลุ่มเพื่อดูเฉพาะกลุ่มนั้น">
      {flagged.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {groups.some(submitted) ? "ไม่พบสิ่งที่ควรดูเพิ่มในรอบนี้" : "ยังไม่มีใครส่งในรอบนี้"}
        </p>
      ) : (
        flagged.map((g) => (
          <div key={g.id} className="flex flex-col gap-2 border-t border-border pt-3">
            <Link
              to={linkTo(g.id)}
              replace
              className="flex items-center justify-between gap-2 text-xs font-bold text-foreground hover:text-primary"
            >
              {g.name}
              {warningCount(g) > 0 && (
                <ToneLabel tone="warning" icon={TriangleAlert}>
                  {warningCount(g)} สัญญาณ
                </ToneLabel>
              )}
            </Link>
            <SignalList signals={groupSignals(g)} rows={g.rows} questions={overview.questions} limit={3} />
          </div>
        ))
      )}
    </Panel>
  );
}
