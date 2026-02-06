"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Database,
    Power,
    Settings
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
                <Link href="/" className="flex items-center pl-3 mb-14">
                    <div className="relative w-8 h-8 mr-4">
                        <Power className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">
                        Value On
                    </h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                route.active ? "text-white bg-white/10" : "text-zinc-400"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="px-3 py-2">
                <div className="text-xs text-zinc-500 px-3">
                    Value On v1.0
                </div>
            </div>
        </div>
    );
}
