// Theil–Sen slope estimator: median of slopes between all point pairs
// Returns slope per unit of x; convert to per-decade by multiplying by 10 if x is years
export function theilSenSlope(xs: number[], ys: number[]): number | null {
    const n = Math.min(xs.length, ys.length);
    if (n < 3) return null;
    const slopes: number[] = [];
    for (let i = 0; i < n; i++) {
        const x1 = xs[i]!;
        const y1 = ys[i]!;
        if (!isFinite(x1) || !isFinite(y1)) continue;
        for (let j = i + 1; j < n; j++) {
            const x2 = xs[j]!;
            const y2 = ys[j]!;
            if (!isFinite(x2) || !isFinite(y2)) continue;
            const dx = x2 - x1;
            const dy = y2 - y1;
            if (dx === 0) continue;
            slopes.push(dy / dx);
        }
    }
    if (!slopes.length) return null;
    slopes.sort((a, b) => a - b);
    const mid = Math.floor(slopes.length / 2);
    if (slopes.length % 2 === 1) return slopes[mid]!;
    return (slopes[mid - 1]! + slopes[mid]!) / 2;
}
