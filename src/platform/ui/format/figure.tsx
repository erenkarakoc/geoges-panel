/**
 * A figure and the words around it.
 *
 * The design rules put numbers in Geist Mono with equal-width digits (§4), and that has to mean
 * the number only: a unit like "panel" or a symbol like ₺ inside the mono run reads as code, and
 * Geist Mono has no ₺ glyph at all, so the symbol falls back to another font and sits badly
 * against the digits. `value` is the number, `unit` is everything else.
 *
 * The shared money component of §4 will build on this when the finance screens arrive; until
 * then this is the one place where "how a number is set" lives.
 */
export function Figure({
  value,
  unit,
  className,
}: {
  value: string;
  unit?: string;
  className?: string;
}) {
  return (
    <span className={className}>
      <span className="font-mono tabular-nums">{value}</span>
      {unit ? <span className="ms-1 font-sans">{unit}</span> : null}
    </span>
  );
}
