import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CircleCheck, FileText, Pencil, Plus, Search, Upload } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { inputClass } from "../../../components/ui/field-styles";
import { useCourseGroups } from "../../../hooks/useCourseMembers";
import { useCourseChanged } from "../../../hooks/useCourses";
import { getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import { keys } from "../../../lib/query-keys";
import type { Group, GroupsOverview, Person } from "../../../types";
import GroupFormModal from "./GroupFormModal";
import UploadStudentsModal, { TEMPLATE_CSV_URL } from "./UploadStudentsModal";

type Filter = "all" | "unassigned" | "neverLoggedIn";

const FILTERS: { key: Filter; label: string; match: (person: Person, grouped: boolean) => boolean }[] = [
  { key: "all", label: "ทั้งหมด", match: () => true },
  { key: "unassigned", label: "ยังไม่มีกลุ่ม", match: (_, grouped) => !grouped },
  { key: "neverLoggedIn", label: "ยังไม่เคยเข้าระบบ", match: (p) => !p.firstLoginAt },
];

const COLUMNS = 4;

function MemberRow({ person, contract }: { person: Person; contract: "accepted" | "pending" | null }) {
  return (
    <tr className="h-14 border-b border-border transition-colors last:border-b-0 hover:bg-muted">
      <td className="px-4 font-mono text-xs text-muted-foreground">{person.studentId ?? "—"}</td>
      <td className="px-4">
        <div className="flex items-center gap-2.5">
          <Avatar name={person.name} />
          <div className="min-w-0">
            <p className="text-sm whitespace-nowrap text-foreground">{person.name}</p>
            {!person.firstLoginAt && <p className="text-[11px] text-muted-foreground">ยังไม่เคยเข้าระบบ</p>}
          </div>
        </div>
      </td>
      <td className="px-4 text-xs text-muted-foreground">{person.cmuAccount}</td>
      <td className="px-4 text-xs whitespace-nowrap">
        {contract === "accepted" ? (
          <span className="inline-flex items-center gap-1 text-foreground">
            <CircleCheck size={13} className="text-emerald-600" />
            ยอมรับแล้ว
          </span>
        ) : contract === "pending" ? (
          <span className="text-amber-700">ยังไม่ยอมรับ</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}

// รายชื่อนักศึกษาจัดตามกลุ่ม — จัดการรายชื่อและกลุ่มในหน้าเดียว
export default function MembersTab({ courseId }: { courseId: string }) {
  const queryClient = useQueryClient();
  const { data, error } = useCourseGroups(courseId);
  const courseChanged = useCourseChanged(courseId);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  // null = ปิด, "new" = สร้างใหม่, Group = แก้กลุ่มนั้น
  const [editing, setEditing] = useState<Group | "new" | null>(null);
  const [uploading, setUploading] = useState(false);

  // แสดงกลุ่มที่บันทึกทันที แล้วให้ข้อมูลอื่นของวิชาโหลดตาม
  function handleSaved(saved: Group) {
    setEditing(null);
    queryClient.setQueryData<GroupsOverview>(keys.groups(courseId), (prev) => {
      if (!prev) return prev;
      const exists = prev.groups.some((g) => g.id === saved.id);
      return {
        ...prev,
        groups: exists ? prev.groups.map((g) => (g.id === saved.id ? saved : g)) : [...prev.groups, saved],
      };
    });
    courseChanged();
  }

  if (error) return <Alert>{getErrorMessage(error)}</Alert>;
  if (!data)
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="กำลังโหลด">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );

  const { groups, unassigned } = data;
  const everyone = [
    ...unassigned.map((person) => ({ person, grouped: false })),
    ...groups.flatMap((g) => g.members.map((person) => ({ person, grouped: true }))),
  ];
  const q = search.trim().toLowerCase();
  const activeFilter = FILTERS.find((f) => f.key === filter)!;
  const shown = (person: Person, grouped: boolean) =>
    activeFilter.match(person, grouped) &&
    (!q || person.name.toLowerCase().includes(q) || (person.studentId ?? "").includes(q) || person.cmuAccount.includes(q));
  // ไม่ได้กรองอะไร กลุ่มที่ยังว่างก็ต้องเห็น (จะได้แก้หรือรู้ว่ามีที่ว่าง)
  const unfiltered = filter === "all" && !q;

  const unassignedRows = unassigned.filter((p) => shown(p, false));
  const groupSections = groups
    .map((group) => ({ group, rows: group.members.filter((m) => shown(m, true)) }))
    .filter((s) => unfiltered || s.rows.length > 0);
  const nothing = unassignedRows.length === 0 && groupSections.length === 0;

  const modals = (
    <>
      {editing && (
        <GroupFormModal
          courseId={courseId}
          group={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
      {uploading && (
        <UploadStudentsModal courseId={courseId} onClose={() => setUploading(false)} onImported={courseChanged} />
      )}
    </>
  );

  if (everyone.length === 0 && groups.length === 0)
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
          <Upload size={24} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">ยังไม่มีรายชื่อนักศึกษา</p>
          <p className="mt-1 text-sm text-muted-foreground">
            อัปโหลดไฟล์ CSV เพื่อเพิ่มนักศึกษา แล้วสร้างกลุ่มให้นักศึกษาเลือกเข้า
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => setUploading(true)}>
              <Upload size={15} />
              อัปโหลดรายชื่อ (CSV)
            </Button>
            <Button variant="secondary" onClick={() => setEditing("new")}>
              <Plus size={15} />
              สร้างกลุ่ม
            </Button>
          </div>
          <a href={TEMPLATE_CSV_URL} download className="text-sm font-medium text-primary hover:underline">
            ดาวน์โหลดไฟล์ตัวอย่าง
          </a>
        </div>
        {modals}
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64 max-w-full">
            <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ รหัส หรืออีเมล"
              aria-label="ค้นหานักศึกษา"
              className={cn(inputClass, "py-2 pl-9")}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="กรองรายชื่อ">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label} {everyone.filter((x) => f.match(x.person, x.grouped)).length}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setUploading(true)}>
            <Upload size={14} />
            อัปโหลดรายชื่อ (CSV)
          </Button>
          <Button onClick={() => setEditing("new")}>
            <Plus size={15} />
            สร้างกลุ่ม
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className="border-b border-border bg-muted text-xs font-semibold text-muted-foreground">
              <th className="w-[130px] px-4 py-3">รหัสนักศึกษา</th>
              <th className="px-4 py-3">ชื่อ-นามสกุล</th>
              <th className="px-4 py-3">CMU account</th>
              <th className="w-[140px] px-4 py-3">ข้อตกลงกลุ่ม</th>
            </tr>
          </thead>

          {unassignedRows.length > 0 && (
            <tbody>
              <tr className="border-b border-border bg-amber-50">
                <th colSpan={COLUMNS} scope="colgroup" className="px-4 py-2.5 text-left text-xs font-semibold text-amber-800">
                  ยังไม่มีกลุ่ม
                  <span className="ml-2 font-normal">{unassignedRows.length} คน · นักศึกษาเลือกเข้ากลุ่มเอง</span>
                </th>
              </tr>
              {unassignedRows.map((p) => (
                <MemberRow key={p.id} person={p} contract={null} />
              ))}
            </tbody>
          )}

          {groupSections.map(({ group, rows }) => {
            const full = group.maxMembers !== null && group.members.length >= group.maxMembers;
            return (
              <tbody key={group.id}>
                <tr className="border-b border-border bg-secondary/60">
                  <th colSpan={COLUMNS} scope="colgroup" className="px-4 py-2 text-left">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                        <span className="text-sm font-bold text-foreground">{group.name}</span>
                        <span className={full ? "font-semibold text-amber-700" : "font-normal text-muted-foreground"}>
                          {group.members.length}
                          {group.maxMembers !== null ? ` / ${group.maxMembers}` : ""} คน{full ? " · เต็ม" : ""}
                        </span>
                        <span className="flex items-center gap-1 font-normal text-muted-foreground">
                          <FileText size={12} className="shrink-0" />
                          {group.contractText ? "มีข้อตกลงกลุ่ม" : "ยังไม่มีข้อตกลงกลุ่ม"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditing(group)}
                        aria-label={`แก้ไข ${group.name}`}
                        title="แก้ไขกลุ่ม"
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </th>
                </tr>
                {rows.map((m) => (
                  <MemberRow
                    key={m.id}
                    person={m}
                    contract={group.contractText ? (m.contractAcceptedAt ? "accepted" : "pending") : null}
                  />
                ))}
                {group.members.length === 0 && (
                  <tr className="border-b border-border last:border-b-0">
                    <td colSpan={COLUMNS} className="px-4 py-3 text-xs text-muted-foreground">
                      ยังไม่มีสมาชิก
                    </td>
                  </tr>
                )}
              </tbody>
            );
          })}

          {nothing && (
            <tbody>
              <tr>
                <td colSpan={COLUMNS} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  ไม่พบนักศึกษาที่ตรงกับเงื่อนไข
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      {modals}
    </div>
  );
}
