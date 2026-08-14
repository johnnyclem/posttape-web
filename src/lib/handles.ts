import { slugify } from "./utils";

/** FR-A-02 — reserved + offensive handles. Blocked at claim time. */
export const RESERVED_HANDLES = new Set([
  "admin",
  "administrator",
  "api",
  "app",
  "abuse",
  "about",
  "account",
  "accounts",
  "activity",
  "album",
  "albums",
  "auth",
  "blog",
  "copyright",
  "design",
  "dev",
  "dmca",
  "docs",
  "explore",
  "ftp",
  "help",
  "legal",
  "library",
  "login",
  "logout",
  "mail",
  "me",
  "mod",
  "moderator",
  "new",
  "notifications",
  "null",
  "official",
  "owner",
  "posttape",
  "privacy",
  "root",
  "settings",
  "song",
  "songs",
  "staff",
  "static",
  "support",
  "sys",
  "system",
  "takedown",
  "tape",
  "terms",
  "transparency",
  "u",
  "undefined",
  "www",
  "you",
  "nazi",
  "hitler",
  "rape",
  "porn",
  "slave",
]);

export function normalizeHandle(raw: string): string {
  return slugify(raw).replace(/^-+|-+$/g, "").slice(0, 24);
}

export function validateHandle(raw: string): { ok: true; handle: string } | { ok: false; error: string } {
  const handle = normalizeHandle(raw);
  if (handle.length < 2) return { ok: false, error: "Handle must be at least 2 characters." };
  if (handle.length > 24) return { ok: false, error: "Handle must be 24 characters or fewer." };
  if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(handle) && !/^[a-z]{2,24}$/.test(handle)) {
    return { ok: false, error: "Start with a letter. Use letters, numbers, and hyphens." };
  }
  if (handle.includes("--")) return { ok: false, error: "No consecutive hyphens." };
  if (RESERVED_HANDLES.has(handle)) return { ok: false, error: "That handle is reserved." };
  return { ok: true, handle };
}

export function nextAvailableHandle(base: string, taken: (h: string) => boolean): string {
  const checked = validateHandle(base);
  let handle = checked.ok ? checked.handle : "desk";
  if (RESERVED_HANDLES.has(handle) || taken(handle)) {
    let n = 2;
    const stem = RESERVED_HANDLES.has(handle) ? "desk" : handle;
    while (taken(`${stem}${n}`) || RESERVED_HANDLES.has(`${stem}${n}`)) n += 1;
    handle = `${stem}${n}`;
  }
  return handle;
}

/** @handle mentions in a comment body. */
export function extractMentions(body: string): string[] {
  const found = body.match(/@([a-z][a-z0-9-]{1,23})/gi) ?? [];
  return [...new Set(found.map((m) => m.slice(1).toLowerCase()))];
}
