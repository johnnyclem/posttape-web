import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout";
import { SongCard } from "@/components/song-card";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { canAccessSong } from "@/lib/roles";
import { usePosttape } from "@/lib/store";

export const Route = createFileRoute("/u/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const getArtist = usePosttape((s) => s.getArtist);
  const songsForUser = usePosttape((s) => s.songsForUser);
  const albums = usePosttape((s) => s.albums);
  const artist = getArtist(username);
  const viewerId = isPending ? undefined : (user?.id ?? null);

  if (!artist) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-2xl">Artist not found</h1>
          <Button asChild className="mt-6" variant="secondary">
            <Link to="/explore">Explore</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const songs = songsForUser(artist.id).filter((s) =>
    viewerId === undefined ? s.visibility === "public" : canAccessSong(s, viewerId),
  );
  const myAlbums = albums.filter(
    (a) => a.ownerId === artist.id && a.visibility === "public",
  );

  return (
    <AppShell>
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
          <Avatar name={artist.displayName} hue={artist.avatarHue} size="lg" />
          <div>
            <h1 className="font-display text-3xl tracking-tight">
              {artist.displayName}
            </h1>
            <p className="text-sm text-fg-muted">@{artist.username}</p>
            <p className="mt-2 max-w-lg text-sm text-fg-muted">{artist.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {artist.location && (
                <Badge variant="default">{artist.location}</Badge>
              )}
              {artist.daw && <Badge variant="signal">{artist.daw}</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {myAlbums.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-xl tracking-tight">Albums</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {myAlbums.map((album) => (
                <Link
                  key={album.id}
                  to="/albums/$owner/$slug"
                  params={{ owner: artist.username, slug: album.slug }}
                  className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5 transition-colors hover:border-border-strong"
                >
                  <div className="text-sm font-medium">{album.title}</div>
                  <p className="mt-1 text-xs text-fg-muted line-clamp-2">
                    {album.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <h2 className="font-display text-xl tracking-tight">Songs</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
