import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, MessageSquare } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { buttonClass } from "../../../components/ui/button-variants";
import { Card } from "../../../components/ui/Card";
import { api, getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import { formatCourseCode } from "../../../lib/course";
import { formatDateTime } from "../../../lib/date";
import type { ApiResponse, FeedbackListItem } from "../../../types";

function ReleasedChip({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        on ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border bg-muted text-muted-foreground"
      )}
    >
      {on && <Check size={11} />}
      {label}
      {!on && " (ยังไม่เผยแพร่)"}
    </span>
  );
}

export default function FeedbackListPage() {
  const [items, setItems] = useState<FeedbackListItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<ApiResponse<FeedbackListItem[]>>("/feedback")
      .then((res) => setItems(res.data.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  return (
    <div className="px-4 py-6 min-[900px]:px-10 min-[900px]:py-8">
      <h1 className="mb-8 text-2xl font-bold text-foreground">ฟีดแบ็ก</h1>

      {error && <Alert>{error}</Alert>}

      {!items && !error && (
        <div className="grid grid-cols-1 gap-5 min-[900px]:grid-cols-2" aria-busy="true" aria-label="กำลังโหลด">
          {[0, 1].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      )}

      {items?.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-5 py-32 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
            <MessageSquare size={28} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">ยังไม่มีผลประเมิน</p>
            <p className="mt-1 text-sm text-muted-foreground">อาจารย์จะเผยแพร่ผลหลังปิดรอบประเมิน</p>
          </div>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="grid grid-cols-1 items-stretch gap-5 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3">
          {items.map((item) => (
            <Card key={item.roundId} padding="none" className="flex h-full flex-col gap-3 px-5 py-5 shadow-sm">
              <div className="min-w-0">
                <p className="mb-1 text-base leading-snug font-bold text-foreground">รอบที่ {item.sequenceNo}</p>
                <p className="truncate text-xs font-semibold text-indigo-600">
                  {formatCourseCode(item.courseCode, item.section)} ·{" "}
                  <span className="font-normal text-muted-foreground">{item.courseTitle}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">เผยแพร่ {formatDateTime(item.releasedAt)}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <ReleasedChip label="คะแนน" on={!!item.scoresReleasedAt} />
                <ReleasedChip label="ความเห็นจากเพื่อน" on={!!item.feedbackReleasedAt} />
              </div>
              <div className="flex-1" />
              <Link to={`/feedback/${item.roundId}`} className={buttonClass({ variant: "outline", fullWidth: true })}>
                ดูผลประเมิน
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
