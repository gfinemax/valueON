"use client";

import { cn } from "@/lib/utils";

type SummaryTone = "neutral" | "positive" | "negative" | "accent";

interface SummaryItem {
    label: string;
    value: string;
    description: string;
    tone?: SummaryTone;
}

interface ManagementHeroSummaryProps {
    title: string;
    value: string;
    description: string;
    tone?: SummaryTone;
    items: SummaryItem[];
    sticky?: boolean;
    className?: string;
}

function getToneClass(tone: SummaryTone = "neutral") {
    if (tone === "positive") return "text-emerald-300";
    if (tone === "negative") return "text-red-300";
    if (tone === "accent") return "text-blue-300";
    return "text-white";
}

export function ManagementHeroSummary({
    title,
    value,
    description,
    tone = "neutral",
    items,
    sticky = false,
    className,
}: ManagementHeroSummaryProps) {
    return (
        <section
            className={cn(
                "rounded-xl border border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 p-5 text-white shadow-sm",
                sticky && "sticky top-0 z-30",
                className
            )}
        >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,2fr)] lg:items-end">
                <div className="min-w-0">
                    <p className="text-sm font-bold tracking-tight text-slate-400">{title}</p>
                    <div className={`mt-3 truncate text-3xl font-extrabold tracking-tight sm:text-4xl ${getToneClass(tone)}`}>
                        {value}
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-400">{description}</p>
                </div>

                <div className="grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    {items.map((item) => (
                        <div key={item.label} className="min-w-0">
                            <p className="text-xs font-bold tracking-tight text-slate-400">{item.label}</p>
                            <div className={`mt-2 truncate text-xl font-extrabold tracking-tight sm:text-2xl ${getToneClass(item.tone)}`}>
                                {item.value}
                            </div>
                            <p className="mt-2 min-h-8 text-xs leading-4 text-slate-500">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
