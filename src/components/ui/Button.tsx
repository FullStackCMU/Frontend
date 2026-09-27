import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./button-variants";

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}) {
  return (
    <button
      type={type}
      className={cn(buttonClass({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}
