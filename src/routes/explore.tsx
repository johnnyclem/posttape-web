import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout";
import { SongCard } from "@/components/song-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePosttape } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
});

const FILTERS = [
  { id: "all", label: "All" },
  { id: "ableton", label: "Ableton" },
  { id: "folder", label: "Folder" },
  { id: "collab-safe", label: "Collab-safe" },
  { id: "needs-freeze", label: "Needs freeze" },
] as const;

function ExplorePage() {
  const songs = usePosttape((s) => s.songs);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const list = useMemo(() => {
    let rows = songs.filter((s) => s.visibility === "public" && !s.takedownAt);

    if (filter === "ableton") rows = rows.filter((s) => s.daw === "ableton");
    if (filter === "folder") rows = rows.filter((s) => s.daw === "folder");
    if (filter === "collab-safe") rows = rows.filter((s) => s.freezeReady);
    if (filter === "needs-freeze") rows = rows.filter((s) => !s.freezeReady);
    if (q.trim()) {
      const qq = q.toLowerCase().trim();
      const bpmMatch = qq.match(/^(\d{2,3})\s*(bpm)?$/);
      rows = rows.filter((s) => {
        if (s.title.toLowerCase().includes(qq)) return true;
        if (s.description.toLowerCase().includes(qq)) return true;
        if (s.tags.some((t) => t.toLowerCase().includes(qq))) return true;
        if (s.key.toLowerCase().includes(qq)) return true;
        if (String(s.bpm) === qq || `${s.bpm} bpm` === qq) return true;
        if (bpmMatch && s.bpm === Number(bpmMatch[1])) return true;
        return false;
      });
    }
    return rows.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [songs, q, filter]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Explore</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Public songs and albums people are shipping as frozen sets.
            </p>
          </div>
          <Badge variant="default">{list.length} songs</Badge>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search titles, tags, key, BPM…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "h-9 rounded-full border px-3 text-xs font-medium transition-colors",
                  filter === f.id
                    ? "border-border-strong bg-bg-subtle text-fg"
                    : "border-border text-fg-muted hover:bg-bg-subtle/60",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <div className="mt-16 text-center text-sm text-fg-subtle">
            No public songs match that filter.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
