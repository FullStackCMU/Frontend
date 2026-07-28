import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { tokenStore, userStore, UNAUTHORIZED_EVENT } from "./lib/api";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import type { User } from "./types";

function App() {
  const [user, setUser] = useState<User | null>(() => userStore.get());

  function handleLogout() {
    tokenStore.clear();
    setUser(null);
  }

  // token หมดอายุ (401) → interceptor ล้าง storage แล้วยิง event มา sync user state
  useEffect(() => {
    function onUnauthorized() {
      setUser(null);
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  // ยังไม่ล็อกอิน → หน้า login อยู่ที่ /login (path อื่นเด้งมา /login)
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onSuccess={setUser} />} />
        <Route path="/register" element={<RegisterPage onSuccess={setUser} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // ล็อกอินแล้ว → dashboard ตาม role (ภายในยังใช้ state nav เดิม — จะแตกเป็น route ในเฟสถัดไป)
  const dashboard =
    user.role === "instructor" ? (
      <InstructorDashboard user={user} onLogout={handleLogout} />
    ) : (
      <StudentDashboard user={user} onLogout={handleLogout} />
    );

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/*" element={dashboard} />
    </Routes>
  );
}

export default App;