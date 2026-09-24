/**
 * Taking a lost second factor away (TASK-0112, D-236, D-272).
 *
 * A person who signs in with a recovery code has lost the device their factor lived on, and a
 * manager's reset says the same thing about somebody else. Either way the old factor has to go, or
 * whoever holds the lost device can still sign in — and that is an act on another account, which
 * the provider only allows with an administrator's right.
 *
 * It is its own port, apart from `AuthProvider`: that one speaks for the person signed in, while
 * this one acts on an account from the server with a key the browser never sees.
 */
export interface SecondFactorAdmin {
  /** Removes every enrolled factor of one account. Returns how many were removed. */
  removeFactorsOf(userId: string): Promise<number>;
}
