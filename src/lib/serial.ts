/**
 * A product's sequential id, zero-padded for display: 1 -> "001".
 *
 * Lives in its own module so both Server and Client Components can import it -
 * a plain function exported from a "use client" file cannot be called on the
 * server.
 */
export function serialLabel(serial: number): string {
  return String(serial).padStart(3, "0");
}

/** Does a product's serial match a typed query like "1", "01", or "001"? */
export function serialMatches(serial: number, query: string): boolean {
  const digits = query.replace(/\D/g, "");
  if (!digits) return false;
  return String(serial) === String(Number(digits)) || serialLabel(serial) === digits;
}
