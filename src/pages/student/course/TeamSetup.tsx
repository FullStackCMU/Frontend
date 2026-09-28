import { useState } from "react";
import { CircleCheck, FileText, LogOut, Users } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { api, getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import type { AvailableGroup, MyGroup } from "../../../types";

/** ยังไม่มีกลุ่ม → เลือกเข้ากลุ่ม (กลุ่มที่เต็มแล้วเข้าไม่ได้) */
export function TeamPicker({
  groups,
  onJoined,
}: {
  groups: AvailableGroup[];
  onJoined: () => void;
}) {
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function join(groupId: string) {
    setJoining(groupId);
    setError("");
    try {
      await api.post(`/groups/${groupId}/join`);
      onJoined();
    } catch (err) {
      setError(getErrorMessage(err));
      setJoining(null);
    }
  }

  return (
    <Card className="flex flex-col gap-4 border-amber-200">
      <div>
        <h2 className="font-bold text-foreground">เลือกกลุ่มของคุณ</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">ต้องมีกลุ่มก่อนจึงเริ่มประเมินเพื่อนร่วมทีมได้</p>
      </div>

      {error && <Alert>{error}</Alert>}

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">อาจารย์ยังไม่ได้สร้างกลุ่มในวิชานี้</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => {
            const full = g.maxMembers !== null && g.members.length >= g.maxMembers;
            return (
              <li key={g.id} className={cn("flex flex-col gap-3 rounded-xl border border-border p-4", full && "bg-muted/60")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{g.name}</p>
                    <p className={cn("text-xs", full ? "font-semibold text-amber-700" : "text-muted-foreground")}>
                      {g.members.length}
                      {g.maxMembers !== null ? ` / ${g.maxMembers}` : ""} คน{full ? " · เต็ม" : ""}
                    </p>
                  </div>
                  {g.contractText && (
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                      <FileText size={12} />
                      มีข้อตกลง
                    </span>
                  )}
                </div>
                {g.members.length > 0 && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {g.members.map((m) => m.name).join(", ")}
                  </p>
                )}
                <Button
                  size="sm"
                  variant={full ? "outline" : "primary"}
                  disabled={full || joining !== null}
                  onClick={() => join(g.id)}
                  className="mt-auto"
                >
                  {full ? "กลุ่มเต็มแล้ว" : joining === g.id ? "กำลังเข้ากลุ่ม..." : "เข้ากลุ่มนี้"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/** มีกลุ่มแล้วแต่ยังไม่ได้ยอมรับข้อตกลงฉบับปัจจุบัน */
export function ContractCard({ group, onAccepted }: { group: MyGroup; onAccepted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    setBusy(true);
    setError("");
    try {
      await api.post(`/groups/${group.id}/accept-contract`);
      onAccepted();
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4 border-amber-200">
      <div>
        <h2 className="font-bold text-foreground">ข้อตกลงของ {group.name}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">อ่านและกดยอมรับก่อนเริ่มประเมิน</p>
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-foreground">
        {group.contractText}
      </div>
      <Button onClick={accept} disabled={busy} className="self-start">
        {busy ? "กำลังบันทึก..." : "ยอมรับข้อตกลง"}
      </Button>
    </Card>
  );
}

/** เพื่อนร่วมกลุ่ม + ออกจากกลุ่ม (ล็อกระหว่างรอบที่เปิดรับถ้าเริ่มทำแบบประเมินแล้ว) */
export function TeammatesCard({
  group,
  meId,
  lockedReason,
  onLeft,
}: {
  group: MyGroup;
  meId: string;
  /** มีค่า = ออกจากกลุ่มไม่ได้ตอนนี้ */
  lockedReason: string | null;
  onLeft: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Users size={14} className="text-muted-foreground" />
          {group.name}
        </p>
        <span className="text-xs text-muted-foreground">
          {group.members.length}
          {group.maxMembers !== null ? ` / ${group.maxMembers}` : ""} คน
        </span>
      </div>
      <ul className="flex flex-col divide-y divide-border px-5 py-3">
        {group.members.map((m) => {
          const isMe = m.id === meId;
          return (
            <li key={m.id} className={cn("flex items-center gap-3 py-2.5 first:pt-0 last:pb-0")}>
              <Avatar name={m.name} />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {m.name}
                {isMe && <span className="ml-1 text-xs text-muted-foreground">(คุณ)</span>}
              </span>
              {group.contractText && m.contractAcceptedAt && (
                <CircleCheck size={14} className="shrink-0 text-emerald-600" aria-label="ยอมรับข้อตกลงแล้ว" />
              )}
            </li>
          );
        })}
      </ul>
      <div className="border-t border-border px-5 py-3">
        {lockedReason ? (
          <p className="text-xs text-muted-foreground">{lockedReason}</p>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} className="-ml-3">
            <LogOut size={13} />
            ออกจากกลุ่ม
          </Button>
        )}
      </div>

      {confirming && (
        <ConfirmModal
          title={`ออกจาก ${group.name}?`}
          confirmLabel="ออกจากกลุ่ม"
          danger
          onConfirm={async () => {
            await api.post("/groups/leave", { courseId: group.courseId });
            setConfirming(false);
            onLeft();
          }}
          onClose={() => setConfirming(false)}
        >
          <p>คุณจะต้องเลือกกลุ่มใหม่ก่อนประเมินรอบถัดไป ถ้ากลับเข้ากลุ่มนี้ต้องยอมรับข้อตกลงอีกครั้ง</p>
        </ConfirmModal>
      )}
    </Card>
  );
}
