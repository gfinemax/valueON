export const CATEGORY_COLORS: Record<string, string> = {
    '토지비': '#10b981',   // emerald-500
    '공사비': '#3b82f6',   // blue-500
    '인허가비': '#a855f7', // purple-500
    '부(분)담금': '#f59e0b',   // amber-500
    '분양제비용': '#ec4899', // pink-500
    '기타개발비': '#06b6d4', // cyan-500
    '보존등기비': '#6366f1', // indigo-500
    '금융비용': '#f97316', // orange-500
    '기타': '#64748b',     // slate-500
    // Aliases for legacy naming
    '부담금': '#f59e0b',
    '판매비(분양)': '#ec4899',
    '일반관리비': '#06b6d4',
};

export const DEFAULT_CHART_COLORS = [
    '#d97757', '#8c9c8a', '#e3c086', '#6b7280', '#c2b280',
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'
];

export function getCategoryHexColor(title: string, index?: number): string {
    if (CATEGORY_COLORS[title]) {
        return CATEGORY_COLORS[title];
    }

    // Fuzzy match for common keywords if exact match fails
    if (title.includes('토지')) return CATEGORY_COLORS['토지비'];
    if (title.includes('공사')) return CATEGORY_COLORS['공사비'];
    if (title.includes('인허가')) return CATEGORY_COLORS['인허가비'];
    if (title.includes('금융')) return CATEGORY_COLORS['금융비용'];
    if (title.includes('분양')) return CATEGORY_COLORS['분양제비용'];
    if (title.includes('부담금') || title.includes('분담금')) return CATEGORY_COLORS['부담금'];
    if (title.includes('관리')) return CATEGORY_COLORS['일반관리비'];

    if (index !== undefined) {
        return DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length];
    }

    return CATEGORY_COLORS['기타'];
}
