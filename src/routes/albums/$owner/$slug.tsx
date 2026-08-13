import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout";
import { SongCard } from "@/components/song-card";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePosttape } from "@/lib/store";

export const Route = createFileRoute("/albums/$owner/$slug")({
  component: AlbumPage,
});

function AlbumPage() {
  const { owner, slug } = Route.useParams();
  const getAlbum = usePosttape((s) => s.getAlbum);
  const getArtist = usePosttape((s) => s.getArtist);
  const getSongById = usePosttape((s) => s.getSongById);
  const album = getAlbum(owner, slug);

  if (!album) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-2xl">Album not found</h1>
          <Button asChild className="mt-6" variant="secondary">
            <Link to="/explore">Explore</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const artist = getArtist(album.ownerId)!;
  const songs = album.songIds
    .map((id) => getSongById(id))
    .filter(Boolean);

  return (
    <AppShell>
      <div
        className="border-b border-border"
        style={{
          background: `linear-gradient(180deg, hsl(${album.coverHue} 18% 14%), var(--color-bg))`,
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <Badge variant="default">Album</Badge>
          <h1 className="mt-3 font-display text-4xl tracking-tight">
            {album.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-fg-muted">{album.description}</p>
          <div className="mt-4 flex items-center gap-2">
            <Avatar name={artist.displayName} hue={artist.avatarHue} size="sm" />
            <Link
              to="/u/$username"
              params={{ username: artist.username }}
              className="text-sm hover:text-accent"
            >
              {artist.displayName}
            </Link>
            <span className="text-fg-subtle">·</span>
            <span className="text-sm text-fg-subtle">
              {songs.length} songs
            </span>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {songs.map(
            (song) => song && <SongCard key={song.id} song={song} />,
          )}
        </div>
      </div>
    </AppShell>
  );
}
