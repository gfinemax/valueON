import { Power } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
    costPerPyung: number;
    onReset?: () => void;
}

export function Header({ costPerPyung, onReset }: HeaderProps) {
    const formattedCost = new Intl.NumberFormat("ko-KR", {
        style: "currency",
        currency: "KRW",
        maximumFractionDigits: 0,
    }).format(costPerPyung);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur px-4 h-14 flex items-center justify-end supports-[backdrop-filter]:bg-white/60">
            <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground mr-1">평당 예상 분담금</span>
                <span className="text-lg font-bold text-[#48bb78]">
                    {formattedCost}
                </span>
            </div>
            {onReset && (
                <button onClick={onReset} className="ml-4 text-xs text-red-500 hover:underline">
                    초기화
                </button>
            )}
        </header>
    );
}
