export const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string; bar: string }> = {
    '토지비': {
        border: 'border-l-emerald-500',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        bar: 'bg-emerald-500'
    },
    '공사비': {
        border: 'border-l-blue-500',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        bar: 'bg-blue-500'
    },
    '인허가비': {
        border: 'border-l-purple-500',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        bar: 'bg-purple-500'
    },
    '부(분)담금': {
        border: 'border-l-amber-500',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        bar: 'bg-amber-500'
    },
    '분양제비용': {
        border: 'border-l-pink-500',
        bg: 'bg-pink-50',
        text: 'text-pink-700',
        bar: 'bg-pink-500'
    },
    '기타개발비': {
        border: 'border-l-cyan-500',
        bg: 'bg-cyan-50',
        text: 'text-cyan-700',
        bar: 'bg-cyan-500'
    },
    '보존등기비': {
        border: 'border-l-indigo-500',
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        bar: 'bg-indigo-500'
    },
    '금융비용': {
        border: 'border-l-orange-500',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        bar: 'bg-orange-500'
    },
    '기타': {
        border: 'border-l-slate-500',
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        bar: 'bg-slate-500'
    },
};

export const getCategoryColor = (title: string) => CATEGORY_COLORS[title] || CATEGORY_COLORS['기타'];
