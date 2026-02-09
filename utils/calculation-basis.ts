import { CostItem } from '@/types';

type CalculationBasis = CostItem['calculationBasis'];

/**
 * 항목 이름을 분석하여 최적의 계산 기준을 추천합니다.
 * @param itemName 비용 항목 이름
 * @param categoryId 카테고리 ID (옵션)
 * @returns 추천 계산 기준
 */
export function recommendCalculationBasis(
    itemName: string,
    categoryId?: string
): CalculationBasis {
    const name = itemName.toLowerCase();

    // 대지평당 (토지 관련)
    if (
        name.includes('토지') ||
        name.includes('매입') ||
        name.includes('국유지') ||
        name.includes('지주') ||
        categoryId === 'land'
    ) {
        return 'per_site_pyung';
    }

    // 연면적평당 (건축/공사 관련)
    if (
        name.includes('공사') ||
        name.includes('건축') ||
        name.includes('설계') ||
        name.includes('감리') ||
        name.includes('철거') ||
        name.includes('토목') ||
        name.includes('인입') ||
        categoryId === 'construction'
    ) {
        return 'per_floor_pyung';
    }

    // 세대당 (분양/운영 관련)
    if (
        name.includes('분양') ||
        name.includes('m/h') ||
        name.includes('모델하우스') ||
        name.includes('광고') ||
        name.includes('입주') ||
        name.includes('운영') ||
        name.includes('운영비') ||
        categoryId === 'sales'
    ) {
        return 'per_unit';
    }

    // 기본값: 고정
    return 'fixed';
}

/**
 * 계산 기준에 해당하는 한글 레이블을 반환합니다.
 */
export function getBasisLabel(basis: CalculationBasis): string {
    switch (basis) {
        case 'per_site_pyung': return '대지평당';
        case 'per_floor_pyung': return '연면적평당';
        case 'per_unit': return '세대당';
        case 'mix_linked': return '평형연동';
        default: return '고정';
    }
}
