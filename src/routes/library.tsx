import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout";
import { SongCard } from "@/components/song-card";
import { Button } from "@/components/ui/button";
import { usePosttape } from "@/lib/store";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { canAccessSong } from "@/lib/roles";

export const Route = createFileRoute("/library")({
  component: LibraryPage,
});

function LibraryPage() {
  const { user, isPending } = useCurrentUserState();
  const songs = usePosttape((s) => s.songs);
  const starredIds = usePosttape((s) => s.starredIds);
  const ensureArtist = usePosttape((s) => s.ensureArtist);
  const getArtist = usePosttape((s) => s.getArtist);

  const viewerId = isPending ? undefined : (user?.id ?? null);

  const artist = user ? getArtist(user.id) : undefined;

  useEffect(() => {
    if (user) ensureArtist(user);
  }, [user, ensureArtist]);

  const mine = songs.filter((s) => {
    if (starredIds.includes(s.id) && canAccessSong(s, viewerId ?? null)) return true;
    if (!user) return false;
    return (
      s.ownerId === user.id || s.collaborators.some((c) => c.userId === user.id)
    );
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Library</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Songs you own, collaborate on, or starred
              {!isPending && artist
                ? ` · @${artist.username}`
                : !isPending && !user
                  ? " · sign in to see your desk"
                  : ""}
              .
            </p>
          </div>
          <Button asChild>
            <Link to="/new">
              <Plus className="size-4" />
              New song
            </Link>
          </Button>
        </div>

        {isPending ? (
          <p className="mt-16 text-center text-sm text-fg-subtle">Loading…</p>
        ) : mine.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-sm text-fg-subtle">
              {user
                ? "Nothing on the shelf yet. Start a song or star a public one."
                : "Sign in to keep a private desk, or star public songs as a guest."}
            </p>
            {!user && (
              <Button asChild className="mt-4" variant="secondary">
                <Link to="/login">Sign in</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
