import { useEffect, useState } from "react";
import { tokenStore, userStore, UNAUTHORIZED_EVENT } from "./lib/api";
import LoginPage from "./pages/LoginPage";
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

  if (!user) return <LoginPage onSuccess={setUser} />;

  return user.role === "instructor" ? (
    <InstructorDashboard user={user} onLogout={handleLogout} />
  ) : (
    <StudentDashboard user={user} onLogout={handleLogout} />
  );
}

export default App;