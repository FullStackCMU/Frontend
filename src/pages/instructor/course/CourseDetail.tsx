import { useEffect, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes, useParams } from "react-router-dom";
import { ChevronLeft, Upload } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { api, getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import { formatCourseCode, formatTerm } from "../../../lib/course";
import type { ApiResponse, Course } from "../../../types";
import StudentsTab from "./StudentsTab";
import GroupsTab from "./GroupsTab";
import RoundsTab from "./RoundsTab";
import UploadStudentsModal from "./UploadStudentsModal";

/**
 * หน้ารายละเอียดวิชาของอาจารย์ (CourseDetail ใน design-ref)
 * /courses/:courseId → นักศึกษา, /groups → กลุ่ม, /rounds → รอบประเมิน
 */
export default function CourseDetail() {
  const { courseId = "" } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  // เพิ่มเมื่อ import สำเร็จ → แท็บโหลดข้อมูลใหม่ (ใช้เป็น key)
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api
      .get<ApiResponse<Course>>(`/courses/${courseId}`)
      .then((res) => setCourse(res.data.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [courseId]);

  const base = `/courses/${courseId}`;
  const tabs = [
    { to: base, label: "นักศึกษา", end: true },
    { to: `${base}/groups`, label: "กลุ่ม", end: false },
    { to: `${base}/rounds`, label: "รอบประเมิน", end: false },
  ];

  return (
    <div className="max-w-6xl px-4 py-6 min-[900px]:px-10 min-[900px]:py-8">
      <Link
        to="/courses"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft size={15} />
        คอร์สของฉัน
      </Link>

      {error && <Alert>{error}</Alert>}

      {!course && !error && (
        <div className="mb-6 flex flex-col gap-2" aria-busy="true" aria-label="กำลังโหลด">
          <div className="h-3 w-40 animate-pulse rounded bg-muted" />
          <div className="h-7 w-72 animate-pulse rounded bg-muted" />
        </div>
      )}

      {course && (
        <>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold tracking-widest text-primary uppercase">
                {formatCourseCode(course.courseCode, course.section)} ·{" "}
                {formatTerm(course.semester, course.academicYear)}
              </p>
              <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
            </div>
            <Button variant="secondary" onClick={() => setUploading(true)}>
              <Upload size={14} />
              อัปโหลดรายชื่อ (CSV)
            </Button>
          </div>

          <nav aria-label="แท็บรายวิชา" className="mb-8 flex gap-1 border-b border-border">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <Routes>
            <Route
              index
              element={
                <StudentsTab key={reloadKey} courseId={courseId} onUpload={() => setUploading(true)} />
              }
            />
            <Route path="groups" element={<GroupsTab key={reloadKey} courseId={courseId} />} />
            <Route path="rounds" element={<RoundsTab courseId={courseId} />} />
            <Route path="*" element={<Navigate to={base} replace />} />
          </Routes>

          {uploading && (
            <UploadStudentsModal
              courseId={courseId}
              onClose={() => setUploading(false)}
              onImported={() => setReloadKey((k) => k + 1)}
            />
          )}
        </>
      )}
    </div>
  );
}
