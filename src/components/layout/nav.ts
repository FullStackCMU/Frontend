import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const STUDENT_NAV: NavItem[] = [
  { to: "/assignments", label: "แบบประเมิน", icon: ClipboardList },
  { to: "/courses", label: "วิชาของฉัน", icon: BookOpen },
  { to: "/feedback", label: "ฟีดแบ็ก", icon: MessageSquare },
];

export const STAFF_NAV: NavItem[] = [
  { to: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { to: "/courses", label: "คอร์สของฉัน", icon: BookOpen },
];
