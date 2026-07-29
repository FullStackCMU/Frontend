import { useState } from "react";
import { Link } from "react-router-dom";
import { api, tokenStore, userStore, getErrorMessage } from "../lib/api";
import { SafeSpaceArt } from "../components/illustrations";
import Icon from "../components/Icon";
import type { ApiResponse, User } from "../types";

export default function LoginPage({
  onSuccess,
}: {
  onSuccess: (u: User) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError("");
    try {
      const res = await api.post<ApiResponse<{ token: string; user: User }>>(
        "/auth/login",
        { username, password }
      );
      const { token, user } = res.data.data;
      tokenStore.set(token);
      userStore.set(user);
      onSuccess(user);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-art">
        <SafeSpaceArt />
      </div>
      <hgroup className="login-header">
        <h1>CollabReflect</h1>
        <p className="safety-hint">พื้นที่ปลอดภัยสำหรับสะท้อนการทำงานเป็นทีม</p>
      </hgroup>

      <article>
        <form onSubmit={handleSubmit}>
          <label>
            รหัสนักศึกษา / ชื่อผู้ใช้
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              data-cy="input-username"
            />
          </label>

          <label>
            รหัสผ่าน
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              data-cy="input-password"
            />
          </label>

          {error && (
            <p className="status-toast">{error}</p>
          )}

          <button type="submit" aria-busy={loading} data-cy="submit-login">
            {loading ? "กำลังเข้าสู่ระบบ" : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="safety-hint" style={{ marginTop: "1rem", textAlign: "center" }}>
          ยังไม่มีบัญชี?{" "}
          <Link to="/register" data-cy="link-register">
            สมัครนักศึกษา
          </Link>
        </p>
      </article>

      <div className="login-safety-note">
        <p className="safety-hint safety-hint-icon">
          <Icon name="shield" size={18} />
          <span>
            ความคิดเห็นที่คุณเขียนจะถูกส่งให้อาจารย์พิจารณาก่อนเสมอ
            เพื่อนร่วมทีมจะไม่เห็นข้อความโดยตรง
          </span>
        </p>
      </div>
    </div>
  );
}