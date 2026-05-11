"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { formatKrwMan } from "@/utils/currency";

interface LandType {
    id: string;
    name: string;
    area: number;      // 면적 (평)
    unitPrice: number; // 단가 (원/평)
}

interface LandPurchaseTemplateProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemName: string;
    totalLandArea: number;
    existingSubItems?: { id: string; name: string; amount: number; note?: string }[];
    onSave: (subItems: { name: string; amount: number; note: string }[]) => void;
}

export interface LandPurchaseParams {
    landTypes: LandType[];
}

const DEFAULT_LAND_TYPES: Omit<LandType, 'id'>[] = [
    { name: '국공유지', area: 0, unitPrice: 0 },
    { name: '사유지', area: 0, unitPrice: 0 },
];

export function LandPurchaseTemplate({
    open,
    onOpenChange,
    itemName,
    totalLandArea,
    existingSubItems,
    onSave,
}: LandPurchaseTemplateProps) {
    const [landTypes, setLandTypes] = useState<LandType[]>([]);

    // Initialize from existing sub-items or defaults
    useEffect(() => {
        if (open) {
            if (existingSubItems && existingSubItems.length > 0) {
                // Parse existing sub-items
                const parsed = existingSubItems.map(sub => {
                    let area = 0;
                    let unitPrice = 0;
                    let name = sub.name;

                    // 1. Try to parse from NOTE
                    if (sub.note) {
                        const match = sub.note.match(/([0-9,]+)평\s*×\s*([0-9,]+)만원\/평/);
                        if (match) {
                            area = parseInt(match[1].replace(/,/g, ''), 10) || 0;
                            unitPrice = (parseInt(match[2].replace(/,/g, ''), 10) || 0) * 10000;
                        }
                    }

                    // 2. If not found in note, try to parse from NAME (format: "Name (Area평, 평당 Price만원)")
                    if (area === 0) {
                        const matchName = sub.name.match(/(.*)\s*\(([0-9,]+)평,\s*평당\s*([0-9,]+)만원\)/);
                        if (matchName) {
                            name = matchName[1].trim();
                            area = parseInt(matchName[2].replace(/,/g, ''), 10) || 0;
                            unitPrice = (parseInt(matchName[3].replace(/,/g, ''), 10) || 0) * 10000;
                        }
                    }

                    // 3. Fallback: Estimate from amount
                    if (area === 0 && sub.amount > 0 && totalLandArea > 0) {
                        area = Math.round(sub.amount / 30000000); // rough estimate
                    }

                    return {
                        id: sub.id,
                        name: name,
                        area,
                        unitPrice,
                    };
                });
                setLandTypes(parsed);
            } else {
                // Initialize with defaults
                setLandTypes(DEFAULT_LAND_TYPES.map((lt, idx) => ({
                    ...lt,
                    id: `land_${idx}_${Date.now()}`,
                })));
            }
        }
    }, [open, existingSubItems, totalLandArea]);

    const totalArea = landTypes.reduce((sum, lt) => sum + lt.area, 0);
    const totalAmount = landTypes.reduce((sum, lt) => sum + (lt.area * lt.unitPrice), 0);
    const areaRemaining = totalLandArea - totalArea;

    const handleUpdate = (id: string, field: keyof LandType, value: string | number) => {
        setLandTypes(prev =>
            prev.map(lt =>
                lt.id === id ? { ...lt, [field]: value } : lt
            )
        );
    };

    const handleAddLandType = () => {
        setLandTypes(prev => [
            ...prev,
            { id: `land_${Date.now()}`, name: '새 토지유형', area: 0, unitPrice: 0 }
        ]);
    };

    const handleRemoveLandType = (id: string) => {
        setLandTypes(prev => prev.filter(lt => lt.id !== id));
    };

    const handleSave = () => {
        // Convert to sub-items format with detailed name
        const subItems = landTypes
            .filter(lt => lt.area > 0 || lt.unitPrice > 0)
            .map(lt => {
                const areaStr = lt.area.toLocaleString();
                const priceStr = (lt.unitPrice / 10000).toLocaleString();
                return {
                    name: `${lt.name} (${areaStr}평, 평당 ${priceStr}만원)`,
                    amount: lt.area * lt.unitPrice,
                    note: `${areaStr}평 × ${priceStr}만원/평`,
                };
            });

        onSave(subItems);
        onOpenChange(false);
    };

    const formatMoney = (val: number) =>
        new Intl.NumberFormat("ko-KR").format(val);

    const formatCompact = (val: number) => formatKrwMan(val);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-xl">🏞️</span>
                        토지매입비 계산기
                    </DialogTitle>
                    <DialogDescription>
                        <span className="font-medium text-slate-700">{itemName}</span>을 토지유형별로 분리 계산합니다.
                        <br />
                        <span className="text-xs text-slate-500">총 대지면적: {formatMoney(totalLandArea)}평</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 px-1">
                        <div className="col-span-3">토지유형</div>
                        <div className="col-span-3 text-right">면적 (평)</div>
                        <div className="col-span-3 text-right">단가 (만원/평)</div>
                        <div className="col-span-2 text-right">소계</div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Land Type Rows */}
                    {landTypes.map(lt => {
                        const subtotal = lt.area * lt.unitPrice;
                        return (
                            <div key={lt.id} className="grid grid-cols-12 gap-2 items-center">
                                {/* Name */}
                                <div className="col-span-3">
                                    <Input
                                        value={lt.name}
                                        onChange={(e) => handleUpdate(lt.id, 'name', e.target.value)}
                                        className="h-9 text-sm"
                                        placeholder="토지유형"
                                    />
                                </div>
                                {/* Area */}
                                <div className="col-span-3">
                                    <Input
                                        type="text"
                                        value={lt.area === 0 ? '' : formatMoney(lt.area)}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/[^0-9]/g, '');
                                            handleUpdate(lt.id, 'area', raw === '' ? 0 : parseInt(raw, 10));
                                        }}
                                        className="h-9 text-sm text-right font-mono"
                                        placeholder="0"
                                    />
                                </div>
                                {/* Unit Price (만원) */}
                                <div className="col-span-3">
                                    <Input
                                        type="text"
                                        value={lt.unitPrice === 0 ? '' : formatMoney(lt.unitPrice / 10000)}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/[^0-9]/g, '');
                                            handleUpdate(lt.id, 'unitPrice', raw === '' ? 0 : parseInt(raw, 10) * 10000);
                                        }}
                                        className="h-9 text-sm text-right font-mono"
                                        placeholder="0"
                                    />
                                </div>
                                {/* Subtotal */}
                                <div className="col-span-2 text-right text-sm font-bold text-slate-700">
                                    {subtotal > 0 ? formatCompact(subtotal) : '-'}
                                </div>
                                {/* Delete */}
                                <div className="col-span-1 flex justify-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                                        onClick={() => handleRemoveLandType(lt.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={handleAddLandType}
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        토지유형 추가
                    </Button>
                </div>

                {/* Area Balance Check */}
                <div className={`p-3 rounded-lg border ${areaRemaining === 0 ? 'bg-green-50 border-green-200' : areaRemaining > 0 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">면적 합계</span>
                        <span className="font-bold">
                            {formatMoney(totalArea)}평 / {formatMoney(totalLandArea)}평
                        </span>
                    </div>
                    {areaRemaining !== 0 && (
                        <p className={`text-xs mt-1 ${areaRemaining > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                            {areaRemaining > 0 ? `${formatMoney(areaRemaining)}평 미입력` : `${formatMoney(Math.abs(areaRemaining))}평 초과`}
                        </p>
                    )}
                </div>

                {/* Total Preview */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100">
                    <div className="flex items-baseline justify-between">
                        <div className="text-sm text-slate-600">계산된 총액</div>
                        <div className="text-2xl font-bold text-emerald-600">
                            {formatCompact(totalAmount)}
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        = Σ(토지유형별 면적 × 단가)
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        취소
                    </Button>
                    <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                        세부항목 생성/업데이트
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
