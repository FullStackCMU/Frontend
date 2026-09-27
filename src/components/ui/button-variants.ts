import { cn } from "../../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.98] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
  "disabled:pointer-events-none disabled:opacity-40";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-sm shadow-indigo-200 hover:opacity-90",
  secondary: "bg-secondary text-primary hover:opacity-80",
  outline:
    "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "rounded-lg px-3 py-1.5 text-xs",
  md: "rounded-xl px-5 py-2.5 text-sm",
  lg: "rounded-xl px-5 py-3.5 text-base",
};

/** ใช้กับ <a>/<Link> ที่ต้องหน้าตาเหมือนปุ่ม (เช่น ปุ่ม login ที่พาไป /api/auth/login) */
export function buttonClass({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean } = {}) {
  return cn(BASE, VARIANT[variant], SIZE[size], fullWidth && "w-full");
}
