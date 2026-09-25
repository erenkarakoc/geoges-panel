/**
 * The key a new flow is filed under (TASK-0119, migration 0045).
 *
 * The owner types a name in Turkish; the database wants a key of lower-case letters, digits and
 * hyphens. So the name is turned into one here — Turkish letters become their closest plain letters,
 * because a key is an address and an address with "ş" in it is a nuisance for the rest of its life —
 * and a key already taken gets a number after it rather than quietly overwriting a flow.
 */

const TURKISH: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

/** The key's own rule, as the database writes it. */
export const FLOW_KEY = /^[a-z][a-z0-9-]{2,60}$/;

/**
 * Addresses the flows screen uses for itself. A flow may not take one of them, or its designer would
 * open a tab instead of the flow.
 */
export const RESERVED_FLOW_KEYS: readonly string[] = ["templates", "new", "runs"];

export function flowKeyOf(name: string, taken: readonly string[] = []): string {
  const reserved = [...taken, ...RESERVED_FLOW_KEYS];
  const plain = [...name.toLocaleLowerCase("tr-TR")]
    .map((letter) => TURKISH[letter] ?? letter)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);

  // A name with nothing usable in it still gets an address; "akis" is what a flow is called here.
  const base = FLOW_KEY.test(plain) ? plain : `akis-${plain}`.replace(/-+$/, "").slice(0, 56);
  const start = FLOW_KEY.test(base) ? base : "akis";
  if (!reserved.includes(start)) return start;

  for (let counter = 2; counter < 1000; counter += 1) {
    const candidate = `${start}-${counter}`;
    if (!reserved.includes(candidate)) return candidate;
  }
  throw new Error(`no free key left for ${name}`);
}

/** What a brand new flow says: a start, an end, and a person starting it by hand. */
export function starterDefinition(): Record<string, unknown> {
  return {
    trigger: { type: "manual" },
    start: "start_1",
    steps: [
      { id: "start_1", type: "start", next: "end_1" },
      { id: "end_1", type: "end" },
    ],
  };
}
