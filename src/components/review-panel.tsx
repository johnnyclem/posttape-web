import { useMemo, useState } from "react";
import { MessageSquare, Play } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { musicalDiff } from "@/lib/diff";
import { getPlugin } from "@/lib/plugins";
import { usePosttape } from "@/lib/store";
import type { Song } from "@/lib/types";
import { formatRelative } from "@/lib/utils";

export function ReviewPanel({
  song,
  actorId,
}: {
  song: Song;
  actorId: string;
}) {
  const getArtist = usePosttape((s) => s.getArtist);
  const addComment = usePosttape((s) => s.addComment);
  const resolveComment = usePosttape((s) => s.resolveComment);
  const [body, setBody] = useState("");
  const [trackName, setTrackName] = useState("");
  const [timecode, setTimecode] = useState("");
  const [hideResolved, setHideResolved] = useState(true);

  const comments = (song.comments ?? []).filter((c) =>
    hideResolved ? !c.resolved : true,
  );
  const takeId = song.commits[0]?.id;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const sec = timecode.trim() ? parseTimecode(timecode) : undefined;
    addComment(song.id, {
      authorId: actorId,
      body,
      takeId,
      trackName: trackName || undefined,
      timecodeSec: sec,
    });
    setBody("");
    toast.success("Comment posted");
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={submit}
        className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4 space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="size-4 text-tape" />
          Comment on this take
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Leave a note for the next pass…"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            value={trackName}
            onChange={(e) => setTrackName(e.target.value)}
            placeholder="Track name (optional)"
            list="song-track-names"
          />
          <Input
            value={timecode}
            onChange={(e) => setTimecode(e.target.value)}
            placeholder="Timecode 1:12"
          />
        </div>
        <datalist id="song-track-names">
          {song.tracks.map((t) => (
            <option key={t.id} value={t.name} />
          ))}
        </datalist>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={!body.trim()}>
            Post
          </Button>
          <button
            type="button"
            className="text-xs text-fg-subtle hover:text-fg"
            onClick={() => setHideResolved((v) => !v)}
          >
            {hideResolved ? "Show resolved" : "Hide resolved"}
          </button>
        </div>
      </form>

      <ul className="space-y-3">
        {comments.map((c) => {
          const author = getArtist(c.authorId);
          return (
            <li
              key={c.id}
              className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4"
            >
              <div className="flex items-start gap-3">
                {author && (
                  <Avatar name={author.displayName} hue={author.avatarHue} size="sm" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-fg-subtle">
                    <span className="font-medium text-fg">{author?.displayName}</span>
                    <span>{formatRelative(c.createdAt)}</span>
                    {c.trackName && <Badge variant="default">{c.trackName}</Badge>}
                    {c.timecodeSec != null && (
                      <Badge variant="signal">{formatTimecode(c.timecodeSec)}</Badge>
                    )}
                    {c.resolved && <Badge variant="ok">Resolved</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-fg-muted">{c.body}</p>
                  <button
                    type="button"
                    className="mt-2 text-[11px] text-fg-subtle hover:text-fg"
                    onClick={() => resolveComment(song.id, c.id, !c.resolved)}
                  >
                    {c.resolved ? "Reopen" : "Resolve"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        {comments.length === 0 && (
          <li className="text-center text-sm text-fg-subtle py-6">No comments yet.</li>
        )}
      </ul>
    </div>
  );
}

export function TakeDiff({ song }: { song: Song }) {
  const pairs = useMemo(() => {
    const out: Array<{ id: string; message: string; entries: ReturnType<typeof musicalDiff> }> =
      [];
    for (let i = 0; i < song.commits.length - 1; i++) {
      const newer = song.commits[i];
      const older = song.commits[i + 1];
      if (!newer?.snapshot || !older?.snapshot) continue;
      const entries = musicalDiff(older.snapshot, newer.snapshot);
      if (entries.length) {
        out.push({ id: newer.id, message: newer.message, entries });
      }
    }
    return out;
  }, [song.commits]);

  if (pairs.length === 0) {
    return (
      <p className="text-sm text-fg-subtle">
        Diffs appear when consecutive takes both have snapshots.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {pairs.map((pair) => (
        <li
          key={pair.id}
          className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4"
        >
          <div className="text-sm font-medium">{pair.message}</div>
          <ul className="mt-2 space-y-1 text-xs text-fg-muted">
            {pair.entries.map((e, i) => (
              <li key={`${pair.id}-${i}`}>
                <span className="text-fg">{e.label}</span>
                {e.before && (
                  <span className="text-fg-subtle">
                    {" "}
                    {prettyPlug(e.before)}
                  </span>
                )}
                {e.after && (
                  <span>
                    {" → "}
                    {prettyPlug(e.after)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

export function BounceButton({
  label = "Play reference bounce",
}: {
  label?: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() =>
        toast.message("Reference bounce", {
          description: "Use the Session tab transport for the in-browser mix. A streamed AAC bounce ships with the Agent.",
        })
      }
    >
      <Play className="size-3.5" />
      {label}
    </Button>
  );
}

function parseTimecode(raw: string): number | undefined {
  const t = raw.trim();
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(\d+):(\d{1,2})$/);
  if (!m) return undefined;
  return Number(m[1]) * 60 + Number(m[2]);
}

function formatTimecode(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function prettyPlug(id: string): string {
  return getPlugin(id)?.name ?? id;
}
