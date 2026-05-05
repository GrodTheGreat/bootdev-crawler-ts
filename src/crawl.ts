export function normalizeURL(url: string): string {
  const normalized = new URL(url);
  const hostname = normalized.hostname.toLowerCase();
  let path = normalized.pathname.toLowerCase();
  if (path[path.length - 1] === "/") path = path.slice(0, -1);
  return hostname + path;
}
