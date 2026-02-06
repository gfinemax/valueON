import { DataViewer } from "@/components/data-viewer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DataPage() {
    return (
        <div className="container mx-auto py-6 px-4">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-[#1a365d]">원시 데이터 (Raw Data)</h1>
            </div>

            <div className="bg-white p-4 rounded-lg shadow space-y-4">
                <div className="text-sm text-muted-foreground mb-2">
                    * 동일수지표.csv 파일의 내용을 표시합니다. (엑셀 원본 구조 유지)
                </div>
                <DataViewer />
            </div>
        </div>
    );
}
