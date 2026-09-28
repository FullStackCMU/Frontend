import { useEffect, useState } from "react";
import { CircleCheck, FileText, Pencil, Plus, Users } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { api, getErrorMessage } from "../../../lib/api";
import type { ApiResponse, Group, GroupsOverview } from "../../../types";
import GroupFormModal from "./GroupFormModal";

const UNASSIGNED_PREVIEW = 12;

function GroupCard({ group, onEdit }: { group: Group; onEdit: () => void }) {
  const full = group.maxMembers !== null && group.members.length >= group.maxMembers;
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-foreground">{group.name}</h3>
          <p className={full ? "text-xs font-semibold text-amber-700" : "text-xs text-muted-foreground"}>
            {group.members.length}
            {group.maxMembers !== null ? ` / ${group.maxMembers}` : ""} คน{full ? " · เต็ม" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`แก้ไข ${group.name}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Pencil size={14} />
        </button>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileText size={13} className="shrink-0" />
        {group.contractText ? "มีข้อตกลงกลุ่มแล้ว" : "ยังไม่มีข้อตกลงกลุ่ม"}
      </p>

      {group.members.length === 0 ? (
        <p className="text-sm text-muted-foreground">ยังไม่มีสมาชิก</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {group.members.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5">
              <Avatar name={m.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{m.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{m.studentId}</p>
              </div>
              {group.contractText && m.contractAcceptedAt && (
                <CircleCheck size={14} className="shrink-0 text-emerald-600" aria-label="ยอมรับข้อตกลงแล้ว" />
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function GroupsTab({ courseId }: { courseId: string }) {
  const [data, setData] = useState<GroupsOverview | null>(null);
  const [error, setError] = useState("");
  // null = ปิด, "new" = สร้างใหม่, Group = แก้กลุ่มนั้น
  const [editing, setEditing] = useState<Group | "new" | null>(null);
  const [showAllUnassigned, setShowAllUnassigned] = useState(false);

  useEffect(() => {
    api
      .get<ApiResponse<GroupsOverview>>(`/groups?courseId=${courseId}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [courseId]);

  function handleSaved(saved: Group) {
    setEditing(null);
    setData((prev) => {
      if (!prev) return prev;
      const exists = prev.groups.some((g) => g.id === saved.id);
      return {
        ...prev,
        groups: exists ? prev.groups.map((g) => (g.id === saved.id ? saved : g)) : [...prev.groups, saved],
      };
    });
  }

  if (error) return <Alert>{error}</Alert>;
  if (!data)
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="กำลังโหลด">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    );

  const { groups, unassigned } = data;
  const shownUnassigned = showAllUnassigned ? unassigned : unassigned.slice(0, UNASSIGNED_PREVIEW);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">นักศึกษาเลือกเข้ากลุ่มเอง อาจารย์สร้างกลุ่มและกำหนดข้อตกลงกลุ่ม</p>
        <Button onClick={() => setEditing("new")}>
          <Plus size={16} />
          สร้างกลุ่ม
        </Button>
      </div>

      {unassigned.length > 0 && (
        <Alert tone="warning">
          <p className="font-semibold">ยังไม่มีกลุ่ม — {unassigned.length} คน</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {shownUnassigned.map((s) => (
              <li key={s.id} className="rounded-full border border-amber-200 bg-white px-2.5 py-0.5 text-xs text-amber-900">
                {s.name}
                {s.studentId && <span className="ml-1 font-mono text-[10px] text-amber-700">{s.studentId}</span>}
              </li>
            ))}
          </ul>
          {unassigned.length > UNASSIGNED_PREVIEW && (
            <button
              type="button"
              onClick={() => setShowAllUnassigned((v) => !v)}
              className="mt-2 text-xs font-semibold text-amber-800 hover:underline"
            >
              {showAllUnassigned ? "ย่อรายชื่อ" : `ดูทั้งหมด (อีก ${unassigned.length - UNASSIGNED_PREVIEW} คน)`}
            </button>
          )}
        </Alert>
      )}

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <Users size={24} className="text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">ยังไม่มีกลุ่ม</p>
          <p className="text-sm text-muted-foreground">สร้างกลุ่มไว้ให้นักศึกษาเลือกเข้า</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} onEdit={() => setEditing(g)} />
          ))}
        </div>
      )}

      {editing && (
        <GroupFormModal
          courseId={courseId}
          group={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
