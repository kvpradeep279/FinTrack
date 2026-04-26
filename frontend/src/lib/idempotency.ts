/**
 * Idempotency key management.
 *
 * A UUID v4 key is generated when the user first touches the form and stored
 * in sessionStorage under a fixed key. On successful submission the key is
 * cleared. On network failure / page refresh the stored key is reused, so
 * retrying the same form submission never creates a duplicate expense.
 */
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "expense_idempotency_key";

export function getOrCreateIdempotencyKey(): string {
  if (typeof window === "undefined") return uuidv4(); // SSR guard

  const existing = sessionStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const fresh = uuidv4();
  sessionStorage.setItem(STORAGE_KEY, fresh);
  return fresh;
}

export function clearIdempotencyKey(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
