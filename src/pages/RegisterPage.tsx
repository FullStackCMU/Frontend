import { useState } from "react";
import { Link } from "react-router-dom";
import { api, tokenStore, userStore, getErrorMessage } from "../lib/api";
import type { ApiResponse, User } from "../types";

/** สมัครบัญชีนักศึกษา — สมัครสำเร็จแล้วล็อกอินให้อัตโนมัติ (role student เท่านั้น) */
export default function RegisterPage({
  onSuccess,
}: {
  onSuccess: (u: User) => void;
}) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !name || !password) return;

    setLoading(true);
    setError("");
    try {
      const res = await api.post<ApiResponse<{ token: string; user: User }>>(
        "/auth/register",
        { username, name, password }
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
      <hgroup className="login-header">
        <h1>CollabReflect</h1>
        <p className="safety-hint">สมัครบัญชีนักศึกษาเพื่อเริ่มใช้งาน</p>
      </hgroup>

      <article>
        <form onSubmit={handleSubmit}>
          <label>
            ชื่อ-นามสกุล
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              data-cy="input-reg-name"
            />
          </label>

          <label>
            รหัสนักศึกษา / ชื่อผู้ใช้
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              data-cy="input-reg-username"
            />
          </label>

          <label>
            รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              data-cy="input-reg-password"
            />
          </label>

          {error && <p className="status-toast">{error}</p>}

          <button type="submit" aria-busy={loading} data-cy="submit-register">
            {loading ? "กำลังสมัคร" : "สมัครบัญชี"}
          </button>
        </form>

        <p className="safety-hint" style={{ marginTop: "1rem", textAlign: "center" }}>
          มีบัญชีอยู่แล้ว? <Link to="/login" data-cy="link-login">เข้าสู่ระบบ</Link>
        </p>
      </article>
    </div>
  );
}
