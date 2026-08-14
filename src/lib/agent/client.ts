/**
 * Thin client for the versioned Agent/JSON API in johnnyclem/posttape
 * (`/api/v1/*`). This prototype does not ship the Agent. When no API base
 * is configured, every call returns a local-prototype result and never
 * pretends a desktop freeze ran.
 */

export const API_VERSION = 1;
export const MIN_AGENT_VERSION = "1.0.0";

const STORAGE_KEY = "posttape-api-base";

export type AgentCapability =
  | "chunked-push"
  | "freeze-plan"
  | "freeze-verify"
  | "environment-scan"
  | "reference-bounce";

export interface ApiVersionInfo {
  api: number;
  minAgentVersion: string;
  manifestSchemaVersion: number;
  capabilities: AgentCapability[];
}

export interface PairStartResult {
  deviceCode: string;
  userCode: string;
  expiresAt: string;
  intervalSec: number;
  verificationUri: string;
  source: "remote" | "local";
}

export type ProbeResult =
  | { ok: true; info: ApiVersionInfo; base: string }
  | { ok: false; base: string; error: string };

export function getApiBase(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY)?.replace(/\/+$/, "") ?? "";
  } catch {
    return "";
  }
}

export function setApiBase(url: string): string {
  const cleaned = url.trim().replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    try {
      if (cleaned) window.localStorage.setItem(STORAGE_KEY, cleaned);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  return cleaned;
}

export async function probeApi(base = getApiBase()): Promise<ProbeResult> {
  const trimmed = base.replace(/\/+$/, "");
  if (!trimmed) {
    return { ok: false, base: "", error: "No API base — running as the local prototype." };
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${trimmed}/api/v1/version`, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(t);
    if (!res.ok) {
      return { ok: false, base: trimmed, error: `HTTP ${res.status}` };
    }
    const info = (await res.json()) as ApiVersionInfo;
    if (typeof info.api !== "number") {
      return { ok: false, base: trimmed, error: "Unexpected version payload." };
    }
    return { ok: true, info, base: trimmed };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Timed out"
          : err.message
        : "Unreachable";
    return { ok: false, base: trimmed, error: message };
  }
}

export async function startRemotePair(
  base: string,
  input: { machineName: string; platform?: string; agentVersion?: string },
): Promise<PairStartResult | null> {
  try {
    const res = await fetch(`${base.replace(/\/+$/, "")}/api/v1/agent/pair/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        machineName: input.machineName,
        platform: input.platform ?? "macos",
        agentVersion: input.agentVersion ?? "0.0.0",
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Omit<PairStartResult, "source">;
    return { ...data, source: "remote" };
  } catch {
    return null;
  }
}

export function localUserCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = (n: number) =>
    Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `${pick(4)}-${pick(4)}`;
}

export function localDeviceCode(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}
