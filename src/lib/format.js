export const fmt      = (n) => `S/ ${Number(n || 0).toFixed(2)}`;
export const fmtShort = (n) => n >= 1000 ? `S/ ${(n/1000).toFixed(1)}k` : `S/ ${Number(n).toFixed(0)}`;
export const calcMargin = (cost, price) => cost > 0 ? (((price - cost) / cost) * 100).toFixed(1) : '0';
