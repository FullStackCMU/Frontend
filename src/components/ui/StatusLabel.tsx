import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { STATUS, TONE_ICON, type Status, type Tone } from "../../lib/status";

// ป้ายทุกชนิดในแอป = ไอคอนสี + ข้อความ ไม่มีพื้นสี
export function ToneLabel({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: Tone;
  icon: LucideIcon;
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium whitespace-nowrap text-muted-foreground"
    >
      <Icon size={14} aria-hidden="true" className={cn("shrink-0", TONE_ICON[tone])} />
      {children}
    </span>
  );
}

export function StatusLabel({ status, label }: { status: Status; label?: string }) {
  const { label: defaultLabel, tone, icon } = STATUS[status];
  return (
    <ToneLabel tone={tone} icon={icon}>
      {label ?? defaultLabel}
    </ToneLabel>
  );
}
