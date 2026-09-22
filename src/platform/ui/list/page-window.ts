/**
 * Page numbers a list shows around the current page (SCREEN_PATTERNS section 1, D-219): every
 * page when there are at most seven, otherwise the first, the last and the neighbours of the
 * current page, with `null` where pages are skipped.
 */
export function pageWindow(current: number, last: number): (number | null)[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const pages = new Set(
    [1, last, current - 1, current, current + 1].filter((p) => p >= 1 && p <= last),
  );
  const out: (number | null)[] = [];
  let previous = 0;
  for (const p of [...pages].sort((a, b) => a - b)) {
    if (previous && p - previous > 1) out.push(null);
    out.push(p);
    previous = p;
  }
  return out;
}
