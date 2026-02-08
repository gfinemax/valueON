export function parseKoreanMoney(input: string): number {
    if (!input) return 0;

    // Remove commas and spaces
    const cleanInput = input.replace(/,/g, "").replace(/\s/g, "");

    // Check if it's just a number
    if (!isNaN(Number(cleanInput))) {
        return Number(cleanInput);
    }

    let total = 0;
    let currentNumStr = "";

    const units: { [key: string]: number } = {
        "조": 1000000000000,
        "억": 100000000,
        "천만": 10000000, // Not standard, but '천만원' usage
        "백만": 1000000,
        "십만": 100000,
        "만": 10000,
        "천": 1000,
        "백": 100,
        "십": 10,
    };

    // Naive parser: split by units
    // usage: "1억 5000만원" -> 150000000

    // Better approach for simple cases like "1000만원", "1.5억"
    // Find the last unit and multiply

    // Let's iterate and sum up
    for (let i = 0; i < cleanInput.length; i++) {
        const char = cleanInput[i];
        if (/[0-9.]/.test(char)) {
            currentNumStr += char;
        } else {
            // It's a unit char?
            // Check for '만', '억', '조'
            // '원' ignores
            if (char === '원') continue;

            const val = units[char];
            if (val) {
                // If currentNumStr empty, maybe it was "2억3천" -> 2(억) -> 3(천)
                // detailed parsing is complex.

                // Simple heuristic: Only support standard "NumberUnit" pattern pairs, or just "NumberUnit".
                // e.g. "1000만"

                const num = parseFloat(currentNumStr || "1"); // "만원" implies 1만원
                total += num * val;
                currentNumStr = "";
            }
        }
    }

    // If there is leftover number (e.g. "1억 5000") logic gets tricky.
    // Standard convention: "1억 5000" usually means 1억 5000(만) or 1억 5000(원) ?
    // In context of real estate "1억 5000" usually means 1억 5000만원.
    // But strict parser might treat leftovers as 'won'.
    // Let's stick to explicit units for now, or just add leftover as won.

    if (currentNumStr) {
        total += parseFloat(currentNumStr);
    }

    return total;
}

// Special case handler for common "1000만원" input where user types "1000만"
// This function can be improved over time.

export function formatKoreanCurrency(amount: number): string {
    if (amount === 0) return "0";

    const units = [
        { name: "조", value: 1000000000000 },
        { name: "억", value: 100000000 },
        { name: "만", value: 10000 },
        { name: "", value: 1 },
    ];

    let remaining = amount;
    let result = "";

    for (const unit of units) {
        if (remaining >= unit.value) {
            const unitVal = Math.floor(remaining / unit.value);
            if (unitVal > 0) {
                // Add space if there is already content
                if (result.length > 0) result += " ";
                // Format the number part with commas (e.g. 1,050)
                result += `${new Intl.NumberFormat("ko-KR").format(unitVal)}${unit.name}`;
                remaining %= unit.value;
            }
        }
    }

    return result;
}
