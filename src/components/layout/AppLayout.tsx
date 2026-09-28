import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Brand } from "../ui/Brand";
import { cn } from "../../lib/cn";
import { displayName } from "../../lib/user";
import type { Me } from "../../types";
import type { NavItem } from "./nav";

function Badge({ count, className }: { count?: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white",
        className
      )}
    >
      {count}
    </span>
  );
}

function SidebarNav({ nav, onNavigate }: { nav: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav aria-label="เมนูหลัก" className="flex flex-1 flex-col gap-0.5 px-3 py-4">
      {nav.map(({ to, label, icon: Icon, badge }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-secondary text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <Icon size={16} className="shrink-0" />
          <span className="flex-1 truncate">{label}</span>
          <Badge count={badge} />
        </NavLink>
      ))}
    </nav>
  );
}

function Profile({ name, roleLabel, onLogout }: { name: string; roleLabel: string; onLogout: () => void }) {
  return (
    <div className="border-t border-border px-3 pt-3 pb-4">
      <div className="flex items-center gap-2.5 px-2 py-2">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground" title={name}>
            {name}
          </p>
          <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          aria-label="ออกจากระบบ"
          title="ออกจากระบบ"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}

/**
 * โครงหน้าหลังล็อกอิน
 * - จอ ≥ 900px: sidebar ซ้ายติดกับที่
 * - จอ < 900px: mobileNav="bottom" → แถบเมนูล่าง (นักศึกษา), "drawer" → ปุ่มเมนู + ลิ้นชัก (อาจารย์)
 */
export default function AppLayout({
  me,
  nav,
  mobileNav,
  roleLabel,
  onLogout,
}: {
  me: Me;
  nav: NavItem[];
  mobileNav: "bottom" | "drawer";
  roleLabel: string;
  onLogout: () => void;
}) {
  const name = displayName(me);
  const { pathname } = useLocation();
  // จำ path ที่เปิดลิ้นชัก — เปลี่ยนหน้า (รวมกด back) แล้วปิดเองโดยไม่ต้องใช้ effect
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;
  const setDrawerOpen = (open: boolean) => setDrawerPath(open ? pathname : null);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerPath(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col overflow-y-auto border-r border-border bg-card min-[900px]:flex">
        <div className="border-b border-border px-5 pt-6 pb-5">
          <Brand />
          <p className="mt-0.5 ml-[38px] text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            {roleLabel}
          </p>
        </div>
        <SidebarNav nav={nav} />
        <Profile name={name} roleLabel={roleLabel} onLogout={onLogout} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card px-4 min-[900px]:hidden">
          {mobileNav === "drawer" && (
            <button
              type="button"
              onClick={() => setDrawerOpen(!drawerOpen)}
              aria-label={drawerOpen ? "ปิดเมนู" : "เปิดเมนู"}
              aria-expanded={drawerOpen}
              aria-controls="app-drawer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {drawerOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
          <span className="flex-1">
            <Brand />
          </span>
          {mobileNav === "bottom" && (
            <>
              <Avatar name={name} size="md" />
              <button
                type="button"
                onClick={onLogout}
                aria-label="ออกจากระบบ"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </header>

        {mobileNav === "drawer" && drawerOpen && (
          <>
            <div
              aria-hidden="true"
              className="fixed inset-0 z-20 bg-black/30 min-[900px]:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <aside
              id="app-drawer"
              className="fixed top-12 bottom-0 left-0 z-20 flex w-56 flex-col border-r border-border bg-card shadow-xl min-[900px]:hidden"
            >
              <SidebarNav nav={nav} onNavigate={() => setDrawerOpen(false)} />
              <Profile name={name} roleLabel={roleLabel} onLogout={onLogout} />
            </aside>
          </>
        )}

        <main className={cn("flex-1", mobileNav === "bottom" && "max-[899px]:pb-(--bottom-nav-h)")}>
          <Outlet />
        </main>
      </div>

      {mobileNav === "bottom" && (
        <nav
          aria-label="เมนูหลัก"
          className="fixed right-0 bottom-0 left-0 z-40 flex h-(--bottom-nav-h) items-stretch border-t border-border bg-card pb-[env(safe-area-inset-bottom)] min-[900px]:hidden"
        >
          {nav.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2.5 transition-colors",
                  isActive ? "text-indigo-600" : "text-muted-foreground"
                )
              }
            >
              <span className="relative">
                <Icon size={20} />
                <Badge count={badge} className="absolute -top-1.5 -right-2 h-4 min-w-4 text-[9px]" />
              </span>
              <span className="max-w-16 truncate text-center text-[10px] leading-tight font-medium">
                {label}
              </span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
