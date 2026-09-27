import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { fetchConsent, fetchMe, logout, UNAUTHORIZED_EVENT } from "./lib/api";
import { isStaff } from "./lib/user";
import { Button } from "./components/ui/Button";
import { LogoMark } from "./components/ui/Brand";
import AppLayout from "./components/layout/AppLayout";
import LegacyPage from "./components/layout/LegacyPage";
import { STAFF_NAV, STUDENT_NAV } from "./components/layout/nav";
import LoginPage from "./pages/LoginPage";
import ConsentPage from "./pages/ConsentPage";
import AssignmentsPage from "./pages/student/AssignmentsPage";
import MyCoursesPage from "./pages/student/MyCoursesPage";
import StudentCourseDetail from "./pages/student/course/StudentCourseDetail";
import EvaluationFlow from "./pages/student/evaluation/EvaluationFlow";
import FeedbackListPage from "./pages/student/feedback/FeedbackListPage";
import FeedbackPage from "./pages/student/feedback/FeedbackPage";
import CourseDashboard from "./pages/instructor/CourseDashboard";
import CourseDetail from "./pages/instructor/course/CourseDetail";
import ReviewView from "./pages/instructor/ReviewView";
import type { ConsentStatus, Me } from "./types";

// หน้าตัวอย่าง UI primitives — มีเฉพาะตอน dev (build จริงตัดทิ้ง)
const UiPreview = import.meta.env.DEV
  ? lazy(() => import("./pages/dev/UiPreview"))
  : null;

type Session =
  | { status: "loading" }
  | { status: "error" }
  | { status: "anonymous" }
  // consent = null → ไม่ต้องขอ (บุคลากร — consent ครอบคลุมข้อความที่นักศึกษาเขียนเท่านั้น)
  | { status: "authenticated"; me: Me; consent: ConsentStatus | null };

// session อยู่ใน httpOnly cookie → ถาม backend ทุกครั้งที่เปิดแอป
async function loadSession(): Promise<Session> {
  const me = await fetchMe();
  if (!me) return { status: "anonymous" };
  const consent = isStaff(me) ? null : await fetchConsent();
  return { status: "authenticated", me, consent };
}

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      {children}
    </div>
  );
}

function App() {
  const [session, setSession] = useState<Session>({ status: "loading" });
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    loadSession()
      .then((s) => !cancelled && setSession(s))
      .catch(() => !cancelled && setSession({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, []);

  // API ตอบ 401 ระหว่างใช้งาน (cookie หมดอายุ) → กลับหน้า login
  useEffect(() => {
    function onUnauthorized() {
      setSession({ status: "anonymous" });
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  // ลบ session ของระบบแล้วกลับหน้า login (route ของ anonymous พาไป /login เอง)
  // request ล้มเหลวก็ยังถือว่า logout ฝั่งหน้าเว็บ
  // หมายเหตุ: session ที่ oauth497 ยังอยู่ — login ใหม่จะได้บัญชีเดิม (end-session / prompt=login ใช้ไม่ได้)
  async function handleLogout() {
    await logout().catch(() => {});
    setSession({ status: "anonymous" });
  }

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

  // นักศึกษาที่ยังไม่ยอมรับนโยบายเวอร์ชันปัจจุบัน → ต้องผ่านหน้า consent ก่อนทุกหน้า
  const { me, consent } = session;
  if (consent && !consent.accepted) {
    return (
      <Routes>
        <Route
          path="/consent"
          element={
            <ConsentPage
              onAccepted={(accepted) => setSession({ ...session, consent: accepted })}
              onDecline={handleLogout}
            />
          }
        />
        <Route path="*" element={<Navigate to="/consent" replace />} />
      </Routes>
    );
  }

  const staff = isStaff(me);

  // LegacyPage = หน้าเดิม (Pico) ที่ยังไม่ได้ย้าย — เหลือแค่แดชบอร์ดอาจารย์
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/consent" element={<Navigate to="/" replace />} />

      <Route
        element={
          <AppLayout
            me={me}
            nav={staff ? STAFF_NAV : STUDENT_NAV}
            mobileNav={staff ? "drawer" : "bottom"}
            roleLabel={staff ? "อาจารย์" : "นักศึกษา"}
            onLogout={handleLogout}
          />
        }
      >
        {staff ? (
          <>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <LegacyPage title="แดชบอร์ด" description="คำตอบของนักศึกษาในแต่ละรอบ">
                  <ReviewView />
                </LegacyPage>
              }
            />
            <Route path="/courses" element={<CourseDashboard />} />
            <Route path="/courses/:courseId/*" element={<CourseDetail />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        ) : (
          <>
            <Route index element={<Navigate to="/assignments" replace />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/courses" element={<MyCoursesPage />} />
            <Route path="/courses/:courseId" element={<StudentCourseDetail me={me} />} />
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
