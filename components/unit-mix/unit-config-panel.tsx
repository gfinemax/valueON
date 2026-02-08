"use client";

import { UnitType, AnalysisInputs } from "@/types";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";

interface UnitConfigPanelProps {
    unitTypes: UnitType[];
    onUpdateUnitTypeTotalUnits: (unitTypeId: string, totalUnits: number) => void;
}

export function UnitConfigPanel({ unitTypes, onUpdateUnitTypeTotalUnits }: UnitConfigPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    const apartmentTypes = unitTypes.filter(u => u.category === 'APARTMENT');
    const rentalTypes = unitTypes.filter(u => u.category === 'RENTAL');

    const totalApartment = apartmentTypes.reduce((sum, u) => sum + (u.totalUnits || 0), 0);
    const totalRental = rentalTypes.reduce((sum, u) => sum + (u.totalUnits || 0), 0);
    const grandTotal = totalApartment + totalRental;

    return (
        <div className="bg-slate-100 rounded-lg overflow-hidden mb-4">
            {/* Header - Always Visible */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-200 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-700">세대 배분 설정</span>
                    <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded">
                        총 {grandTotal}세대
                    </span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
            </button>

            {/* Expandable Content */}
            {isOpen && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Apartment Types */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                                아파트
                                <span className="text-slate-400">({totalApartment}세대)</span>
                            </h4>
                            <div className="space-y-2">
                                {apartmentTypes.map(ut => (
                                    <div key={ut.id} className="flex items-center gap-2 bg-white rounded p-2">
                                        <span className="text-sm font-medium text-slate-700 w-20">{ut.name}</span>
                                        <span className="text-xs text-slate-400">{ut.supplyArea}평</span>
                                        <div className="flex-1" />
                                        <Input
                                            type="number"
                                            className="w-20 h-7 text-center text-sm"
                                            value={ut.totalUnits || 0}
                                            onChange={(e) => onUpdateUnitTypeTotalUnits(ut.id, Number(e.target.value))}
                                        />
                                        <span className="text-xs text-slate-500">세대</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rental Types */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                                임대주택
                                <span className="text-slate-400">({totalRental}세대)</span>
                            </h4>
                            <div className="space-y-2">
                                {rentalTypes.map(ut => (
                                    <div key={ut.id} className="flex items-center gap-2 bg-white rounded p-2">
                                        <span className="text-sm font-medium text-slate-700 w-20">{ut.name}</span>
                                        <span className="text-xs text-slate-400">{ut.supplyArea}평</span>
                                        <div className="flex-1" />
                                        <Input
                                            type="number"
                                            className="w-20 h-7 text-center text-sm"
                                            value={ut.totalUnits || 0}
                                            onChange={(e) => onUpdateUnitTypeTotalUnits(ut.id, Number(e.target.value))}
                                        />
                                        <span className="text-xs text-slate-500">세대</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-3">
                        * 세대수 변경 시 tier별 비율이 유지되며 자동 재분배됩니다.
                    </p>
                </div>
            )}
        </div>
    );
}
