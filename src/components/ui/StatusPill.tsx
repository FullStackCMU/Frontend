import { cn } from "../../lib/cn";
import { STATUS, TONE_CLASS, TONE_DOT, type Status } from "../../lib/status";

export function StatusPill({ status }: { status: Status }) {
  const { label, tone } = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        TONE_CLASS[tone]
      )}
    >
      {label}
    </span>
  );
}

export function StatusDot({ status }: { status: Status }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        TONE_DOT[STATUS[status].tone]
      )}
    />
  );
}
