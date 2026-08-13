import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout";
import { FreezeWizard } from "@/components/freeze-wizard";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { canPush } from "@/lib/roles";
import { usePosttape } from "@/lib/store";

export const Route = createFileRoute("/songs/$owner/$slug/prepare")({
  component: PreparePage,
});

function PreparePage() {
  const { owner, slug } = Route.useParams();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const getSong = usePosttape((s) => s.getSong);
  const songs = usePosttape((s) => s.songs);
  void songs;

  const viewerId = isPending ? undefined : (user?.id ?? null);
  const song = getSong(owner, slug, viewerId);

  if (isPending) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center text-sm text-fg-subtle">
          Loading…
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
            <Link to="/explore">Explore</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const allowed = canPush(song, user?.id) || (!user && song.visibility === "public");
  const authorId = user && canPush(song, user.id) ? user.id : song.ownerId;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/songs/$owner/$slug" params={{ owner, slug }}>
            <ChevronLeft className="size-4" />
            {song.title}
          </Link>
        </Button>
        {allowed ? (
          <>
            {!user && (
              <p className="mb-4 rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 py-2 text-xs text-fg-muted">
                Demo mode — the package will be recorded as the song owner.
                Sign in as a contributor to attach it to your account.
              </p>
            )}
            <FreezeWizard
              song={song}
              authorId={authorId}
              onDone={() =>
                navigate({
                  to: "/songs/$owner/$slug",
                  params: { owner, slug },
                })
              }
            />
          </>
        ) : (
          <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-6 text-center">
            <h1 className="font-display text-xl">Contributors prepare freeze packages</h1>
            <p className="mt-2 text-sm text-fg-muted">
              Listeners can review and comment. Ask a maintainer to bump your role
              if you need to record a package.
            </p>
            <Button asChild className="mt-5" variant="secondary">
              <Link to="/songs/$owner/$slug" params={{ owner, slug }}>
                Back to song
              </Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
