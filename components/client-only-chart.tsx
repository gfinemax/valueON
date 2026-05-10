"use client";

import { useEffect, useState, type ReactNode } from "react";

interface ClientOnlyChartProps {
  children: ReactNode;
  className?: string;
}

export function ClientOnlyChart({ children, className = "h-full w-full" }: ClientOnlyChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return <div className={className}>{mounted ? children : null}</div>;
}
