import { useMemo, useState } from "react";
import {
  ExternalLink,
  Link2,
  Link2Off,
  Loader2,
  Play,
  Plus,
  Search,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { previewVoice } from "@/lib/audio/synth";
import { searchSplice } from "@/lib/splice/catalog";
import { usePosttape } from "@/lib/store";
import type { SpliceSample } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SpliceBrowser({
  selectedTrackId,
  onAdd,
  className,
}: {
  selectedTrackId: string | null;
  onAdd: (sample: SpliceSample) => void;
  className?: string;
}) {
  const splice = usePosttape((s) => s.splice);
  const connectSplice = usePosttape((s) => s.connectSplice);
  const disconnectSplice = usePosttape((s) => s.disconnectSplice);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | "oneshot" | "loop" | "midi">("all");
  const [authOpen, setAuthOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);

  const results = useMemo(
    () => searchSplice(query, { type }),
    [query, type],
  );

  async function handleConnect() {
    setConnecting(true);
    // Simulate OAuth round-trip to Splice (library link — not Grok broker identity)
    await new Promise((r) => setTimeout(r, 900));
    connectSplice("producer");
    setConnecting(false);
    setAuthOpen(false);
    toast.success("Splice library connected", {
      description: "Your Sounds+ library is ready to drop into tracks.",
    });
  }

  async function handlePreview(sample: SpliceSample) {
    setPreviewing(sample.id);
    try {
      await previewVoice(sample.voice, sample.id);
    } finally {
      setTimeout(() => setPreviewing(null), 400);
    }
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-[280px] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-elevated",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <SpliceMark />
          <div>
            <div className="text-sm font-medium">Splice</div>
            <div className="text-[11px] text-fg-subtle">
              {splice.connected
                ? `${splice.displayName} · ${splice.plan} · ${splice.sampleCount?.toLocaleString()} samples`
                : "Link your Sounds library"}
            </div>
          </div>
        </div>
        {splice.connected ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              disconnectSplice();
              toast.message("Splice disconnected");
            }}
          >
            <Unplug className="size-3.5" />
            Disconnect
          </Button>
        ) : (
          <Button size="sm" variant="signal" onClick={() => setAuthOpen(true)}>
            <Link2 className="size-3.5" />
            Connect Splice
          </Button>
        )}
      </div>

      {!splice.connected ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="max-w-xs text-sm text-fg-muted">
            Connect Splice to browse your licensed one-shots and loops, preview
            them, and drop them onto a session track.
          </p>
          <p className="max-w-xs text-[11px] text-fg-subtle">
            App sign-in stays Google / X. Splice is a linked library for samples —
            same idea as connecting a cloud drive.
          </p>
          <Button onClick={() => setAuthOpen(true)}>
            <Link2 className="size-4" />
            Connect with Splice
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your library…"
                className="pl-8 h-9"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {(["all", "oneshot", "loop", "midi"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "rounded-[var(--radius-sm)] px-2 py-1 text-[11px] font-medium capitalize transition-colors",
                    type === t
                      ? "bg-bg-subtle text-fg"
                      : "text-fg-subtle hover:text-fg",
                  )}
                >
                  {t === "all" ? "All" : t}
                </button>
              ))}
            </div>
          </div>

          <ul className="flex-1 overflow-y-auto divide-y divide-border">
            {results.map((sample) => (
              <li
                key={sample.id}
                className="flex items-center gap-2 px-3 py-2.5 hover:bg-bg-subtle/40"
              >
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[10px] font-medium text-white/90"
                  style={{
                    background: `linear-gradient(135deg, hsl(${sample.hue} 40% 28%), hsl(${(sample.hue + 30) % 360} 30% 16%))`,
                  }}
                >
                  {sample.voice.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{sample.name}</div>
                  <div className="truncate text-[11px] text-fg-subtle">
                    {sample.pack} · {sample.artist}
                    {sample.bpm ? ` · ${sample.bpm} BPM` : ""}
                    {sample.key ? ` · ${sample.key}` : ""}
                  </div>
                </div>
                <Badge variant="default" className="hidden capitalize sm:inline-flex">
                  {sample.type}
                </Badge>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Preview"
                  disabled={previewing === sample.id}
                  onClick={() => handlePreview(sample)}
                >
                  {previewing === sample.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Play className="size-3.5" />
                  )}
                </Button>
                <Button
                  size="icon-sm"
                  variant="secondary"
                  aria-label="Add to track"
                  disabled={!selectedTrackId}
                  title={
                    selectedTrackId
                      ? "Add to selected track"
                      : "Select a track first"
                  }
                  onClick={() => onAdd(sample)}
                >
                  <Plus className="size-3.5" />
                </Button>
              </li>
            ))}
            {results.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-fg-subtle">
                No samples match.
              </li>
            )}
          </ul>
        </>
      )}

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SpliceMark />
              Connect Splice
            </DialogTitle>
            <DialogDescription>
              Authorize Posttape to read your licensed Splice Sounds library so
              you can drop samples into session tracks. This does not replace
              Google / X sign-in.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-[var(--radius-md)] border border-border bg-bg-subtle/40 p-4 text-sm text-fg-muted">
            <ul className="space-y-1.5 text-xs">
              <li>· View samples you already own / license</li>
              <li>· Preview one-shots and loops in the browser</li>
              <li>· Add to multi-track session (written into project files)</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Link2 className="size-4" />
              )}
              {connecting ? "Authorizing…" : "Authorize Splice"}
            </Button>
            <Button variant="secondary" onClick={() => setAuthOpen(false)}>
              Cancel
            </Button>
          </div>
          <p className="flex items-center gap-1 text-[11px] text-fg-subtle">
            <ExternalLink className="size-3" />
            Demo flow — production would use Splice OAuth + API tokens.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SpliceMark() {
  return (
    <span className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-bg-subtle text-[11px] font-semibold tracking-tight text-fg">
      Sp
    </span>
  );
}

export function SpliceStatusChip() {
  const splice = usePosttape((s) => s.splice);
  if (!splice.connected) {
    return (
      <Badge variant="default">
        <Link2Off className="size-3" />
        Splice offline
      </Badge>
    );
  }
  return (
    <Badge variant="ok">
      <Link2 className="size-3" />
      Splice · {splice.displayName}
    </Badge>
  );
}
