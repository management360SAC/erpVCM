export function getUsernameFromToken(token?: string | null): string | null {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(atob(payload));
    return json.sub || null;
  } catch {
    return null;
  }
}
