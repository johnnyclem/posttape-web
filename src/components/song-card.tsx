import { Link } from "@tanstack/react-router";
import { GitFork, Lock, Snowflake, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { MiniArrangement } from "@/components/waveform";
import { usePosttape } from "@/lib/store";
import type { Song } from "@/lib/types";
import { formatRelative } from "@/lib/utils";
import { needsFreeze } from "@/lib/plugins";

const DAW_LABEL: Record<Song["daw"], string> = {
  ableton: "Ableton",
  folder: "Folder",
  logic: "Logic",
  fl: "FL Studio",
  reaper: "Reaper",
  other: "Other",
};

export function SongCard({ song }: { song: Song }) {
  const getArtist = usePosttape((s) => s.getArtist);
  const owner = getArtist(song.ownerId);
  const openPlugins = song.pluginIds.filter((id) => needsFreeze(id)).length;
  const frozen = song.tracks.filter(
    (t) => t.freezeStatus === "frozen" || t.freezeStatus === "stem",
  ).length;

  return (
    <Link
      to="/songs/$owner/$slug"
      params={{ owner: owner?.username ?? "unknown", slug: song.slug }}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-elevated transition-colors hover:border-border-strong hover:bg-bg-subtle/40"
    >
      <div
        className="relative h-32 w-full overflow-hidden"
        style={{
          background: `linear-gradient(145deg, hsl(${song.coverHue} 24% 16%), hsl(${(song.coverHue + 45) % 360} 18% 9%))`,
        }}
      >
        <div className="absolute inset-0 tape-grid opacity-30" />
        {/* multi-lane arrangement fingerprint */}
        <div className="absolute inset-x-0 top-2 bottom-10 opacity-90">
          <MiniArrangement song={song} lanes={Math.min(6, song.tracks.length || 4)} className="h-full" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2.5 left-3 right-3 flex flex-wrap gap-1.5">
          <Badge variant="default" className="bg-bg/75 backdrop-blur-sm">
            {DAW_LABEL[song.daw]}
          </Badge>
          {song.visibility === "private" && (
            <Badge variant="private" className="bg-bg/75 backdrop-blur-sm">
              <Lock className="size-3" />
              Private
            </Badge>
          )}
          {song.freezeReady ? (
            <Badge variant="ok" className="bg-bg/75 backdrop-blur-sm">
              <Snowflake className="size-3" />
              Collab-safe
            </Badge>
          ) : (
            <Badge variant="warn" className="bg-bg/75 backdrop-blur-sm">
              Needs freeze
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-medium text-fg group-hover:text-accent transition-colors">
            {song.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{song.description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 text-xs text-fg-subtle">
          <div className="flex items-center gap-2 min-w-0">
            {owner && <Avatar name={owner.displayName} hue={owner.avatarHue} size="sm" />}
            <span className="truncate">{owner?.username}</span>
            <span>·</span>
            <span className="tabular-nums">{formatRelative(song.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1">
              <Star className="size-3" />
              {song.starCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <GitFork className="size-3" />
              {song.forkCount}
            </span>
          </div>
        </div>
        <div className="text-[11px] text-fg-subtle tabular-nums">
          {song.tracks.length} tracks · {frozen} frozen · {openPlugins} third-party plugs
        </div>
      </div>
    </Link>
  );
}
