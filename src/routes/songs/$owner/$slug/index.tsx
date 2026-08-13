import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Clock,
  Disc3,
  GitCommitHorizontal,
  GitFork,
  Lock,
  Snowflake,
  Star,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout";
import { Avatar } from "@/components/avatar";
import {
  FileTree,
  PluginReport,
  TrackList,
} from "@/components/plugin-report";
import { ArrangementView } from "@/components/waveform";
import { SessionEditor } from "@/components/session/session-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { usePosttape } from "@/lib/store";
import { formatRelative } from "@/lib/utils";
import { needsFreeze } from "@/lib/plugins";

export const Route = createFileRoute("/songs/$owner/$slug/")({
  component: SongPage,
});

function SongPage() {
  const { owner, slug } = Route.useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const getSong = usePosttape((s) => s.getSong);
  const getArtist = usePosttape((s) => s.getArtist);
  const toggleStar = usePosttape((s) => s.toggleStar);
  const inviteCollaborator = usePosttape((s) => s.inviteCollaborator);
  const taylorPlugins = usePosttape((s) => s.taylorPlugins);
  const pushCommit = usePosttape((s) => s.pushCommit);
  const starredIds = usePosttape((s) => s.starredIds);

  const song = getSong(owner, slug);
  const [inviteName, setInviteName] = useState("taylor");
  const [commitMsg, setCommitMsg] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  if (!song) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-2xl">Song not found</h1>
          <p className="mt-2 text-sm text-fg-muted">
            This project may be private or the link is wrong.
          </p>
          <Button asChild className="mt-6" variant="secondary">
            <Link to="/explore">Explore songs</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const songOwner = getArtist(song.ownerId)!;
  const thirdParty = song.pluginIds.filter((id) => needsFreeze(id)).length;
  const frozenCount = song.tracks.filter(
    (t) => t.freezeStatus === "frozen" || t.freezeStatus === "stem",
  ).length;
  const isStarred = starredIds.includes(song.id);
  const actorId = user?.id ?? song.ownerId;

  return (
    <AppShell>
      <div className="border-b border-border bg-bg-elevated/30">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
                <Link
                  to="/u/$username"
                  params={{ username: songOwner.username }}
                  className="hover:text-fg"
                >
                  {songOwner.username}
                </Link>
                <span>/</span>
                <span className="font-medium text-fg">{song.slug}</span>
                {song.visibility === "private" ? (
                  <Badge variant="private">
                    <Lock className="size-3" />
                    Private
                  </Badge>
                ) : (
                  <Badge variant="default">Public</Badge>
                )}
                <Badge variant="default" className="capitalize">
                  {song.daw}
                </Badge>
              </div>
              <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
                {song.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-fg-muted">
                {song.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-fg-subtle">
                <span className="tabular-nums">{song.bpm} BPM</span>
                <span>·</span>
                <span>{song.key}</span>
                <span>·</span>
                <span>{song.timeSignature}</span>
                <span>·</span>
                <span className="tabular-nums">
                  updated {formatRelative(song.updatedAt)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {song.tags.map((t) => (
                  <Badge key={t} variant="default">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  toggleStar(song.id);
                  toast.success(isStarred ? "Unstarred" : "Starred");
                }}
              >
                <Star
                  className={
                    isStarred ? "size-3.5 fill-current" : "size-3.5"
                  }
                />
                {song.starCount}
              </Button>
              <Button variant="secondary" size="sm" disabled>
                <GitFork className="size-3.5" />
                {song.forkCount}
              </Button>
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <UserPlus className="size-3.5" />
                    Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite collaborator</DialogTitle>
                    <DialogDescription>
                      Add a producer by username (try taylor, jenny, jimmy, maya).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-2">
                    <Input
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="username"
                    />
                    <Button
                      onClick={() => {
                        const ok = inviteCollaborator(
                          song.id,
                          inviteName.trim().toLowerCase(),
                          "producer",
                        );
                        if (ok) {
                          toast.success(`Invited ${inviteName}`);
                          setInviteOpen(false);
                        } else {
                          toast.error("User not found");
                        }
                      }}
                    >
                      Invite
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                size="sm"
                onClick={() =>
                  navigate({
                    to: "/songs/$owner/$slug/prepare",
                    params: { owner, slug },
                  })
                }
              >
                <Snowflake className="size-3.5" />
                Prepare for send
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <Stat label="Tracks" value={String(song.tracks.length)} />
            <Stat label="Frozen" value={String(frozenCount)} ok={song.freezeReady} />
            <Stat label="Third-party plugs" value={String(thirdParty)} />
            <Stat
              label="Collab-safe"
              value={song.freezeReady ? "Yes" : "Not yet"}
              ok={song.freezeReady}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div>
            <Tabs defaultValue="session">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="session">Session</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="arrangement">Arrangement</TabsTrigger>
                <TabsTrigger value="tracks">Tracks</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="plugins">Plugins</TabsTrigger>
              </TabsList>

              <TabsContent value="session" className="space-y-4">
                <SessionEditor song={song} actorId={actorId} />
              </TabsContent>

              <TabsContent value="overview" className="space-y-6">
                <ArrangementView song={song} />
                <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5">
                  <h2 className="text-sm font-medium">About this exchange</h2>
                  <p className="mt-2 text-sm text-fg-muted leading-relaxed">
                    {song.freezeReady
                      ? "This revision is collaborator-safe — third-party and Max chains are frozen or printed as stems. Open in Ableton (or import stems) without hunting for plugs."
                      : "Some tracks still use live third-party devices. Run Prepare for send before handing this off — it freezes risky chains so your partner is not blocked."}
                  </p>
                  {!song.freezeReady && (
                    <Button
                      className="mt-4"
                      size="sm"
                      onClick={() =>
                        navigate({
                          to: "/songs/$owner/$slug/prepare",
                          params: { owner, slug },
                        })
                      }
                    >
                      <Snowflake className="size-3.5" />
                      Run freeze plan
                    </Button>
                  )}
                </div>
                <PluginReport
                  song={song}
                  installedIds={taylorPlugins}
                  title="If Taylor opens this"
                />
              </TabsContent>

              <TabsContent value="arrangement">
                <ArrangementView song={song} />
              </TabsContent>

              <TabsContent value="tracks">
                <TrackList song={song} />
              </TabsContent>

              <TabsContent value="files">
                <FileTree song={song} />
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={commitMsg}
                    onChange={(e) => setCommitMsg(e.target.value)}
                    placeholder="Commit message — e.g. vocal take 4"
                  />
                  <Button
                    onClick={() => {
                      if (!commitMsg.trim()) return;
                      pushCommit(song.id, song.ownerId, commitMsg.trim());
                      setCommitMsg("");
                      toast.success("Pushed revision");
                    }}
                  >
                    Push
                  </Button>
                </div>
                <ul className="space-y-3">
                  {song.commits.map((c) => {
                    const author = getArtist(c.authorId);
                    return (
                      <li
                        key={c.id}
                        className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            {author && (
                              <Avatar
                                name={author.displayName}
                                hue={author.avatarHue}
                                size="sm"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium">{c.message}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-subtle">
                                <span>{author?.displayName}</span>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1 font-mono">
                                  <GitCommitHorizontal className="size-3" />
                                  {c.shortId}
                                </span>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1 tabular-nums">
                                  <Clock className="size-3" />
                                  {formatRelative(c.createdAt)}
                                </span>
                              </div>
                              {c.summary && (
                                <p className="mt-2 text-xs text-fg-muted">
                                  {c.summary}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant="default">{c.kind}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-fg-subtle tabular-nums">
                          <span>{c.filesChanged} files</span>
                          <span>{c.pluginsDetected} devices</span>
                          <span>{c.tracksFrozen} frozen</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </TabsContent>

              <TabsContent value="plugins" className="space-y-4">
                <PluginReport
                  song={song}
                  installedIds={taylorPlugins}
                  title="Collaborator machine (Taylor)"
                />
                <PluginReport
                  song={song}
                  installedIds={song.pluginIds}
                  title="Author machine (all present)"
                />
              </TabsContent>
            </Tabs>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                Collaborators
              </h3>
              <ul className="mt-3 space-y-3">
                {song.collaborators.map((c) => {
                  const a = getArtist(c.userId);
                  if (!a) return null;
                  return (
                    <li key={c.userId} className="flex items-center gap-2">
                      <Avatar name={a.displayName} hue={a.avatarHue} size="sm" />
                      <div className="min-w-0">
                        <Link
                          to="/u/$username"
                          params={{ username: a.username }}
                          className="block truncate text-sm font-medium hover:text-accent"
                        >
                          {a.displayName}
                        </Link>
                        <div className="text-[11px] capitalize text-fg-subtle">
                          {c.role}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                Open in Ableton
              </h3>
              <p className="mt-2 text-xs text-fg-muted leading-relaxed">
                Download the project package, then File → Open Live Set. Frozen
                tracks appear under Samples/Processed/Freeze without requiring
                original plugs.
              </p>
              <Button
                className="mt-3 w-full"
                variant="secondary"
                size="sm"
                onClick={() =>
                  toast.success("Package ready", {
                    description:
                      "Demo: your .als + freeze stems would download here.",
                  })
                }
              >
                <Disc3 className="size-3.5" />
                Get package
              </Button>
            </div>

            {song.albumId && <AlbumLink albumId={song.albumId} />}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="min-w-[100px]">
      <div className="text-[11px] uppercase tracking-wide text-fg-subtle">
        {label}
      </div>
      <div
        className={
          ok === true
            ? "mt-0.5 text-lg font-medium tabular-nums text-ok"
            : ok === false
              ? "mt-0.5 text-lg font-medium tabular-nums text-warn"
              : "mt-0.5 text-lg font-medium tabular-nums text-fg"
        }
      >
        {value}
      </div>
    </div>
  );
}

function AlbumLink({ albumId }: { albumId: string }) {
  const albums = usePosttape((s) => s.albums);
  const getArtist = usePosttape((s) => s.getArtist);
  const album = albums.find((a) => a.id === albumId);
  if (!album) return null;
  const owner = getArtist(album.ownerId);
  if (!owner) return null;
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
        Album
      </h3>
      <Link
        to="/albums/$owner/$slug"
        params={{ owner: owner.username, slug: album.slug }}
        className="mt-2 block text-sm font-medium hover:text-accent"
      >
        {album.title}
      </Link>
    </div>
  );
}
