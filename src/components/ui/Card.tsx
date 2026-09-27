import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const PADDING = {
  none: "",
  md: "px-5 py-5",
  lg: "px-8 py-10",
};

/** กล่องพื้นขาวขอบมน — interactive = การ์ดที่คลิกได้ (hover แล้วขอบเป็นสี primary) */
export function Card({
  padding = "md",
  interactive = false,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  padding?: keyof typeof PADDING;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground",
        PADDING[padding],
        interactive &&
          "cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-md",
        className
      )}
      {...props}
    />
  );
}
