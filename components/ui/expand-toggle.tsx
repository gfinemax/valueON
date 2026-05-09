import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

interface ExpandToggleProps {
  expanded: boolean;
  className?: string;
  iconClassName?: string;
}

export function ExpandToggle({
  expanded,
  className,
  iconClassName,
}: ExpandToggleProps) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
        expanded
          ? "border-slate-300 bg-white text-slate-700 shadow-sm"
          : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-slate-300 group-hover:bg-white group-hover:text-slate-700",
        className
      )}
    >
      {expanded ? (
        <ChevronUp className={cn("h-4 w-4", iconClassName)} aria-hidden="true" />
      ) : (
        <ChevronDown className={cn("h-4 w-4", iconClassName)} aria-hidden="true" />
      )}
    </span>
  );
}
