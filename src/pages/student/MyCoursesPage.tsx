import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, Users } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { buttonClass } from "../../components/ui/button-variants";
import { Card } from "../../components/ui/Card";
import { api, getErrorMessage } from "../../lib/api";
import { cn } from "../../lib/cn";
import { formatCourseCode, formatTerm } from "../../lib/course";
import { TONE_CLASS } from "../../lib/status";
import type { ApiResponse, Course } from "../../types";

function CourseCard({ course }: { course: Course }) {
  return (
    <Card padding="none" className="flex h-full flex-col gap-3 px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-0.5 text-xs font-semibold text-indigo-600">
            {formatCourseCode(course.courseCode, course.section)} · {formatTerm(course.semester, course.academicYear)}
          </p>
          <p className="line-clamp-2 text-sm leading-snug font-bold text-foreground">{course.title}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{course.instructors.join(", ")}</p>
        </div>
        {course.openRoundCount > 0 && (
          <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold", TONE_CLASS.info)}>
            เปิดรับ {course.openRoundCount}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{course.roundCount} รอบ</span>
        {course.myGroup ? (
          <span className="flex items-center gap-1">
            <Users size={12} />
            {course.myGroup.name}
          </span>
        ) : (
          <span className="font-semibold text-amber-700">ยังไม่มีกลุ่ม</span>
        )}
      </div>

      <div className="flex-1" />

      <Link to={`/courses/${course.id}`} className={buttonClass({ variant: "outline", fullWidth: true })}>
        ดูรายละเอียด
        <ChevronRight size={14} />
      </Link>
    </Card>
  );
}

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<ApiResponse<Course[]>>("/courses")
      .then((res) => setCourses(res.data.data.filter((c) => c.role === "student")))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  return (
    <div className="px-4 py-6 min-[900px]:px-10 min-[900px]:py-8">
      <h1 className="mb-8 text-2xl font-bold text-foreground">วิชาของฉัน</h1>

      {error && <Alert>{error}</Alert>}

      {!courses && !error && (
        <div className="grid grid-cols-1 gap-5 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3" aria-busy="true" aria-label="กำลังโหลด">
          {[0, 1].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      )}

      {courses?.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-5 py-32 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
            <BookOpen size={28} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">ยังไม่มีวิชาที่ลงทะเบียน</p>
            <p className="mt-1 text-sm text-muted-foreground">อาจารย์จะเพิ่มคุณเข้าวิชา แล้ววิชาจะแสดงที่นี่</p>
          </div>
        </div>
      )}

      {courses && courses.length > 0 && (
        <div className="grid grid-cols-1 items-stretch gap-5 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}
