import { Navigate } from "react-router-dom";
import { useInstructorCourses } from "../../hooks/useCourses";

// มีวิชาเดียวเข้าไปที่ภาพรวมของวิชานั้นเลย ไม่ต้องผ่านรายการวิชา
export default function StaffHome() {
  const { data: courses, error } = useInstructorCourses();
  if (error) return <Navigate to="/courses" replace />;
  if (!courses)
    return (
      <div className="px-4 py-6 min-[900px]:px-10 min-[900px]:py-8" aria-busy="true" aria-label="กำลังโหลด">
        <div className="h-7 w-72 animate-pulse rounded bg-muted" />
      </div>
    );
  return <Navigate to={courses.length === 1 ? `/courses/${courses[0].id}` : "/courses"} replace />;
}
