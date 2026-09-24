/**
 * The shape of a user id. Server actions are handed ids by the browser, and an id that is not one
 * should be refused where it arrives rather than by the provider's admin API or by a failing cast
 * in the database, which answer with an error the person cannot act on.
 */
export function looksLikeUserId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
