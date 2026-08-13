import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { PLUGIN_CATALOG, STOCK_PLUGIN_IDS } from "@/lib/plugins";
import { usePosttape } from "@/lib/store";
import { toast } from "sonner";

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

  useEffect(() => {
    if (!artist) return;
    setDisplayName(artist.displayName);
    setBio(artist.bio);
    setLocation(artist.location ?? "");
    setLinks((artist.links ?? []).join("\n"));
  }, [artist]);

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

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 space-y-10">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Profile and a private plugin inventory. Inventories are never public
            — share them per song, with named collaborators only.
          </p>
        </div>

        <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5 space-y-3">
          <h2 className="text-sm font-medium">Profile</h2>
          <div>
            <Label htmlFor="dn">Display name</Label>
            <Input
              id="dn"
              className="mt-1"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              className="mt-1"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="loc">Location</Label>
            <Input
              id="loc"
              className="mt-1"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="links">External links (max 5, one per line)</Label>
            <Textarea
              id="links"
              className="mt-1"
              value={links}
              onChange={(e) => setLinks(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              updateProfile(user.id, {
                displayName,
                bio,
                location,
                links: links
                  .split("\n")
                  .map((l) => l.trim())
                  .filter(Boolean)
                  .slice(0, 5),
              });
              toast.success("Profile saved");
            }}
          >
            Save profile
          </Button>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium">Environment</h2>
              <p className="mt-1 text-xs text-fg-muted">
                {env?.name} · Live {env?.liveVersion ?? "—"} · declared manually
                (Agent scan is a later pairing step).
              </p>
            </div>
            <Badge variant="private">Private by default</Badge>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {catalog.map((p) => {
              const on = env?.pluginIds.includes(p.id) || p.deviceClass === "stock";
              const locked = STOCK_PLUGIN_IDS.includes(p.id);
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
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
      </div>
    </AppShell>
  );
}
