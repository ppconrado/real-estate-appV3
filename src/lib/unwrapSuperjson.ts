/**
 * Unwraps SuperJSON envelope from tRPC responses
 * SuperJSON wraps data in {json: data, meta: metadata} format
 * This utility extracts the actual data from the envelope
 */
export function unwrapSuperjson<T>(
  data: T | { json: T; meta?: unknown }
): T | null {
  if (!data) return null;

  if (typeof data === "object" && data !== null && "json" in data) {
    const jsonValue = (data as { json: T }).json;
    return jsonValue ?? null;
  }

  return data as T;
}
