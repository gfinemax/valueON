"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CostCategoryCard } from "./cost-category-card";
import { CostCategory, ProjectTarget, UnitAllocation, UnitType, CostItem } from "@/types";

interface SortableCostCategoryCardProps {
    category: CostCategory;
    projectTarget: ProjectTarget;
    unitAllocations?: UnitAllocation[];
    unitTypes?: UnitType[];
    totalExpense?: number;
    onUpdateItem: (catId: string, itemId: string, val: number) => void;
    onUpdateItemBasis: (catId: string, itemId: string, basis: CostItem['calculationBasis']) => void;
    onUpdateItemCondition?: (catId: string, itemId: string, allocationId: string, amount: number) => void;
    onUpdateItemRate: (catId: string, itemId: string, rate: number) => void;
    onUpdateItemMemo: (catId: string, itemId: string, memo: string) => void;
    onAddItem: (catId: string, name: string, amount: number) => void;
    onRemoveCategory: (id: string) => void;
    onRemoveItem: (catId: string, itemId: string) => void;
    onAddSubItem: (catId: string, itemId: string, name: string, amount: number) => void;
    onUpdateSubItem: (catId: string, itemId: string, subItemId: string, field: 'name' | 'amount', value: string | number) => void;
    onRemoveSubItem: (catId: string, itemId: string, subItemId: string) => void;
    onUpdateCategoryMemo: (catId: string, memo: string) => void;
    onUpdateSubItemMemo: (catId: string, itemId: string, subItemId: string, memo: string) => void;
    onUpdateItemName: (catId: string, itemId: string, newName: string) => void;
    onUpdateCategoryTitle: (catId: string, newTitle: string) => void;
    reorderCategoryItem: (catId: string, activeId: string, overId: string) => void;
    isExpanded?: boolean;
    highlightItemId?: string;
    allowItemMoving?: boolean;
    allowCategoryAdding?: boolean;
    allowItemDeleting?: boolean;
}

export function SortableCostCategoryCard(props: SortableCostCategoryCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
        position: 'relative' as 'relative',
    };

    return (
        <div ref={setNodeRef} style={style}>
            <CostCategoryCard
                {...props}
                dragAttributes={attributes}
                dragListeners={props.allowItemMoving ? listeners : undefined}
            />
        </div>
    );
}
