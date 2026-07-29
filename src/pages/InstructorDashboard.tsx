import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import CoursesView from "./instructor/CoursesView";
import GroupsView from "./instructor/GroupsView";
import RoundsView from "./instructor/RoundsView";
import ReviewView from "./instructor/ReviewView";
import type { User } from "../types";

const NAV = [
  {
    key: "courses",
    label: "รายวิชา",
    path: "/courses",
    title: "รายวิชา",
    desc: "สร้างรายวิชาและลงทะเบียนนักศึกษา",
  },
  {
    key: "groups",
    label: "จัดกลุ่ม",
    path: "/groups",
    title: "จัดกลุ่ม",
    desc: "จัดกลุ่มนักศึกษาตามรายวิชาเพื่อเริ่มระบบประเมิน",
  },
  {
    key: "rounds",
    label: "แบบประเมิน",
    path: "/rounds",
    title: "แบบประเมิน",
    desc: "สร้างแบบประเมิน ตั้งคำถาม และเปิด-ปิดแบบประเมิน",
  },
  {
    key: "review",
    label: "พิจารณาฟีดแบ็ก",
    path: "/review",
    title: "พิจารณาฟีดแบ็ก",
    desc: "อ่านคำตอบดิบ สรุปข้อเสนอแนะ และเผยแพร่ให้นักศึกษา",
  },
];

export default function InstructorDashboard({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const current = NAV.find((n) => location.pathname.startsWith(n.path));

  // path ที่ไม่ตรงเมนูไหน (เช่น "/") → เด้งไปหน้าแรก /courses
  useEffect(() => {
    if (!current) navigate("/courses", { replace: true });
  }, [current, navigate]);

  const active = current?.key ?? "courses";
  const page = current ?? NAV[0];

  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      nav={NAV.map(({ key, label }) => ({ key, label }))}
      active={active}
      onNavigate={(key) => {
        const item = NAV.find((n) => n.key === key);
        if (item) navigate(item.path);
      }}
    >
      <h3 className="page-heading">{page.title}</h3>
      <p className="page-description">{page.desc}</p>

      {active === "courses" && <CoursesView />}
      {active === "groups" && <GroupsView />}
      {active === "rounds" && <RoundsView />}
      {active === "review" && <ReviewView />}
    </AppShell>
  );
}
