import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout";
import { FreezeWizard } from "@/components/freeze-wizard";
import { Button } from "@/components/ui/button";
import { usePosttape } from "@/lib/store";

export const Route = createFileRoute("/songs/$owner/$slug/prepare")({
  component: PreparePage,
});

function PreparePage() {
  const { owner, slug } = Route.useParams();
  const navigate = useNavigate();
  const getSong = usePosttape((s) => s.getSong);
  const song = getSong(owner, slug);

  if (!song) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-2xl">Song not found</h1>
          <Button asChild className="mt-6" variant="secondary">
            <Link to="/explore">Explore</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/songs/$owner/$slug" params={{ owner, slug }}>
            <ChevronLeft className="size-4" />
            {song.title}
          </Link>
        </Button>
        <FreezeWizard
          song={song}
          authorId={song.ownerId}
          onDone={() =>
            navigate({
              to: "/songs/$owner/$slug",
              params: { owner, slug },
            })
          }
        />
      </div>
    </AppShell>
  );
}
