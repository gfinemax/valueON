"use client";

import { LayoutDashboard, Receipt, TrendingUp, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { label: "대시보드", icon: LayoutDashboard, href: "/" },
    { label: "지출", icon: Receipt, href: "/expense" },
    { label: "수입", icon: TrendingUp, href: "/income" },
    { label: "프로필", icon: User, href: "/profile" },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 pb-safe md:hidden">
            <div className="grid grid-cols-4 h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? "text-[#8c9c8a]" : "text-stone-400"
                                }`}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
