import { Link, Navigate, NavLink, Route, Routes, useLocation, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { COURSE_SECTIONS } from "../../../components/layout/nav";
import { useCourse } from "../../../hooks/useCourses";
import { getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/cn";
import { formatCourseCode, formatTerm } from "../../../lib/course";
import CourseOverview from "../dashboard/CourseOverview";
import FeedbackTab from "./FeedbackTab";
import MembersTab from "./MembersTab";
import RoundsTab from "./RoundsTab";

export default function CourseDetail() {
  const { courseId = "" } = useParams();
  const { data: course, error } = useCourse(courseId);
  const { pathname } = useLocation();

  const base = `/courses/${courseId}`;
  const current = COURSE_SECTIONS.find((s) => s.path && pathname.endsWith(`/${s.path}`)) ?? COURSE_SECTIONS[0];

  return (
    <div className="max-w-6xl px-4 py-6 min-[900px]:px-10 min-[900px]:py-8">
      <Link
        to="/courses"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft size={15} />
        คอร์สของฉัน
      </Link>

      {error && <Alert>{getErrorMessage(error)}</Alert>}

      {!course && !error && (
        <div className="mb-6 flex flex-col gap-2" aria-busy="true" aria-label="กำลังโหลด">
          <div className="h-3 w-40 animate-pulse rounded bg-muted" />
          <div className="h-7 w-72 animate-pulse rounded bg-muted" />
        </div>
      )}

      {course && (
        <>
          <div className="mb-6">
            <p className="mb-1 text-xs font-semibold tracking-widest text-primary uppercase">
              {formatCourseCode(course.courseCode, course.section)} · {formatTerm(course.semester, course.academicYear)}
            </p>
            <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
          </div>

          {/* จอกว้างเลือกหัวข้อจากเมนูซ้าย — แท็บนี้มีเฉพาะจอแคบที่เมนูซ้ายถูกซ่อน */}
          <nav aria-label="หัวข้อของวิชา" className="mb-8 flex gap-1 border-b border-border min-[900px]:hidden">
            {COURSE_SECTIONS.map((s) => (
              <NavLink
                key={s.path}
                to={s.path ? `${base}/${s.path}` : base}
                end={!s.path}
                className={({ isActive }) =>
                  cn(
                    "-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {s.label}
              </NavLink>
            ))}
          </nav>
          <h2 className="mb-4 hidden text-lg font-bold text-foreground min-[900px]:block">{current.label}</h2>

          <Routes>
            <Route index element={<CourseOverview course={course} />} />
            <Route path="members" element={<MembersTab courseId={courseId} />} />
            <Route path="rounds" element={<RoundsTab courseId={courseId} />} />
            <Route path="feedback" element={<FeedbackTab course={course} />} />
            <Route path="*" element={<Navigate to={base} replace />} />
          </Routes>
        </>
      )}
    </div>
  );
}
