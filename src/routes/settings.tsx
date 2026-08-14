import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient, authEnabled, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getApiBase,
  probeApi,
  setApiBase,
  startRemotePair,
  type ProbeResult,
} from "@/lib/agent/client";
import { PLUGIN_CATALOG, STOCK_PLUGIN_IDS } from "@/lib/plugins";
import { DEFAULT_PREFS, usePosttape } from "@/lib/store";
import { formatRelative } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, isPending } = useCurrentUserState();
  const ensureArtist = usePosttape((s) => s.ensureArtist);
  const getEnvironment = usePosttape((s) => s.getEnvironment);
  const toggleEnvPlugin = usePosttape((s) => s.toggleEnvPlugin);
  const updateProfile = usePosttape((s) => s.updateProfile);
  const getArtist = usePosttape((s) => s.getArtist);
  const claimHandle = usePosttape((s) => s.claimHandle);
  const requestDeletion = usePosttape((s) => s.requestDeletion);
  const cancelDeletion = usePosttape((s) => s.cancelDeletion);
  const completeDeletion = usePosttape((s) => s.completeDeletion);
  const deskSessions = usePosttape((s) => s.deskSessions);
  const revokeDeskSession = usePosttape((s) => s.revokeDeskSession);
  const touchDeskSession = usePosttape((s) => s.touchDeskSession);
  const startPairing = usePosttape((s) => s.startPairing);
  const approvePairing = usePosttape((s) => s.approvePairing);
  const pairings = usePosttape((s) => s.pairings);
  const notificationPrefs = usePosttape((s) => s.notificationPrefs);
  const setNotificationPrefs = usePosttape((s) => s.setNotificationPrefs);

  const artist = user ? getArtist(user.id) : undefined;

  useEffect(() => {
    if (user) ensureArtist(user);
  }, [user, ensureArtist]);

  const env = user ? getEnvironment(user.id) : null;
  const catalog = useMemo(
    () => Object.values(PLUGIN_CATALOG).sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const [displayName, setDisplayName] = useState(artist?.displayName ?? "");
  const [bio, setBio] = useState(artist?.bio ?? "");
  const [location, setLocation] = useState(artist?.location ?? "");
  const [links, setLinks] = useState((artist?.links ?? []).join("\n"));
  const [handle, setHandle] = useState(artist?.username ?? "");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [machineName, setMachineName] = useState("Studio Mac");
  const [approveCode, setApproveCode] = useState("");
  const [apiBase, setApiBaseField] = useState("");
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [authSessions, setAuthSessions] = useState<
    Array<{ token: string; createdAt: Date | string; userAgent?: string | null; ipAddress?: string | null }>
  >([]);

  useEffect(() => {
    if (!artist) return;
    setDisplayName(artist.displayName);
    setBio(artist.bio);
    setLocation(artist.location ?? "");
    setLinks((artist.links ?? []).join("\n"));
    setHandle(artist.username);
  }, [artist]);

  useEffect(() => {
    setApiBaseField(getApiBase());
  }, []);

  useEffect(() => {
    if (!user || !authEnabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await authClient.listSessions();
        const rows = (res.data ?? []) as typeof authSessions;
        if (!cancelled) setAuthSessions(rows);
      } catch {
        if (!cancelled) setAuthSessions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isPending) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-fg-subtle">Loading…</div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-2xl">Sign in to manage your desk</h1>
          <Button asChild className="mt-6">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const prefs = notificationPrefs[user.id] ?? DEFAULT_PREFS;
  const mineSessions = deskSessions.filter((s) => s.userId === user.id);
  const pendingPair = pairings.find((p) => p.userId === user.id && p.status === "pending");
  const deletionPending = Boolean(artist?.deletedAt);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 space-y-8">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Handle, sessions, machines, and how this desk talks to the Agent API.
          </p>
        </div>

        {deletionPending && (
          <div className="rounded-[var(--radius-lg)] border border-warn/40 bg-warn/10 px-4 py-3 text-sm">
            Deletion scheduled
            {artist?.deletionDueAt ? ` for ${new Date(artist.deletionDueAt).toLocaleDateString()}` : ""}.
            Collaborative history will be anonymized after the grace period.
            <Button
              size="sm"
              variant="secondary"
              className="ml-3"
              onClick={() => {
                cancelDeletion(user.id);
                toast.success("Deletion cancelled");
              }}
            >
              Keep my account
            </Button>
          </div>
        )}

        {!artist?.handleClaimedAt && (
          <div className="rounded-[var(--radius-lg)] border border-signal/30 bg-signal/5 px-4 py-3 text-sm">
            Claim a unique handle so collaborators can find and invite you.
          </div>
        )}

        <Tabs defaultValue="profile">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="machines">Machines</TabsTrigger>
            <TabsTrigger value="notify">Notifications</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5 space-y-3">
              <h2 className="text-sm font-medium">Handle</h2>
              <p className="text-xs text-fg-muted">
                Globally unique. Reserved and offensive names are blocked.
                {artist?.handleClaimedAt
                  ? ` Claimed ${formatRelative(artist.handleClaimedAt)}.`
                  : " Not claimed yet — this one was assigned."}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="your-handle"
                  aria-label="Handle"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const res = claimHandle(user.id, handle);
                    if (res.ok) toast.success(`Handle @${res.handle} is yours`);
                    else toast.error(res.error ?? "Could not claim");
                  }}
                >
                  {artist?.handleClaimedAt ? "Rename" : "Claim"}
                </Button>
              </div>
              {artist && (
                <Link
                  to="/u/$username"
                  params={{ username: artist.username }}
                  className="text-xs text-signal hover:underline"
                >
                  @{artist.username}
                </Link>
              )}
            </section>

            <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5 space-y-3">
              <h2 className="text-sm font-medium">Profile</h2>
              <div>
                <Label htmlFor="dn">Display name</Label>
                <Input id="dn" className="mt-1" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" className="mt-1" value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="loc">Location</Label>
                <Input id="loc" className="mt-1" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="links">External links (max 5, one per line)</Label>
                <Textarea id="links" className="mt-1" value={links} onChange={(e) => setLinks(e.target.value)} />
              </div>
              <Button
                size="sm"
                onClick={() => {
                  updateProfile(user.id, {
                    displayName,
                    bio,
                    location,
                    links: links.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 5),
                  });
                  toast.success("Profile saved");
                }}
              >
                Save profile
              </Button>
            </section>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5">
              <h2 className="text-sm font-medium">Signed-in sessions</h2>
              <p className="mt-1 text-xs text-fg-muted">
                FR-A-05 — list and revoke. Broker sessions appear when Better Auth
                returns them; this browser is always listed.
              </p>
              <ul className="mt-4 divide-y divide-border">
                {authSessions.map((s) => (
                  <li key={s.token} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="text-sm">Auth session</div>
                      <div className="text-[11px] text-fg-subtle">
                        {s.userAgent || "Unknown client"}
                        {s.ipAddress ? ` · ${s.ipAddress}` : ""}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await authClient.revokeSession({ token: s.token });
                          setAuthSessions((rows) => rows.filter((r) => r.token !== s.token));
                          toast.success("Session revoked");
                        } catch {
                          toast.error("Could not revoke that session");
                        }
                      }}
                    >
                      Revoke
                    </Button>
                  </li>
                ))}
                {mineSessions.map((s) => (
                  <li key={s.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <div className="text-sm">
                        {s.label}
                        {s.current && !s.revokedAt && (
                          <Badge variant="ok" className="ml-2">
                            Current
                          </Badge>
                        )}
                        {s.revokedAt && <Badge variant="default" className="ml-2">Revoked</Badge>}
                      </div>
                      <div className="text-[11px] text-fg-subtle">
                        Last active {formatRelative(s.lastActiveAt)}
                      </div>
                    </div>
                    {!s.revokedAt && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          revokeDeskSession(s.id);
                          if (s.current && authEnabled) {
                            toast.message("This desk was revoked. Sign in again to continue.");
                            void signOut("/");
                          } else {
                            toast.success("Session revoked");
                          }
                        }}
                      >
                        Revoke
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => touchDeskSession(user.id, "This browser")}
              >
                Refresh this desk
              </Button>
            </section>
          </TabsContent>

          <TabsContent value="machines" className="space-y-4">
            <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-medium">Agent API</h2>
                  <p className="mt-1 text-xs text-fg-muted">
                    Point this prototype at a running johnnyclem/posttape server
                    (`/api/v1/version`). Empty means local-only — freeze still
                    plans here; it does not drive Live.
                  </p>
                </div>
                <Badge variant={probe?.ok ? "ok" : "private"}>
                  {probe?.ok ? `API v${probe.info.api}` : "Local prototype"}
                </Badge>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={apiBase}
                  onChange={(e) => setApiBaseField(e.target.value)}
                  placeholder="https://posttape.example"
                  aria-label="API base URL"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    const base = setApiBase(apiBase);
                    const result = await probeApi(base);
                    setProbe(result);
                    if (result.ok) toast.success(`Connected · API v${result.info.api}`);
                    else toast.message(result.error);
                  }}
                >
                  Check
                </Button>
              </div>
              {probe?.ok && (
                <p className="text-[11px] text-fg-subtle">
                  Capabilities: {probe.info.capabilities.join(" · ")} · min Agent{" "}
                  {probe.info.minAgentVersion}
                </p>
              )}
              {probe && !probe.ok && probe.base && (
                <p className="text-[11px] text-warn">{probe.error}</p>
              )}
            </section>

            <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5 space-y-3">
              <h2 className="text-sm font-medium">Pair a machine</h2>
              <p className="text-xs text-fg-muted">
                FR-A-07 — short-lived device code. The desktop Agent enters this
                on start. This page is the web half; the Agent lives in the
                monorepo.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  placeholder="Studio Mac"
                />
                <Button
                  size="sm"
                  onClick={async () => {
                    const base = getApiBase();
                    const remote = base
                      ? await startRemotePair(base, { machineName })
                      : null;
                    const req = startPairing(
                      user.id,
                      machineName,
                      remote
                        ? {
                            userCode: remote.userCode,
                            deviceCode: remote.deviceCode,
                            userId: user.id,
                            machineName,
                            createdAt: new Date().toISOString(),
                            expiresAt: remote.expiresAt,
                            status: "pending",
                            source: remote.source,
                          }
                        : undefined,
                    );
                    toast.success(`Code ${req.userCode}`, {
                      description: req.source === "remote" ? "Issued by the API" : "Local stand-in — approve below to simulate the Agent",
                    });
                  }}
                >
                  Generate code
                </Button>
              </div>
              {pendingPair && (
                <div className="rounded-[var(--radius-md)] border border-border bg-bg px-4 py-3">
                  <div className="font-mono text-xl tracking-[0.2em] text-fg">{pendingPair.userCode}</div>
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    Expires {formatRelative(pendingPair.expiresAt)} · {pendingPair.source}
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={approveCode}
                      onChange={(e) => setApproveCode(e.target.value.toUpperCase())}
                      placeholder="Type the code to approve"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const ok = approvePairing(user.id, approveCode || pendingPair.userCode);
                        if (ok) toast.success("Machine paired. Inventory still private.");
                        else toast.error("Code expired or unknown");
                      }}
                    >
                      Approve as this desk
                    </Button>
                  </div>
                </div>
              )}
              {env?.kind === "agent" && (
                <p className="text-xs text-ok">
                  Paired as {env.name}
                  {env.pairedAt ? ` · ${formatRelative(env.pairedAt)}` : ""}.
                </p>
              )}
            </section>

            <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-medium">Environment</h2>
                  <p className="mt-1 text-xs text-fg-muted">
                    {env?.name} · Live {env?.liveVersion ?? "—"} · {env?.kind === "agent" ? "paired Agent" : "declared manually"}
                  </p>
                </div>
                <Badge variant="private">Private by default</Badge>
              </div>
              <ul className="mt-4 divide-y divide-border">
                {catalog.map((p) => {
                  const on = env?.pluginIds.includes(p.id) || p.deviceClass === "stock";
                  const locked = STOCK_PLUGIN_IDS.includes(p.id);
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-[11px] text-fg-subtle">
                          {p.vendor} · {p.deviceClass} · {p.licenseClass}
                        </div>
                      </div>
                      <Switch
                        checked={!!on}
                        disabled={locked}
                        onCheckedChange={() => toggleEnvPlugin(user.id, p.id)}
                        aria-label={`Installed ${p.name}`}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          </TabsContent>

          <TabsContent value="notify" className="space-y-4">
            <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5 space-y-3">
              <h2 className="text-sm font-medium">Email (preference only)</h2>
              <p className="text-xs text-fg-muted">
                FR-M-02 — per-category opt-out and a daily digest. This prototype
                stores the switch; it does not send email.
              </p>
              {(
                [
                  ["mention", "Mentions"],
                  ["comment", "Comments on your takes"],
                  ["invite", "Invites"],
                  ["push", "Pushes on songs you collab"],
                  ["freeze", "Freeze package ready"],
                  ["compat", "Compatibility break"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between gap-3 py-1.5">
                  <span className="text-sm">{label}</span>
                  <Switch
                    checked={prefs[key]}
                    onCheckedChange={(v) => setNotificationPrefs(user.id, { [key]: v })}
                    aria-label={label}
                  />
                </label>
              ))}
              <div className="pt-2">
                <Label htmlFor="digest">Daily digest</Label>
                <select
                  id="digest"
                  className="mt-1 flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-sm"
                  value={prefs.digest}
                  onChange={(e) =>
                    setNotificationPrefs(user.id, { digest: e.target.value as "off" | "daily" })
                  }
                >
                  <option value="daily">On — one email a day</option>
                  <option value="off">Off</option>
                </select>
              </div>
              <p className="text-xs text-fg-subtle">
                Mute a single song from that song’s page. In-app notices still land in{" "}
                <Link to="/notifications" className="text-signal hover:underline">
                  Inbox
                </Link>
                .
              </p>
            </section>
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <section className="rounded-[var(--radius-lg)] border border-danger/30 bg-bg-elevated p-5 space-y-3">
              <h2 className="text-sm font-medium text-danger">Delete account</h2>
              <p className="text-xs text-fg-muted">
                FR-A-06 — 30-day grace, then personal data is wiped and
                collaborative history is anonymized. Type{" "}
                <span className="font-mono text-fg">delete my account</span> to
                schedule. You can also finish the wipe now to preview the product
                behaviour.
              </p>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="delete my account"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={deleteConfirm.trim().toLowerCase() !== "delete my account"}
                  onClick={() => {
                    if (requestDeletion(user.id)) toast.success("Deletion scheduled — 30 days");
                  }}
                >
                  Schedule deletion
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={deleteConfirm.trim().toLowerCase() !== "delete my account"}
                  onClick={() => {
                    completeDeletion(user.id);
                    toast.success("Account anonymized in this prototype");
                    if (authEnabled) void signOut("/");
                  }}
                >
                  Wipe now (demo)
                </Button>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
