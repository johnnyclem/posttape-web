import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Disc3,
  GitCommitHorizontal,
  GitFork,
  Globe,
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
import { BounceButton, ReviewPanel, TakeDiff } from "@/components/review-panel";
import { ArrangementView } from "@/components/waveform";
import { SessionEditor } from "@/components/session/session-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  GENERIC_LIVE_ID,
  listTargetEnvironments,
  summarizeCollaborators,
} from "@/lib/environment";
import { needsFreeze } from "@/lib/plugins";
import {
  ROLE_LABEL,
  canDownloadProject,
  canManage,
  canPush,
} from "@/lib/roles";
import { usePosttape } from "@/lib/store";
import type { CollaboratorRole } from "@/lib/types";
import { formatRelative } from "@/lib/utils";

export const Route = createFileRoute("/songs/$owner/$slug/")({
  component: SongPage,
});

function SongPage() {
  const { owner, slug } = Route.useParams();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const songs = usePosttape((s) => s.songs);
  const environments = usePosttape((s) => s.environments);
  const getSong = usePosttape((s) => s.getSong);
  const getArtist = usePosttape((s) => s.getArtist);
  const getEnvironment = usePosttape((s) => s.getEnvironment);
  const toggleStar = usePosttape((s) => s.toggleStar);
  const inviteCollaborator = usePosttape((s) => s.inviteCollaborator);
  const pushCommit = usePosttape((s) => s.pushCommit);
  const starredIds = usePosttape((s) => s.starredIds);
  const setVisibility = usePosttape((s) => s.setVisibility);
  const setLinerNotes = usePosttape((s) => s.setLinerNotes);
  const shareEnvironmentWithSong = usePosttape((s) => s.shareEnvironmentWithSong);
  const ensureArtist = usePosttape((s) => s.ensureArtist);

  const viewerId = isPending ? undefined : (user?.id ?? null);
  const song = getSong(owner, slug, viewerId);
  void songs;
  void environments;

  const [inviteName, setInviteName] = useState("taylor");
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>("contributor");
  const [commitMsg, setCommitMsg] = useState("");
  const [rightsOk, setRightsOk] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [visOpen, setVisOpen] = useState(false);
  const [visConfirm, setVisConfirm] = useState("");
  const [notesDraft, setNotesDraft] = useState<string | null>(null);

  useEffect(() => {
    if (user) ensureArtist(user);
  }, [user, ensureArtist]);

  const visibleTargets = useMemo(() => {
    if (!song) return [];
    return listTargetEnvironments(song, environments, viewerId ?? null);
  }, [song, environments, viewerId]);

  const defaultTargetId =
    visibleTargets.find((t) => t.userId !== GENERIC_LIVE_ID)?.userId ??
    GENERIC_LIVE_ID;
  const [targetId, setTargetId] = useState<string | null>(null);
  const resolvedTargetId =
    (targetId && visibleTargets.some((t) => t.userId === targetId)
      ? targetId
      : defaultTargetId) ?? GENERIC_LIVE_ID;

  if (isPending) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center text-sm text-fg-subtle">
          Loading song…
        </div>
      </AppShell>
    );
  }

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
  const targetEnv = getEnvironment(resolvedTargetId);
  const ownerEnv = getEnvironment(song.ownerId);
  const thirdParty = song.pluginIds.filter((id) => needsFreeze(id)).length;
  const frozenCount = song.tracks.filter(
    (t) => t.freezeStatus === "frozen" || t.freezeStatus === "stem",
  ).length;
  const isStarred = starredIds.includes(song.id);
  const actorId = user?.id ?? song.ownerId;
  const manage = canManage(song, user?.id);
  const pushOk = canPush(song, user?.id);
  const downloadOk = canDownloadProject(song, user?.id);
  const demoFreeze = !user && song.visibility === "public";
  const canPrepare = pushOk || demoFreeze;
  const collabSummary = summarizeCollaborators(song, environments);
  const myEnv = user ? getEnvironment(user.id) : null;
  const envShared = myEnv?.sharedSongIds.includes(song.id) ?? false;
  const liner = notesDraft ?? song.linerNotes ?? "";

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
                  <Badge variant="default">
                    <Globe className="size-3" />
                    Public
                  </Badge>
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
              {manage && (
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
                        Owner, Maintainer, Contributor, or Listener. Try taylor,
                        jenny, jimmy, maya.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        placeholder="username"
                      />
                      <label className="block text-xs font-medium text-fg-subtle">
                        Role
                        <select
                          className="mt-1 flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-sm text-fg"
                          value={inviteRole}
                          onChange={(e) =>
                            setInviteRole(e.target.value as CollaboratorRole)
                          }
                        >
                          <option value="maintainer">Maintainer</option>
                          <option value="contributor">Contributor</option>
                          <option value="listener">Listener</option>
                        </select>
                      </label>
                      <Button
                        onClick={() => {
                          const ok = inviteCollaborator(
                            song.id,
                            inviteName.trim().toLowerCase(),
                            inviteRole,
                          );
                          if (ok) {
                            toast.success(
                              `Invited ${inviteName} as ${ROLE_LABEL[inviteRole]}`,
                            );
                            setInviteOpen(false);
                          } else {
                            toast.error("User not found or already on the song");
                          }
                        }}
                      >
                        Invite
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {canPrepare && (
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
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <Stat label="Tracks" value={String(song.tracks.length)} />
            <Stat label="Frozen" value={String(frozenCount)} ok={song.freezeReady} />
            <Stat label="Third-party plugs" value={String(thirdParty)} />
            <Stat
              label="Collab-safe"
              value={
                collabSummary.total
                  ? `${collabSummary.clean}/${collabSummary.total} open clean`
                  : song.freezeReady
                    ? "Yes"
                    : "Not yet"
              }
              ok={
                collabSummary.total
                  ? collabSummary.clean === collabSummary.total
                  : song.freezeReady
              }
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <Tabs defaultValue="session">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="session">Session</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="arrangement">Arrangement</TabsTrigger>
                <TabsTrigger value="tracks">Tracks</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
                <TabsTrigger value="notes">Liner notes</TabsTrigger>
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
                      : "Some tracks still use live third-party devices. Run Prepare for send against a named Environment before handing this off."}
                  </p>
                  {canPrepare && !song.freezeReady && (
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
                <TargetPicker
                  songId={song.id}
                  value={resolvedTargetId}
                  onChange={setTargetId}
                  viewerId={user?.id ?? null}
                />
                <PluginReport
                  song={song}
                  installedIds={targetEnv.pluginIds}
                  title={`If ${targetEnv.name} opens this`}
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
                {pushOk ? (
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={commitMsg}
                        onChange={(e) => setCommitMsg(e.target.value)}
                        placeholder="Commit message — e.g. vocal take 4"
                      />
                      <Button
                        onClick={() => {
                          if (!commitMsg.trim()) return;
                          if (!rightsOk) {
                            toast.error(
                              "Affirm you have the right to push this take",
                            );
                            return;
                          }
                          pushCommit(
                            song.id,
                            user?.id ?? song.ownerId,
                            commitMsg.trim(),
                            "push",
                            true,
                          );
                          setCommitMsg("");
                          toast.success("Pushed revision");
                        }}
                      >
                        Push
                      </Button>
                    </div>
                    <label className="flex items-start gap-2 text-xs text-fg-muted">
                      <input
                        type="checkbox"
                        className="mt-0.5 size-3.5 accent-[var(--color-signal)]"
                        checked={rightsOk}
                        onChange={(e) => setRightsOk(e.target.checked)}
                      />
                      I have the right to upload this take and any samples in it.
                    </label>
                  </div>
                ) : (
                  <p className="text-sm text-fg-subtle">
                    Contributors can push a new take. Listeners review and comment.
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">Musical diff</h3>
                  <BounceButton />
                </div>
                <TakeDiff song={song} />
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
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="default">{c.kind}</Badge>
                            {c.hasBounce && <Badge variant="signal">Bounce</Badge>}
                          </div>
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

              <TabsContent value="review">
                {user ? (
                  <ReviewPanel song={song} actorId={user.id} />
                ) : (
                  <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-6 text-center">
                    <p className="text-sm text-fg-muted">
                      Sign in to leave a timecode comment on this take.
                    </p>
                    <Button asChild className="mt-4" size="sm">
                      <Link to="/login">Sign in</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-3">
                {manage ? (
                  <>
                    <Textarea
                      value={liner}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      placeholder="Liner notes — the README for this song."
                      className="min-h-56 font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        setLinerNotes(song.id, liner);
                        setNotesDraft(null);
                        toast.success("Liner notes saved");
                      }}
                    >
                      Save notes
                    </Button>
                  </>
                ) : (
                  <article className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5">
                    {liner ? (
                      <LinerNotes text={liner} />
                    ) : (
                      <p className="text-sm text-fg-subtle">No liner notes yet.</p>
                    )}
                  </article>
                )}
              </TabsContent>

              <TabsContent value="plugins" className="space-y-4">
                <TargetPicker
                  songId={song.id}
                  value={resolvedTargetId}
                  onChange={setTargetId}
                  viewerId={user?.id ?? null}
                />
                <PluginReport
                  song={song}
                  installedIds={targetEnv.pluginIds}
                  title={`${targetEnv.name}`}
                />
                <PluginReport
                  song={song}
                  installedIds={ownerEnv.pluginIds}
                  title={`Author · ${ownerEnv.name}`}
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
                        <div className="text-[11px] text-fg-subtle">
                          {ROLE_LABEL[c.role] ?? c.role}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {collabSummary.total > 0 && (
                <p className="mt-3 text-[11px] text-fg-subtle">
                  {collabSummary.clean} of {collabSummary.total} named machines
                  open this take cleanly.
                </p>
              )}
            </div>

            {manage && (
              <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4 space-y-3">
                <h3 className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                  Visibility
                </h3>
                <p className="text-xs text-fg-muted">
                  {song.visibility === "private"
                    ? "Only collaborators can open this song. Making it public publishes the title, liner notes, plugin names, and bounce — never inventories."
                    : "Anyone can listen. Inventories stay private."}
                </p>
                {song.visibility === "private" ? (
                  <Dialog
                    open={visOpen}
                    onOpenChange={(o) => {
                      setVisOpen(o);
                      if (!o) setVisConfirm("");
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm" className="w-full">
                        Make public…
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Make this song public?</DialogTitle>
                        <DialogDescription>
                          This publishes the title, description, liner notes,
                          plugin names used on the song, and any reference bounce.
                          Plugin inventories stay private.
                        </DialogDescription>
                      </DialogHeader>
                      <Label htmlFor="vis-confirm">Type make public</Label>
                      <Input
                        id="vis-confirm"
                        value={visConfirm}
                        onChange={(e) => setVisConfirm(e.target.value)}
                        placeholder="make public"
                      />
                      <Button
                        onClick={() => {
                          const ok = setVisibility(
                            song.id,
                            "public",
                            visConfirm,
                          );
                          if (ok) {
                            toast.success("Song is public");
                            setVisOpen(false);
                            setVisConfirm("");
                          } else {
                            toast.error('Type “make public” to confirm');
                          }
                        }}
                      >
                        Publish
                      </Button>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setVisibility(song.id, "private");
                      toast.success("Song is private");
                    }}
                  >
                    <Lock className="size-3.5" />
                    Make private
                  </Button>
                )}
              </div>
            )}

            {user && myEnv && (
              <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4">
                <h3 className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                  My environment
                </h3>
                <p className="mt-2 text-xs text-fg-muted">
                  Share this machine’s inventory with collaborators on this song
                  only. Never public.
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-fg-subtle truncate">
                    {myEnv.name}
                  </span>
                  <Switch
                    checked={envShared}
                    onCheckedChange={(v) =>
                      shareEnvironmentWithSong(user.id, song.id, v)
                    }
                    aria-label="Share environment with this song"
                  />
                </div>
                <Link
                  to="/settings"
                  className="mt-2 inline-block text-[11px] text-signal hover:underline"
                >
                  Edit inventory
                </Link>
              </div>
            )}

            <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                Open in Ableton
              </h3>
              <p className="mt-2 text-xs text-fg-muted leading-relaxed">
                Download the project package, then File → Open Live Set. Frozen
                tracks appear under Samples/Processed/Freeze without requiring
                original plugs. Contributors and above can download.
              </p>
              <Button
                className="mt-3 w-full"
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (!downloadOk && !demoFreeze) {
                    toast.error("Contributors can download the project package.");
                    return;
                  }
                  toast.success("Package ready", {
                    description:
                      "Demo: your .als + freeze stems would download here.",
                  });
                }}
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

function TargetPicker({
  songId,
  value,
  onChange,
  viewerId,
}: {
  songId: string;
  value: string;
  onChange: (id: string) => void;
  viewerId: string | null;
}) {
  const songs = usePosttape((s) => s.songs);
  const environments = usePosttape((s) => s.environments);
  const getArtist = usePosttape((s) => s.getArtist);
  const song = songs.find((s) => s.id === songId);
  const options = song
    ? listTargetEnvironments(song, environments, viewerId)
    : [];
  return (
    <label className="block text-xs font-medium text-fg-subtle">
      Target environment
      <select
        className="mt-1 flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-sm text-fg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((t) => {
          const artist = getArtist(t.userId);
          return (
            <option key={t.userId} value={t.userId}>
              {t.name}
              {artist ? ` (@${artist.username})` : ""}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function LinerNotes({ text }: { text: string }) {
  const blocks = text.split("\n");
  return (
    <div className="space-y-2 text-sm text-fg-muted leading-relaxed">
      {blocks.map((line, i) => {
        if (line.startsWith("### ")) {
          return (
            <h4 key={i} className="pt-2 text-sm font-medium text-fg">
              {line.slice(4)}
            </h4>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="font-display text-lg text-fg">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h2 key={i} className="font-display text-xl text-fg">
              {line.slice(2)}
            </h2>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <p key={i} className="pl-3">
              · {inlineBold(line.slice(2))}
            </p>
          );
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i}>{inlineBold(line)}</p>;
      })}
    </div>
  );
}

function inlineBold(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-medium text-fg">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
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
