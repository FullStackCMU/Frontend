import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { isStaff } from "./lib/user";
import { useSessionStore } from "./stores/useSessionStore";
import { Button } from "./components/ui/Button";
import { LogoMark } from "./components/ui/Brand";
import AppLayout from "./components/layout/AppLayout";
import { STAFF_NAV, STUDENT_NAV } from "./components/layout/nav";
import LoginPage from "./pages/LoginPage";
import ConsentPage from "./pages/ConsentPage";
import MyCoursesPage from "./pages/student/MyCoursesPage";
import StudentCourseDetail from "./pages/student/course/StudentCourseDetail";
import EvaluationFlow from "./pages/student/evaluation/EvaluationFlow";
import FeedbackPage from "./pages/student/feedback/FeedbackPage";
import CourseDashboard from "./pages/instructor/CourseDashboard";
import CourseDetail from "./pages/instructor/course/CourseDetail";
import StaffHome from "./pages/instructor/StaffHome";
import AssignmentsPage from "./pages/student/AssignmentsPage";
import FeedbackListPage from "./pages/student/feedback/FeedbackListPage";

const UiPreview = import.meta.env.DEV
  ? lazy(() => import("./pages/dev/UiPreview"))
  : null;

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      {children}
    </div>
  );
}

function App() {
  const session = useSessionStore((s) => s.session);
  const location = useLocation();

  if (UiPreview && location.pathname === "/dev/ui") {
    return (
      <Suspense>
        <UiPreview />
      </Suspense>
    );
  }

  if (session.status === "loading") {
    return (
      <FullScreen>
        <span className="animate-pulse">
          <LogoMark size="lg" />
        </span>
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      </FullScreen>
    );
  }

  if (session.status === "error") {
    return (
      <FullScreen>
        <p className="text-sm text-muted-foreground">เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          ลองใหม่
        </Button>
      </FullScreen>
    );
  }

  if (session.status === "anonymous") {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const { me, consent } = session;
  if (consent && !consent.accepted) {
    return (
      <Routes>
        <Route path="/consent" element={<ConsentPage />} />
        <Route path="*" element={<Navigate to="/consent" replace />} />
      </Routes>
    );
  }

  const staff = isStaff(me);

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/consent" element={<Navigate to="/" replace />} />

      <Route
        element={
          <AppLayout
            nav={staff ? STAFF_NAV : STUDENT_NAV}
            mobileNav={staff ? "drawer" : "bottom"}
            roleLabel={staff ? "อาจารย์" : "นักศึกษา"}
          />
        }
      >
        {staff ? (
          <>
            <Route index element={<StaffHome />} />
            <Route path="/courses" element={<CourseDashboard />} />
            <Route path="/courses/:courseId/*" element={<CourseDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route index element={<Navigate to="/assignments" replace />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/courses" element={<MyCoursesPage />} />
            <Route path="/courses/:courseId" element={<StudentCourseDetail />} />
            <Route path="/courses/:courseId/rounds/:roundId/*" element={<EvaluationFlow />} />
            <Route path="/feedback" element={<FeedbackListPage />} />
            <Route path="/feedback/:roundId" element={<FeedbackPage />} />
            <Route path="*" element={<Navigate to="/assignments" replace />} />
          </>
        )}
      </Route>
    </Routes>
  );
}

export default App;
