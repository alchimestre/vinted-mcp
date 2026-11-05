import { VINTED_COUNTRIES } from "../vinted-core/models/country";

const RESOURCE_PATHS = {
  items: /^\/items\/(\d+)(?:-[^/]*)?\/?$/,
  member: /^\/member\/(\d+)(?:-[^/]*)?\/?$/
};

export function parseVintedUrl(url: string, resource: keyof typeof RESOURCE_PATHS): { id: number; country: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port) {
    return null;
  }
  const match = parsed.pathname.match(RESOURCE_PATHS[resource]);
  const id = match ? Number(match[1]) : 0;
  if (!Number.isSafeInteger(id) || id < 1) {
    return null;
  }
  const hostname = parsed.hostname.replace(/^www\./, "");
  for (const code in VINTED_COUNTRIES) {
    if (VINTED_COUNTRIES[code].domain === `www.${hostname}`) {
      return { id, country: code };
    }
  }
  return null;
}
