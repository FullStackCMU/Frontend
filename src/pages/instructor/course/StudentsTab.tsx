import { useEffect, useState } from "react";
import { Search, Upload } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { inputClass } from "../../../components/ui/field-styles";
import { api, getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import type { ApiResponse, CourseStudent } from "../../../types";

export const TEMPLATE_CSV_URL = "/students-template.csv";

const PAGE_SIZE = 25;

type Filter = "all" | "unassigned" | "neverLoggedIn";

const FILTERS: { key: Filter; label: string; match: (s: CourseStudent) => boolean }[] = [
  { key: "all", label: "ทั้งหมด", match: () => true },
  { key: "unassigned", label: "ยังไม่มีกลุ่ม", match: (s) => !s.group },
  { key: "neverLoggedIn", label: "ยังไม่เคยเข้าระบบ", match: (s) => !s.firstLoginAt },
];

export default function StudentsTab({
  courseId,
  onUpload,
}: {
  courseId: string;
  onUpload: () => void;
}) {
  const [students, setStudents] = useState<CourseStudent[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .get<ApiResponse<CourseStudent[]>>(`/courses/${courseId}/students`)
      .then((res) => setStudents(res.data.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [courseId]);

  if (error) return <Alert>{error}</Alert>;

  if (!students)
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="กำลังโหลด">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );

  if (students.length === 0)
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-28 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
          <Upload size={24} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">ยังไม่มีรายชื่อนักศึกษา</p>
          <p className="mt-1 text-sm text-muted-foreground">อัปโหลดไฟล์ CSV เพื่อเพิ่มนักศึกษาเข้าคอร์ส</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Button onClick={onUpload}>
            <Upload size={15} />
            อัปโหลดรายชื่อ (CSV)
          </Button>
          <a href={TEMPLATE_CSV_URL} download className="text-sm font-medium text-primary hover:underline">
            ดาวน์โหลดไฟล์ตัวอย่าง
          </a>
        </div>
      </div>
    );

  const q = search.trim().toLowerCase();
  const activeFilter = FILTERS.find((f) => f.key === filter)!;
  const filtered = students.filter(
    (s) =>
      activeFilter.match(s) &&
      (!q ||
        s.name.toLowerCase().includes(q) ||
        (s.studentId ?? "").includes(q) ||
        s.cmuAccount.includes(q))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
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
              onClick={() => {
                setFilter(f.key);
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label} {students.filter(f.match).length}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-border bg-muted text-xs font-semibold text-muted-foreground">
              <th className="w-[120px] px-4 py-3">รหัสนักศึกษา</th>
              <th className="px-4 py-3">ชื่อ-นามสกุล</th>
              <th className="px-4 py-3">CMU account</th>
              <th className="w-[150px] px-4 py-3">กลุ่ม</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((s) => (
              <tr key={s.id} className="h-14 border-b border-border transition-colors last:border-b-0 hover:bg-muted">
                <td className="px-4 font-mono text-xs text-muted-foreground">{s.studentId ?? "—"}</td>
                <td className="px-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={s.name} />
                    <div className="min-w-0">
                      <p className="text-sm whitespace-nowrap text-foreground">{s.name}</p>
                      {!s.firstLoginAt && (
                        <p className="text-[11px] text-muted-foreground">ยังไม่เคยเข้าระบบ</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 text-xs text-muted-foreground">{s.cmuAccount}</td>
                <td className="px-4">
                  {s.group ? (
                    <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                      {s.group.name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">ยังไม่มีกลุ่ม</span>
                  )}
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  ไม่พบนักศึกษาที่ตรงกับเงื่อนไข
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          แสดง {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
          {Math.min(currentPage * PAGE_SIZE, filtered.length)} จาก {filtered.length}
        </span>
        {totalPages > 1 && (
          <nav aria-label="หน้า" className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                aria-current={p === currentPage ? "page" : undefined}
                onClick={() => setPage(p)}
                className={cn(
                  "size-7 rounded-lg text-xs font-medium transition-colors",
                  p === currentPage ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {p}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
