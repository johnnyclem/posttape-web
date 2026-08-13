import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileAudio, FolderOpen, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { usePosttape } from "@/lib/store";
import { getPlugin, needsFreeze } from "@/lib/plugins";
import type { Visibility } from "@/lib/types";

export const Route = createFileRoute("/new")({
  component: NewSongPage,
});

function NewSongPage() {
  const navigate = useNavigate();
  const createSong = usePosttape((s) => s.createSong);
  const analyzeUpload = usePosttape((s) => s.analyzeUpload);
  const getArtist = usePosttape((s) => s.getArtist);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [bpm, setBpm] = useState(120);
  const [key, setKey] = useState("C major");
  const [tags, setTags] = useState("collab");
  const [paths, setPaths] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const analysis = useMemo(
    () => (paths.length ? analyzeUpload(paths) : null),
    [paths, analyzeUpload],
  );

  function onFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const next = Array.from(fileList).map((f) => {
      // webkitRelativePath preserves folder structure for directory upload
      const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath;
      return rel && rel.length > 0 ? rel : f.name;
    });
    setPaths(next);
    if (!title) {
      const als = next.find((p) => p.toLowerCase().endsWith(".als"));
      const base = (als ?? next[0]).split("/").pop()!.replace(/\.[^.]+$/, "");
      setTitle(base.replace(/[_-]+/g, " "));
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const owner = getArtist("ben")!;
    const song = createSong({
      ownerId: owner.id,
      title: title || "Untitled song",
      description,
      visibility,
      daw: analysis?.daw ?? "ableton",
      bpm,
      key,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      filePaths: paths,
    });
    toast.success("Song created", {
      description: analysis
        ? `Detected ${analysis.daw} · ${analysis.pluginIds.length} devices`
        : "Empty project scaffolded",
    });
    const username = owner.username;
    navigate({
      to: "/songs/$owner/$slug",
      params: { owner: username, slug: song.slug },
    });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl tracking-tight">New song</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Upload an Ableton Live project or a flat folder from any DAW. We scan
          for plug-ins and prepare a freeze plan for your collaborator.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-6">
          <div
            className="relative rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-bg-elevated/60 px-4 py-10 text-center transition-colors hover:border-signal/40 hover:bg-bg-elevated"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <Upload className="mx-auto size-8 text-tape" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium">
              Drop .als, stems, or a project folder
            </p>
            <p className="mt-1 text-xs text-fg-subtle">
              Ableton Live sets, audio, MIDI, or multi-file folders
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <label>
                <input
                  type="file"
                  className="sr-only"
                  multiple
                  accept=".als,.wav,.aiff,.flac,.mp3,.mid,.midi,.zip"
                  onChange={(e) => onFiles(e.target.files)}
                />
                <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-bg-subtle px-3 text-xs font-medium hover:bg-bg-hover">
                  <FileAudio className="size-3.5" />
                  Choose files
                </span>
              </label>
              <label>
                <input
                  type="file"
                  className="sr-only"
                  // @ts-expect-error webkitdirectory is non-standard but widely supported
                  webkitdirectory=""
                  multiple
                  onChange={(e) => onFiles(e.target.files)}
                />
                <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-bg-subtle px-3 text-xs font-medium hover:bg-bg-hover">
                  <FolderOpen className="size-3.5" />
                  Choose folder
                </span>
              </label>
            </div>
            {paths.length > 0 && (
              <div className="mx-auto mt-5 max-w-md text-left">
                <p className="text-xs text-fg-subtle">
                  {paths.length} file{paths.length === 1 ? "" : "s"} selected
                </p>
                <ul className="mt-2 max-h-28 overflow-auto rounded-[var(--radius-sm)] border border-border bg-bg p-2 font-mono text-[11px] text-fg-muted">
                  {paths.slice(0, 12).map((p) => (
                    <li key={p} className="truncate">
                      {p}
                    </li>
                  ))}
                  {paths.length > 12 && (
                    <li className="text-fg-subtle">+{paths.length - 12} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {analysis && (
            <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="signal">DAW: {analysis.daw}</Badge>
                <Badge variant="default">
                  {analysis.pluginIds.length} devices detected
                </Badge>
                <Badge
                  variant={
                    analysis.pluginIds.some((id) => needsFreeze(id))
                      ? "warn"
                      : "ok"
                  }
                >
                  {analysis.pluginIds.filter((id) => needsFreeze(id)).length} need
                  freeze
                </Badge>
              </div>
              {analysis.pluginIds.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {analysis.pluginIds.map((id) => {
                    const p = getPlugin(id);
                    return (
                      <Badge
                        key={id}
                        variant={needsFreeze(id) ? "warn" : "default"}
                      >
                        {p?.name ?? id}
                      </Badge>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Such Great Heights"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this song, who is it for, any freeze notes…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bpm">BPM</Label>
                <Input
                  id="bpm"
                  type="number"
                  min={40}
                  max={300}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value) || 120)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key">Key</Label>
                <Input
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-bg-elevated px-4 py-3">
              <div>
                <div className="text-sm font-medium">Private song</div>
                <div className="text-xs text-fg-subtle">
                  Only collaborators can open it
                </div>
              </div>
              <Switch
                checked={visibility === "private"}
                onCheckedChange={(v) => setVisibility(v ? "private" : "public")}
              />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">
            Create song
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
