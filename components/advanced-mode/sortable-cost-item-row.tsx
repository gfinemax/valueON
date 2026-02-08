"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CostItemRow, CostItemRowProps } from "./cost-item-row";

export function SortableCostItemRow(props: CostItemRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1, // Make it semi-transparent while dragging
        zIndex: isDragging ? 50 : "auto", // Ensure it's above other items
        position: 'relative' as 'relative',
    };

    return (
        <div ref={setNodeRef} style={style}>
            <CostItemRow
                {...props}
                dragAttributes={attributes}
                dragListeners={listeners}
            />
        </div>
    );
}
