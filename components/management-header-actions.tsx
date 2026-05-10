"use client";

import type { ReactNode } from "react";
import { Eye, Pencil, Plus } from "lucide-react";

interface ManagementHeaderActionsProps {
    isEditMode: boolean;
    onEditModeChange: (value: boolean) => void;
    addLabel?: string;
    onAdd?: () => void;
    canAdd?: boolean;
    addTitle?: string;
    addDisabledTitle?: string;
    addIcon?: ReactNode;
    secondaryActions?: ReactNode;
}

export function ManagementHeaderActions({
    isEditMode,
    onEditModeChange,
    addLabel,
    onAdd,
    canAdd = true,
    addTitle = "추가",
    addDisabledTitle = "편집 모드에서 추가할 수 있습니다",
    addIcon,
    secondaryActions,
}: ManagementHeaderActionsProps) {
    const addEnabled = Boolean(onAdd) && isEditMode && canAdd;

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={() => onEditModeChange(!isEditMode)}
                aria-pressed={isEditMode}
                title={isEditMode ? "보기 모드로 전환" : "편집 모드로 전환"}
                className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold shadow-sm transition-colors ${
                    isEditMode
                        ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
            >
                {isEditMode ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="hidden sm:inline">{isEditMode ? "편집 모드" : "보기 모드"}</span>
            </button>

            {onAdd && addLabel && (
                <button
                    type="button"
                    onClick={onAdd}
                    disabled={!addEnabled}
                    title={addEnabled ? addTitle : addDisabledTitle}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                >
                    {addIcon ?? <Plus className="h-4 w-4" />}
                    <span className="hidden sm:inline">{addLabel}</span>
                </button>
            )}

            {secondaryActions}
        </div>
    );
}
