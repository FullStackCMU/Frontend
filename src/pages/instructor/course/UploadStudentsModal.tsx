import { useRef, useState, type DragEvent } from "react";
import { Check, FileSpreadsheet, TriangleAlert, Upload } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { api, getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import { parseStudentCsv, readCsvFile, type StudentCsvRow } from "../../../lib/csv";
import type { ApiResponse, ImportResult } from "../../../types";
import { TEMPLATE_CSV_URL } from "./StudentsTab";

type Stage =
  | { kind: "pick"; error?: string }
  | { kind: "preview"; fileName: string; rows: StudentCsvRow[] }
  | { kind: "done"; result: ImportResult };

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-xl bg-muted px-3 py-3">
      <span className={cn("text-2xl font-bold", tone)}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default function UploadStudentsModal({
  courseId,
  onClose,
  onImported,
}: {
  courseId: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [stage, setStage] = useState<Stage>({ kind: "pick" });
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setStage({ kind: "pick", error: "รองรับเฉพาะไฟล์ .csv" });
      return;
    }
    const parsed = parseStudentCsv(await readCsvFile(file));
    if (parsed.error !== undefined) setStage({ kind: "pick", error: parsed.error });
    else setStage({ kind: "preview", fileName: file.name, rows: parsed.rows });
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function handleImport(rows: StudentCsvRow[]) {
    setSubmitting(true);
    setServerError("");
    try {
      // ส่งทุกแถว (รวมแถวที่หน้าเว็บตรวจว่าผิด) ให้ backend สรุปผลรวมทีเดียว
      const res = await api.post<ApiResponse<ImportResult>>(`/courses/${courseId}/students/import`, {
        rows: rows.map(({ line, studentId, cmuAccount, nameTh }) => ({ line, studentId, cmuAccount, nameTh })),
      });
      setStage({ kind: "done", result: res.data.data });
      onImported();
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const validCount = stage.kind === "preview" ? stage.rows.filter((r) => !r.error).length : 0;

  const footer =
    stage.kind === "done" ? (
      <>
        <span />
        <Button onClick={onClose}>เสร็จสิ้น</Button>
      </>
    ) : stage.kind === "preview" ? (
      <>
        <Button variant="outline" onClick={() => setStage({ kind: "pick" })} disabled={submitting}>
          เลือกไฟล์ใหม่
        </Button>
        <Button onClick={() => handleImport(stage.rows)} disabled={submitting || validCount === 0}>
          {submitting ? "กำลังนำเข้า..." : `นำเข้า ${validCount} รายการ`}
        </Button>
      </>
    ) : (
      <>
        <Button variant="outline" onClick={onClose}>
          ยกเลิก
        </Button>
        <a href={TEMPLATE_CSV_URL} download className="text-sm font-medium text-primary hover:underline">
          ดาวน์โหลดไฟล์ตัวอย่าง
        </a>
      </>
    );

  return (
    <Modal title="อัปโหลดรายชื่อนักศึกษา" size="lg" onClose={onClose} footer={footer}>
      <div className="flex flex-col gap-4 px-6 py-6">
        {stage.kind === "pick" && (
          <>
            {stage.error && <Alert>{stage.error}</Alert>}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-12 transition-colors",
                dragging ? "border-primary bg-indigo-50" : "border-border"
              )}
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
                <Upload size={22} />
              </div>
              <p className="text-sm font-semibold text-foreground">ลากไฟล์ CSV มาวางที่นี่ หรือ</p>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                เลือกไฟล์
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="rounded-xl bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              <p className="mb-1 font-semibold text-foreground">รูปแบบไฟล์</p>
              <p>
                แถวแรกเป็นหัวคอลัมน์ <code className="font-mono text-foreground">student_id, cmu_account, name_th</code>
              </p>
              <p>รหัสนักศึกษา 9 หลัก · CMU account เป็นอีเมล @cmu.ac.th · ชื่อไทย เช่น "สมชาย ใจดี"</p>
              <p>นักศึกษาที่ยังไม่มีบัญชีในระบบจะถูกสร้างให้ และเข้าระบบด้วยบัญชี CMU ได้ทันที</p>
            </div>
          </>
        )}

        {stage.kind === "preview" && (
          <>
            {serverError && <Alert>{serverError}</Alert>}
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted px-4 py-3 text-xs">
              <FileSpreadsheet size={14} className="text-muted-foreground" />
              <span className="font-medium text-foreground">{stage.fileName}</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-semibold text-foreground">พร้อมนำเข้า {validCount} รายการ</span>
              {stage.rows.length > validCount && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-semibold text-amber-600">ข้าม {stage.rows.length - validCount} รายการ</span>
                </>
              )}
            </div>
            <div className="max-h-80 overflow-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-muted">
                  <tr className="border-b border-border font-semibold text-muted-foreground">
                    <th className="w-12 px-3 py-2.5">แถว</th>
                    <th className="w-[100px] px-3 py-2.5">รหัส</th>
                    <th className="px-3 py-2.5">ชื่อ</th>
                    <th className="px-3 py-2.5">CMU account</th>
                    <th className="w-10 px-3 py-2.5 text-center">
                      <span className="sr-only">สถานะ</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stage.rows.map((r) => (
                    <tr key={r.line} className={cn("border-b border-border last:border-b-0", r.error && "bg-amber-50")}>
                      <td className="px-3 py-2 text-muted-foreground">{r.line}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{r.studentId || "—"}</td>
                      <td className="px-3 py-2 text-foreground">{r.nameTh || "—"}</td>
                      <td className="max-w-[180px] px-3 py-2 text-muted-foreground">
                        <span className="block truncate">{r.cmuAccount || "—"}</span>
                        {r.error && <span className="text-amber-700">{r.error}</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {r.error ? (
                          <TriangleAlert size={14} className="mx-auto text-amber-500" aria-label="ข้าม" />
                        ) : (
                          <Check size={14} className="mx-auto text-emerald-600" aria-label="นำเข้าได้" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {stage.kind === "done" && (
          <>
            <div className="flex gap-3">
              <Stat label="เพิ่มเข้าวิชา" value={stage.result.added} tone="text-emerald-600" />
              <Stat label="มีอยู่แล้ว / ซ้ำ" value={stage.result.duplicate} tone="text-foreground" />
              <Stat label="ผิด" value={stage.result.invalid} tone="text-red-600" />
            </div>
            {stage.result.created > 0 && (
              <p className="text-xs text-muted-foreground">
                สร้างบัญชีใหม่ {stage.result.created} คน (ยังไม่เคยเข้าระบบ)
              </p>
            )}
            {stage.result.issues.length > 0 && (
              <div className="max-h-64 overflow-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr className="border-b border-border font-semibold text-muted-foreground">
                      <th className="w-12 px-3 py-2.5">แถว</th>
                      <th className="w-24 px-3 py-2.5">ผล</th>
                      <th className="px-3 py-2.5">เหตุผล</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stage.result.issues.map((issue, i) => (
                      <tr key={i} className="border-b border-border last:border-b-0">
                        <td className="px-3 py-2 text-muted-foreground">{issue.line}</td>
                        <td className={cn("px-3 py-2 font-semibold", issue.kind === "invalid" ? "text-red-600" : "text-muted-foreground")}>
                          {issue.kind === "invalid" ? "ผิด" : "ซ้ำ"}
                        </td>
                        <td className="px-3 py-2 text-foreground">{issue.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
