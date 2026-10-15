import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useMatch } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Brand } from "../ui/Brand";
import { useCourse } from "../../hooks/useCourses";
import { cn } from "../../lib/cn";
import { displayName } from "../../lib/user";
import { useMe, useSessionStore } from "../../stores/useSessionStore";
import type { NavItem, NavSection } from "./nav";

function CourseSections({
  courseId,
  sections,
  onNavigate,
}: {
  courseId: string;
  sections: NavSection[];
  onNavigate?: () => void;
}) {
  const { data: course } = useCourse(courseId);
  const base = `/courses/${courseId}`;
  return (
    <div className="mt-0.5 mb-1 ml-[22px] flex flex-col gap-0.5 border-l border-border pl-2.5">
      <p className="truncate px-2 pt-1 pb-0.5 text-[11px] font-semibold text-muted-foreground" title={course?.title}>
        {course ? `${course.courseCode} ${course.title}` : "\u00a0"}
      </p>
      {sections.map((s) => (
        <NavLink
          key={s.path}
          to={s.path ? `${base}/${s.path}` : base}
          end={!s.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "truncate rounded-md px-2 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-secondary font-semibold text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          {s.label}
        </NavLink>
      ))}
    </div>
  );
}

function SidebarNav({ nav, onNavigate }: { nav: NavItem[]; onNavigate?: () => void }) {
  const courseId = useMatch("/courses/:courseId/*")?.params.courseId;
  return (
    <nav aria-label="เมนูหลัก" className="flex flex-1 flex-col gap-0.5 px-3 py-4">
      {nav.map(({ to, label, icon: Icon, sections }) => {
        // เปิดวิชาอยู่ → ไฮไลต์ที่หัวข้อย่อยแทนเมนูหลัก
        const open = sections && courseId ? { courseId, sections } : null;
        return (
          <div key={to}>
            <NavLink
              to={to}
              end={!!open}
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
            </NavLink>
            {open && <CourseSections courseId={open.courseId} sections={open.sections} onNavigate={onNavigate} />}
          </div>
        );
      })}
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

export default function AppLayout({
  nav,
  mobileNav,
  roleLabel,
}: {
  nav: NavItem[];
  mobileNav: "bottom" | "drawer";
  roleLabel: string;
}) {
  const name = displayName(useMe());
  const onLogout = useSessionStore((s) => s.logout);
  const { pathname } = useLocation();
  // ปิดลิ้นชักเมื่อ path เปลี่ยน โดยไม่ใช้ effect
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
          {nav.map(({ to, label, icon: Icon }) => (
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
              <span>
                <Icon size={20} />
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
