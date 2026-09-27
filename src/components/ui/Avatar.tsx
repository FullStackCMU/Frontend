import { cn } from "../../lib/cn";

const SIZE = {
  sm: "size-7 text-xs",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
};

/** วงกลมตัวย่อชื่อ — "ปฏิพันธ์ เลขนอก" → "ปล" (ข้ามสระหน้า เ แ โ ใ ไ) */
export function Avatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: keyof typeof SIZE;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => [...part.replace(/^[เแโใไ]/, "")][0] ?? "")
    .join("");

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-primary",
        SIZE[size]
      )}
    >
      {initials}
    </span>
  );
}
