import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LegalShell } from "@/components/legal-shell";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePosttape } from "@/lib/store";

export const Route = createFileRoute("/legal/dmca")({
  component: DmcaPage,
});

function DmcaPage() {
  const songs = usePosttape((s) => s.songs);
  const getArtist = usePosttape((s) => s.getArtist);
  const fileLegalNotice = usePosttape((s) => s.fileLegalNotice);
  const [mode, setMode] = useState<"notice" | "counter">("notice");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [songId, setSongId] = useState("");
  const [body, setBody] = useState("");
  const [hold, setHold] = useState(true);

  const publicSongs = songs.filter((s) => s.visibility === "public" || s.takedownAt);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !body.trim()) {
      toast.error("Name, email, and a statement are required.");
      return;
    }
    fileLegalNotice({
      kind: mode === "notice" ? "dmca" : "counter",
      songId: songId || undefined,
      reporterName: name,
      reporterEmail: email,
      body,
      takedown: mode === "notice" && hold && !!songId,
    });
    toast.success(
      mode === "notice"
        ? hold && songId
          ? "Notice received. The song is on legal hold (not deleted)."
          : "Notice received. We acknowledge within 2 business days."
        : "Counter-notice received. Access is not restored automatically.",
    );
    setBody("");
  }

  return (
    <LegalShell title="DMCA" current="/legal/dmca">
      <p>
        Designated agent for copyright complaints. SLA: acknowledge within{" "}
        <strong className="text-fg">2 business days</strong>, act on a valid
        notice within <strong className="text-fg">10 business days</strong>.
        Takedown removes public access and holds the files — it is not a delete
        (FR-N-03).
      </p>
      <address className="not-italic rounded-[var(--radius-md)] border border-border bg-bg-elevated px-4 py-3 text-fg">
        Posttape Copyright Agent
        <br />
        1200 Tape Exchange, Suite 2
        <br />
        Austin, TX 78701
        <br />
        dmca@posttape.example
      </address>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "notice" ? "default" : "secondary"}
          onClick={() => setMode("notice")}
        >
          File a notice
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "counter" ? "default" : "secondary"}
          onClick={() => setMode("counter")}
        >
          Counter-notice
        </Button>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4">
        <div>
          <Label htmlFor="dn">Your name</Label>
          <Input id="dn" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="em">Email</Label>
          <Input id="em" type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="sg">Song (optional)</Label>
          <select
            id="sg"
            className="mt-1 flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-sm"
            value={songId}
            onChange={(e) => setSongId(e.target.value)}
          >
            <option value="">Select a public song…</option>
            {publicSongs.map((s) => {
              const owner = getArtist(s.ownerId);
              return (
                <option key={s.id} value={s.id}>
                  {owner?.username}/{s.slug}
                  {s.takedownAt ? " (on hold)" : ""}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <Label htmlFor="bd">
            {mode === "notice"
              ? "Statement of infringement (works, URL, good-faith belief)"
              : "Counter-notice (why this is a mistake or misidentification)"}
          </Label>
          <Textarea id="bd" className="mt-1" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        {mode === "notice" && songId && (
          <label className="flex items-center gap-2 text-xs text-fg-muted">
            <input
              type="checkbox"
              className="accent-[var(--color-signal)]"
              checked={hold}
              onChange={(e) => setHold(e.target.checked)}
            />
            Place this song on legal hold (hide from the public, keep the files)
          </label>
        )}
        <Button type="submit" size="sm">
          {mode === "notice" ? "Submit notice" : "Submit counter-notice"}
        </Button>
      </form>
      <p>
        To report abuse or malware without a DMCA claim, use Report on a public
        song page. See also the{" "}
        <Link to="/legal/transparency" className="text-signal hover:underline">
          transparency record
        </Link>
        .
      </p>
    </LegalShell>
  );
}
