import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface BreadcrumbSegment {
  label: string;
  to?: string;
}

export function Breadcrumb({ segments }: { segments: BreadcrumbSegment[] }) {
  return (
    <nav
      aria-label="breadcrumb"
      className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
    >
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={11} className="shrink-0 opacity-40" />}
            {!isLast && seg.to ? (
              <Link
                to={seg.to}
                className="transition-colors hover:text-foreground hover:underline"
              >
                {seg.label}
              </Link>
            ) : (
              <span
                className={isLast ? "font-medium text-foreground" : undefined}
                aria-current={isLast ? "page" : undefined}
              >
                {seg.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
