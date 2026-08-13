import { createFileRoute, Link } from "@tanstack/react-router";
import { GitCommitHorizontal, Radio, Snowflake, Star, UserPlus } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Avatar } from "@/components/avatar";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { usePosttape } from "@/lib/store";
import { formatRelative } from "@/lib/utils";

export const Route = createFileRoute("/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  const { user, isPending } = useCurrentUserState();
  const activity = usePosttape((s) => s.activity);
  const getArtist = usePosttape((s) => s.getArtist);
  const getSongById = usePosttape((s) => s.getSongById);
  const getAlbum = usePosttape((s) => s.albums);
  const viewerId = isPending ? undefined : (user?.id ?? null);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-2">
          <Radio className="size-5 text-tape" />
          <h1 className="font-display text-3xl tracking-tight">Tape feed</h1>
        </div>
        <p className="mt-1 text-sm text-fg-muted">
          Pushes, freezes, and invites — the trail of songs moving between desks.
          Private takes stay off this shelf.
        </p>

        <ul className="mt-8 space-y-3">
          {activity.map((item) => {
            const actor = getArtist(item.actorId);
            const song = item.songId
              ? getSongById(item.songId, viewerId)
              : undefined;
            if (item.songId && !song && viewerId !== undefined) return null;
            const owner = song ? getArtist(song.ownerId) : undefined;
            const album = item.albumId
              ? getAlbum.find((a) => a.id === item.albumId)
              : undefined;
            const Icon =
              item.kind === "freeze"
                ? Snowflake
                : item.kind === "star"
                  ? Star
                  : item.kind === "invite"
                    ? UserPlus
                    : GitCommitHorizontal;

            return (
              <li
                key={item.id}
                className="flex gap-3 rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4"
              >
                {actor && (
                  <Avatar name={actor.displayName} hue={actor.avatarHue} size="md" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Icon className="size-3.5 text-tape shrink-0" />
                    <span className="font-medium">{actor?.displayName}</span>
                    <span className="text-fg-muted">{item.message}</span>
                  </div>
                  {song && owner && (
                    <Link
                      to="/songs/$owner/$slug"
                      params={{ owner: owner.username, slug: song.slug }}
                      className="mt-1.5 inline-block text-sm text-signal hover:underline"
                    >
                      {owner.username}/{song.slug}
                    </Link>
                  )}
                  {album && (
                    <Link
                      to="/albums/$owner/$slug"
                      params={{
                        owner: getArtist(album.ownerId)?.username ?? "unknown",
                        slug: album.slug,
                      }}
                      className="mt-1.5 inline-block text-sm text-signal hover:underline"
                    >
                      album/{album.slug}
                    </Link>
                  )}
                  <div className="mt-1 text-xs text-fg-subtle tabular-nums">
                    {formatRelative(item.createdAt)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}
