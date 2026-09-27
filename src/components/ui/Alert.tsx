import type { ReactNode } from "react";
import { CircleAlert, TriangleAlert } from "lucide-react";
import { cn } from "../../lib/cn";

const TONE = {
  error: { box: "border-red-200 bg-red-50 text-red-700", Icon: CircleAlert },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-800", Icon: TriangleAlert },
};

/** กล่องข้อความแจ้งเตือน — error มี role="alert" ให้ screen reader อ่านทันที */
export function Alert({
  tone = "error",
  className,
  children,
}: {
  tone?: keyof typeof TONE;
  className?: string;
  children: ReactNode;
}) {
  const { box, Icon } = TONE[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm", box, className)}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
