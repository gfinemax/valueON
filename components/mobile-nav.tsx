"use client";

import { LayoutDashboard, Receipt, Settings, TrendingUp, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
    { label: "대시보드", icon: LayoutDashboard, href: "/" },
    { label: "수입", icon: TrendingUp, href: "/income" },
    { label: "지출", icon: Receipt, href: "/expense" },
    { label: "설정", icon: Settings, href: "/settings" },
];

export function MobileNav() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (typeof window !== "undefined") {
                const currentScrollY = window.scrollY;

                // 최상단에 있을 때는 항상 표시
                if (currentScrollY < 10) {
                    setIsVisible(true);
                }
                // 아래로 스크롤 시 숨김 (최소 50px 이상 이동했을 때)
                else if (currentScrollY > lastScrollY && currentScrollY > 50) {
                    setIsVisible(false);
                }
                // 위로 스크롤 시 다시 표시
                else if (currentScrollY < lastScrollY) {
                    setIsVisible(true);
                }

                setLastScrollY(currentScrollY);
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe md:hidden transition-transform duration-500 ease-in-out ${isVisible ? "translate-y-0" : "translate-y-full"
            }`}>
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
