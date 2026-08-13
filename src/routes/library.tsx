import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout";
import { SongCard } from "@/components/song-card";
import { Button } from "@/components/ui/button";
import { usePosttape } from "@/lib/store";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/library")({
  component: LibraryPage,
});

function LibraryPage() {
  const { user, isPending } = useCurrentUserState();
  const songs = usePosttape((s) => s.songs);
  const getArtist = usePosttape((s) => s.getArtist);
  const starredIds = usePosttape((s) => s.starredIds);

  const demoUser = getArtist("ben");
  const mine = songs.filter(
    (s) =>
      s.ownerId === demoUser?.id ||
      s.collaborators.some((c) => c.userId === demoUser?.id) ||
      starredIds.includes(s.id),
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Library</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Songs you own, collaborate on, or starred
              {!isPending && user
                ? ` · signed in as ${user.displayName ?? "you"}`
                : " · demo shows Ben's desk"}
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

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
