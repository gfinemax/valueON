"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Bell, Palette, Globe, Shield, Smartphone, Move } from "lucide-react";
import { MobileStatusBar } from "@/components/mobile-status-bar";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useSettings } from "@/components/settings-context";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const {
        allowItemMoving,
        setAllowItemMoving,
        allowCategoryAdding,
        setAllowCategoryAdding,
        allowItemDeleting,
        setAllowItemDeleting
    } = useSettings();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Avoid hydration mismatch by only rendering after mounting
    if (!mounted) {
        return <div className="min-h-screen bg-background" />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24 md:pb-8">
            <MobileStatusBar />

            {/* Header */}
            <header className="px-6 py-6 pt-12 md:pt-6 bg-card border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#8c9c8a] rounded-lg shadow-sm">
                        <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif text-foreground leading-tight">설정</h1>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Application Preferences</p>
                    </div>
                </div>
            </header>

            <main className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
                {/* Visual Preference */}
                <Card className="border-border shadow-sm overflow-hidden bg-card">
                    <CardHeader className="bg-muted/30 border-b border-border py-4">
                        <div className="flex items-center gap-2">
                            <Palette className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-base font-bold text-foreground">디스플레이</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            <SettingItem
                                label="다크 모드"
                                description="안락한 눈을 위한 어두운 테마 사용"
                                control={
                                    <Switch
                                        checked={theme === 'dark'}
                                        onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                                    />
                                }
                            />
                            <SettingItem
                                label="자동 업데이트"
                                description="새로운 기능이 추가될 때 자동으로 앱 업데이트"
                                control={<Switch checked={true} />}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Feature Settings (Added) */}
                <Card className="border-border shadow-sm overflow-hidden bg-card">
                    <CardHeader className="bg-muted/30 border-b border-border py-4">
                        <div className="flex items-center gap-2">
                            <Move className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-base font-bold text-foreground">기능 및 편집</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            <SettingItem
                                label="항목 이동 허용"
                                description="지출 페이지에서 항목의 순서를 드래그하여 변경할 수 있습니다."
                                control={
                                    <Switch
                                        checked={allowItemMoving}
                                        onChange={(checked) => setAllowItemMoving(checked)}
                                    />
                                }
                            />
                            <SettingItem
                                label="카테고리 추가 허용"
                                description="지출 페이지 하단에서 새로운 지출 카테고리를 추가할 수 있습니다."
                                control={
                                    <Switch
                                        checked={allowCategoryAdding}
                                        onChange={(checked) => setAllowCategoryAdding(checked)}
                                    />
                                }
                            />
                            <SettingItem
                                label="항목 삭제 허용"
                                description="지출 페이지에서 카테고리, 항목, 세부항목을 삭제할 수 있습니다."
                                control={
                                    <Switch
                                        checked={allowItemDeleting}
                                        onChange={(checked) => setAllowItemDeleting(checked)}
                                    />
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="border-border shadow-sm overflow-hidden bg-card">
                    <CardHeader className="bg-muted/30 border-b border-border py-4">
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-base font-bold text-foreground">알림</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            <SettingItem
                                label="푸시 알림"
                                description="분석 결과 및 주요 업데이트 알림 받기"
                                control={<Switch checked={true} />}
                            />
                            <SettingItem
                                label="이메일 보고서"
                                description="주간 지출 및 수입 요약 보고서 받기"
                                control={<Switch checked={false} />}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Security & System */}
                <Card className="border-border shadow-sm overflow-hidden bg-card">
                    <CardHeader className="bg-muted/30 border-b border-border py-4">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-base font-bold text-foreground">보안 및 시스템</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            <SettingItem
                                label="생체 인식 로그인"
                                description="지문 또는 얼굴 인식으로 보안 강화"
                                control={<Switch checked={false} />}
                            />
                            <div className="p-5 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                <div className="space-y-0.5">
                                    <h3 className="text-sm font-bold text-foreground">앱 버전</h3>
                                    <p className="text-xs text-muted-foreground">Value On v1.0.0 (Build 20260209)</p>
                                </div>
                                <div className="text-muted-foreground/30">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

function SettingItem({ label, description, control }: { label: string, description: string, control: React.ReactNode }) {
    return (
        <div className="p-5 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="space-y-0.5 pr-4">
                <h3 className="text-sm font-bold text-foreground">{label}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
            </div>
            <div>
                {control}
            </div>
        </div>
    );
}

function Switch({ checked, onChange }: { checked: boolean, onChange?: (checked: boolean) => void }) {
    return (
        <div
            onClick={() => onChange?.(!checked)}
            className={`w-11 h-6 rounded-full transition-all duration-200 relative cursor-pointer ${checked ? 'bg-[#8c9c8a]' : 'bg-muted'}`}
        >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm ${checked ? 'left-6' : 'left-1'}`} />
        </div>
    );
}
