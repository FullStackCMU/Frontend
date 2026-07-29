import { useState, type ReactNode } from "react";
import type { User } from "../types";

export interface NavItem {
  key: string;
  label: string;
}

export default function AppShell({
  user,
  onLogout,
  nav,
  active,
  onNavigate,
  slot,
  children,
}: {
  user: User;
  onLogout: () => void;
  nav: NavItem[];
  active: string;
  onNavigate: (key: string) => void;
  slot?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className="sidebar" data-open={open}>
        <div className="sidebar-head">
          <div className="sidebar-brand">CollabReflect</div>
          <button
            className="menu-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            เมนู
          </button>
        </div>

        <p className="sidebar-tagline">
          พื้นที่ปลอดภัยสำหรับสะท้อนการทำงานเป็นทีม
        </p>

        {slot && <div className="sidebar-slot">{slot}</div>}

        <nav className="sidebar-nav" aria-label="เมนูหลัก">
          {nav.map((item) => (
            <button
              key={item.key}
              className="nav-item"
              data-active={active === item.key}
              onClick={() => {
                onNavigate(item.key);
                setOpen(false);
              }}
              data-cy={`nav-${item.key}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{user.name}</strong>
            <span>{user.role === "instructor" ? "อาจารย์" : "นักศึกษา"}</span>
          </div>
          <button className="sidebar-logout" onClick={onLogout} data-cy="logout">
            ออกจากระบบ
          </button>
        </div>
      </aside>

      <main className="app-main">
        {children}
        <footer className="safety-hint" style={{ paddingTop: "3rem" }}>
          ความคิดเห็นทุกข้อจะผ่านการพิจารณาของอาจารย์ก่อนเผยแพร่เสมอ
        </footer>
      </main>
    </div>
  );
}