import { cn } from "../../lib/cn";

/** โลโก้วงกลม 3 วง */
export function LogoMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  const lg = size === "lg";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary",
        lg ? "size-14 rounded-2xl shadow-lg shadow-indigo-200" : "size-7 rounded-lg"
      )}
    >
      <svg
        width={lg ? 28 : 14}
        height={lg ? 28 : 14}
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="5" cy="5" r="3" fill="white" fillOpacity="0.9" />
        <circle cx="10" cy="5" r="3" fill="white" fillOpacity="0.5" />
        <circle cx="7.5" cy="10" r="3" fill="white" fillOpacity="0.7" />
      </svg>
    </span>
  );
}

/** โลโก้ + ชื่อระบบ (ใช้บน sidebar / top bar) */
export function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-sm font-bold text-foreground">CollabReflect</span>
    </span>
  );
}
