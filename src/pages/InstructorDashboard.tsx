import { useState } from "react";
import AppShell from "../components/AppShell";
import CoursesView from "./instructor/CoursesView";
import GroupsView from "./instructor/GroupsView";
import RoundsView from "./instructor/RoundsView";
import ReviewView from "./instructor/ReviewView";
import type { User } from "../types";

export default function InstructorDashboard({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [active, setActive] = useState("courses");

  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      nav={[
        { key: "courses", label: "รายวิชา" },
        { key: "groups", label: "จัดกลุ่ม" },
        { key: "rounds", label: "แบบประเมิน" },
        { key: "review", label: "พิจารณาฟีดแบ็ก" },
      ]}
      active={active}
      onNavigate={setActive}
    >
      {active === "courses" && (
        <>
          <h3 className="page-heading">รายวิชา</h3>
          <p className="page-description">สร้างรายวิชาและลงทะเบียนนักศึกษา</p>
        </>
      )}
      {active === "groups" && (
        <>
          <h3 className="page-heading">จัดกลุ่ม</h3>
          <p className="page-description">จัดกลุ่มนักศึกษาตามรายวิชาเพื่อเริ่มระบบประเมิน</p>
        </>
      )}
      {active === "rounds" && (
        <>
          <h3 className="page-heading">แบบประเมิน</h3>
          <p className="page-description">สร้างแบบประเมิน ตั้งคำถาม และเปิด-ปิดแบบประเมิน</p>
        </>
      )}
      {active === "review" && (
        <>
          <h3 className="page-heading">พิจารณาฟีดแบ็ก</h3>
          <p className="page-description">อ่านคำตอบดิบ สรุปข้อเสนอแนะ และเผยแพร่ให้นักศึกษา</p>
        </>
      )}
      {active === "courses" && <CoursesView />}
      {active === "groups" && <GroupsView />}
      {active === "rounds" && <RoundsView />}
      {active === "review" && <ReviewView />}
    </AppShell>
  );
}