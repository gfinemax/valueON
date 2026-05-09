"use client";

import { useState } from "react";
import { Check, MapPin, Settings, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ProjectTarget } from "@/types";

interface ProjectInfoPanelProps {
    projectTarget: ProjectTarget;
    onUpdate: (field: keyof ProjectTarget, value: number) => void;
}

export function ProjectInfoPanel({ projectTarget, onUpdate }: ProjectInfoPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [editValues, setEditValues] = useState({
        totalLandArea: projectTarget.totalLandArea.toString(),
        totalFloorArea: projectTarget.totalFloorArea.toString(),
        totalHouseholds: projectTarget.totalHouseholds.toString(),
        privateLandArea: (projectTarget.privateLandArea || 0).toString(),
        publicLandArea: (projectTarget.publicLandArea || 0).toString(),
    });

    const syncEditValues = () => {
        setEditValues({
            totalLandArea: projectTarget.totalLandArea.toString(),
            totalFloorArea: projectTarget.totalFloorArea.toString(),
            totalHouseholds: projectTarget.totalHouseholds.toString(),
            privateLandArea: (projectTarget.privateLandArea || 0).toString(),
            publicLandArea: (projectTarget.publicLandArea || 0).toString(),
        });
    };

    const handleOpenChange = (open: boolean) => {
        if (open) {
            syncEditValues();
        }
        setIsOpen(open);
    };

    const handleSave = () => {
        const landArea = parseFloat(editValues.totalLandArea.replace(/,/g, '')) || 0;
        const floorArea = parseFloat(editValues.totalFloorArea.replace(/,/g, '')) || 0;
        const households = parseInt(editValues.totalHouseholds.replace(/,/g, ''), 10) || 0;
        const privateLandArea = parseFloat(editValues.privateLandArea.replace(/,/g, '')) || 0;
        const publicLandArea = parseFloat(editValues.publicLandArea.replace(/,/g, '')) || 0;

        if (landArea !== projectTarget.totalLandArea) {
            onUpdate('totalLandArea', landArea);
        }
        if (floorArea !== projectTarget.totalFloorArea) {
            onUpdate('totalFloorArea', floorArea);
        }
        if (households !== projectTarget.totalHouseholds) {
            onUpdate('totalHouseholds', households);
        }
        if (privateLandArea !== (projectTarget.privateLandArea || 0)) {
            onUpdate('privateLandArea', privateLandArea);
        }
        if (publicLandArea !== (projectTarget.publicLandArea || 0)) {
            onUpdate('publicLandArea', publicLandArea);
        }

        setIsOpen(false);
    };

    const formatNumber = (val: number) => new Intl.NumberFormat("ko-KR").format(val);

    const infoItems = [
        {
            label: '대지면적',
            value: projectTarget.totalLandArea,
            unit: '평',
            key: 'totalLandArea' as const,
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
            label: '연면적',
            value: projectTarget.totalFloorArea,
            unit: '평',
            key: 'totalFloorArea' as const,
            color: 'bg-blue-50 text-blue-700 border-blue-200',
        },
        {
            label: '총세대수',
            value: projectTarget.totalHouseholds,
            unit: '세대',
            key: 'totalHouseholds' as const,
            color: 'bg-purple-50 text-purple-700 border-purple-200',
        },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <div className="flex items-center gap-2">
                <div className="hidden xl:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span>대지 {formatNumber(projectTarget.totalLandArea)}평</span>
                    <span className="h-3 w-px bg-slate-200" />
                    <span>연면적 {formatNumber(projectTarget.totalFloorArea)}평</span>
                    <span className="h-3 w-px bg-slate-200" />
                    <span>{formatNumber(projectTarget.totalHouseholds)}세대</span>
                </div>
                <button
                    type="button"
                    onClick={() => handleOpenChange(true)}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">프로젝트 설정</span>
                </button>
            </div>

            <DialogContent className="fixed inset-y-0 right-0 left-auto top-0 h-dvh w-[min(430px,calc(100vw-1rem))] max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-l-xl rounded-r-none border-y-0 border-l bg-white p-0 shadow-2xl sm:rounded-l-xl data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
                <DialogHeader className="border-b border-slate-100 p-5 pr-12">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5 text-slate-500" />
                        프로젝트 설정
                    </DialogTitle>
                    <DialogDescription>
                        면적과 세대수는 지출 계산 기준에 바로 반영됩니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                    {infoItems.map((item) => (
                        <div
                            key={item.key}
                            className={`rounded-lg border p-3 ${item.color}`}
                        >
                            <label className="mb-2 block text-sm font-bold opacity-90">
                                {item.label}
                            </label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="text"
                                    value={editValues[item.key]}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                                        setEditValues(prev => ({ ...prev, [item.key]: raw }));
                                    }}
                                    className="h-10 bg-white text-right text-lg font-bold text-slate-900"
                                />
                                <span className="w-10 shrink-0 text-sm font-medium">{item.unit}</span>
                            </div>
                        </div>
                    ))}

                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
                        <div className="mb-2 text-sm font-bold">대지면적 상세</div>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="space-y-1">
                                <span className="text-xs opacity-80">사유지</span>
                                <Input
                                    type="text"
                                    value={editValues.privateLandArea}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                                        setEditValues(prev => ({ ...prev, privateLandArea: raw }));
                                    }}
                                    className="h-9 bg-white text-right font-bold text-slate-900"
                                />
                            </label>
                            <label className="space-y-1">
                                <span className="text-xs opacity-80">국공유지</span>
                                <Input
                                    type="text"
                                    value={editValues.publicLandArea}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                                        setEditValues(prev => ({ ...prev, publicLandArea: raw }));
                                    }}
                                    className="h-9 bg-white text-right font-bold text-slate-900"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t border-slate-100 bg-slate-50 p-4">
                    <DialogClose asChild>
                        <button
                            type="button"
                            className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"
                        >
                            <X className="h-4 w-4" />
                            취소
                        </button>
                    </DialogClose>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                    >
                        <Check className="h-4 w-4" />
                        저장
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
