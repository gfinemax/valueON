"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Database,
    Power,
    Settings,
    Banknote,
    Wallet
} from "lucide-react";

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    const routes = [
        {
            label: "대시보드",
            icon: LayoutDashboard,
            href: "/",
            active: pathname === "/",
            color: "text-sky-500",
        },
        {
            label: "수입 관리",
            icon: Banknote,
            href: "/income",
            active: pathname === "/income",
            color: "text-emerald-500",
        },
        {
            label: "지출 관리",
            icon: Wallet,
            href: "/expense",
            active: pathname === "/expense",
            color: "text-rose-500",
        },
        {
            label: "원시 데이터",
            icon: Database,
            href: "/data",
            active: pathname === "/data",
            color: "text-violet-500",
        },
    ];

    return (
        <div className={cn("space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white", className)}>
            <div className="px-3 py-2 flex-1">
                <Link href="/" className="flex items-center pl-3 mb-14 relative overflow-hidden">
                    <div className="relative w-8 h-8 mr-4 flex-shrink-0">
                        <Power className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap absolute left-[60px]">
                        Value On
                    </h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex py-3 pr-3 pl-[18px] w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                route.active ? "text-white bg-white/10" : "text-zinc-400"
                            )}
                        >
                            <div className="flex items-center flex-1 overflow-hidden">
                                <route.icon className={cn("h-5 w-5 mr-[22px] flex-shrink-0", route.color)} />
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                                    {route.label}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="px-3 py-2 overflow-hidden">
                <div className="text-xs text-zinc-500 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    Value On v1.0
                </div>
            </div>
        </div>
    );
}
