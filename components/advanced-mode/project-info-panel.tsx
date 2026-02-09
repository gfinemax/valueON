"use client";

import { useState } from "react";
import { Pencil, Check, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProjectTarget } from "@/types";

interface ProjectInfoPanelProps {
    projectTarget: ProjectTarget;
    onUpdate: (field: keyof ProjectTarget, value: number) => void;
}

export function ProjectInfoPanel({ projectTarget, onUpdate }: ProjectInfoPanelProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({
        totalLandArea: projectTarget.totalLandArea.toString(),
        totalFloorArea: projectTarget.totalFloorArea.toString(),
        totalHouseholds: projectTarget.totalHouseholds.toString(),
    });

    const handleStartEdit = () => {
        setEditValues({
            totalLandArea: projectTarget.totalLandArea.toString(),
            totalFloorArea: projectTarget.totalFloorArea.toString(),
            totalHouseholds: projectTarget.totalHouseholds.toString(),
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleSave = () => {
        const landArea = parseFloat(editValues.totalLandArea.replace(/,/g, '')) || 0;
        const floorArea = parseFloat(editValues.totalFloorArea.replace(/,/g, '')) || 0;
        const households = parseInt(editValues.totalHouseholds.replace(/,/g, ''), 10) || 0;

        if (landArea !== projectTarget.totalLandArea) {
            onUpdate('totalLandArea', landArea);
        }
        if (floorArea !== projectTarget.totalFloorArea) {
            onUpdate('totalFloorArea', floorArea);
        }
        if (households !== projectTarget.totalHouseholds) {
            onUpdate('totalHouseholds', households);
        }

        setIsEditing(false);
    };

    const formatNumber = (val: number) => new Intl.NumberFormat("ko-KR").format(val);

    const infoItems = [
        {
            label: '대지면적',
            value: projectTarget.totalLandArea,
            unit: '평',
            key: 'totalLandArea' as const,
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            icon: '🌍',
        },
        {
            label: '연면적',
            value: projectTarget.totalFloorArea,
            unit: '평',
            key: 'totalFloorArea' as const,
            color: 'bg-blue-50 text-blue-700 border-blue-200',
            icon: '🏗️',
        },
        {
            label: '총세대수',
            value: projectTarget.totalHouseholds,
            unit: '세대',
            key: 'totalHouseholds' as const,
            color: 'bg-purple-50 text-purple-700 border-purple-200',
            icon: '🏠',
        },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-700">프로젝트 개요</h3>
                </div>
                {!isEditing ? (
                    <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-slate-50"
                    >
                        <Pencil className="w-3 h-3" />
                        수정
                    </button>
                ) : (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-slate-50"
                        >
                            <X className="w-3 h-3" />
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-1 text-xs text-white bg-blue-600 hover:bg-blue-700 transition-colors px-3 py-1 rounded"
                        >
                            <Check className="w-3 h-3" />
                            저장
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-3">
                {infoItems.map((item) => (
                    <div
                        key={item.key}
                        className={`rounded-lg border p-3 ${item.color} transition-all`}
                    >
                        <div className="flex items-center gap-1 mb-1">
                            <span className="text-sm">{item.icon}</span>
                            <span className="text-xs font-medium opacity-80">{item.label}</span>
                        </div>
                        {isEditing ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                    <Input
                                        type="text"
                                        value={editValues[item.key]}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/[^0-9.]/g, '');
                                            setEditValues(prev => ({ ...prev, [item.key]: raw }));
                                        }}
                                        className="h-8 text-right text-lg font-bold bg-white border-slate-300"
                                    />
                                    <span className="text-sm font-medium whitespace-nowrap">{item.unit}</span>
                                </div>
                                {/* Special UI for Land Area Breakdown */}
                                {item.key === 'totalLandArea' && (
                                    <div className="space-y-1 pt-1 border-t border-emerald-200/50">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="opacity-70">사유지</span>
                                            <input
                                                type="text"
                                                className="w-16 h-6 text-right bg-white/50 border border-emerald-200 rounded px-1 font-medium text-emerald-800 focus:outline-none focus:border-emerald-400"
                                                defaultValue={projectTarget.privateLandArea || 0}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                                                    onUpdate('privateLandArea', val);
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="opacity-70">국공유지</span>
                                            <input
                                                type="text"
                                                className="w-16 h-6 text-right bg-white/50 border border-emerald-200 rounded px-1 font-medium text-emerald-800 focus:outline-none focus:border-emerald-400"
                                                defaultValue={projectTarget.publicLandArea || 0}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                                                    onUpdate('publicLandArea', val);
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-bold">{formatNumber(item.value)}</span>
                                    <span className="text-sm font-medium">{item.unit}</span>
                                </div>
                                {/* Display breakdown for Land Area */}
                                {item.key === 'totalLandArea' && (projectTarget.privateLandArea || projectTarget.publicLandArea) && (
                                    <div className="mt-1 pt-1 border-t border-emerald-200/50 flex flex-col gap-0.5">
                                        <div className="flex justify-between text-[10px] opacity-80">
                                            <span>사유지</span>
                                            <span className="font-medium">{formatNumber(projectTarget.privateLandArea || 0)}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] opacity-80">
                                            <span>국공유지</span>
                                            <span className="font-medium">{formatNumber(projectTarget.publicLandArea || 0)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

        </div>
    );
}
