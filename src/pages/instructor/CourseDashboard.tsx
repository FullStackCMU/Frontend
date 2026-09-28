import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Plus, Users } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatusPill } from "../../components/ui/StatusPill";
import { api, getErrorMessage } from "../../lib/api";
import { formatCourseCode, formatTerm } from "../../lib/course";
import { getRoundStatus } from "../../lib/status";
import type { ApiResponse, Course } from "../../types";
import CreateCourseModal from "./CreateCourseModal";

function CourseCard({ course }: { course: Course }) {
  const round = course.currentRound;
  return (
    <Link
      to={`/courses/${course.id}`}
      className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
    <Card padding="none" interactive className="flex h-full flex-col px-6 py-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            {formatCourseCode(course.courseCode, course.section)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatTerm(course.semester, course.academicYear)}
          </p>
        </div>
        {round && <StatusPill status={getRoundStatus(round)} />}
      </div>

      <h2 className="mb-4 flex-1 text-base leading-snug font-bold text-foreground transition-colors group-hover:text-primary">
        {course.title}
      </h2>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users size={14} />
          {course.studentCount} นักศึกษา
        </span>
        <span className="text-xs text-muted-foreground">
          {round ? `รอบที่ ${round.sequenceNo}` : "ยังไม่มีรอบประเมิน"}
        </span>
      </div>
    </Card>
    </Link>
  );
}

export default function CourseDashboard() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api
      .get<ApiResponse<Course[]>>("/courses")
      .then((res) => setCourses(res.data.data.filter((c) => c.role === "instructor")))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  function handleCreated(course: Course) {
    setCreating(false);
    setCourses((prev) => [course, ...(prev ?? [])]);
  }

  const createButton = (
    <Button onClick={() => setCreating(true)}>
      <Plus size={16} />
      สร้างคอร์สใหม่
    </Button>
  );

  return (
    <div className="max-w-6xl px-4 py-6 min-[900px]:px-10 min-[900px]:py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">คอร์สของฉัน</h1>
        {courses && courses.length > 0 && createButton}
      </div>

      {error && (
        <Alert>{error}</Alert>
      )}

      {!courses && !error && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="กำลังโหลด">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      )}

      {courses && courses.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-5 py-32">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
            <BookOpen size={28} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">ยังไม่มีคอร์ส</p>
            <p className="mt-1 text-sm text-muted-foreground">สร้างคอร์สแรกของคุณเพื่อเริ่มต้นใช้งาน</p>
          </div>
          {createButton}
        </div>
      )}

      {courses && courses.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {creating && <CreateCourseModal onClose={() => setCreating(false)} onCreated={handleCreated} />}
    </div>
  );
}
