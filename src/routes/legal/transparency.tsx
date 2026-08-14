import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal-shell";
import { usePosttape } from "@/lib/store";

export const Route = createFileRoute("/legal/transparency")({
  component: TransparencyPage,
});

function TransparencyPage() {
  const t = usePosttape((s) => s.transparency);
  return (
    <LegalShell title="Transparency report" current="/legal/transparency">
      <p>
        FR-N-06 — a public record of takedown volume. Numbers below include the
        seeded year plus any notices filed in this prototype.
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <Stat label="Year" value={String(t.year)} />
        <Stat label="DMCA notices received" value={String(t.noticesReceived)} />
        <Stat label="Takedowns (legal hold)" value={String(t.takedowns)} />
        <Stat label="Counter-notices" value={String(t.counterNotices)} />
        <Stat label="User reports" value={String(t.reports)} />
      </dl>
      <p>
        A takedown removes public access and holds the files. It is not a
        delete. Valid counter-notices start a waiting period before access can
        return.
      </p>
    </LegalShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-bg-elevated px-4 py-3">
      <dt className="text-[11px] uppercase tracking-wide text-fg-subtle">{label}</dt>
      <dd className="mt-1 font-display text-2xl tabular-nums text-fg">{value}</dd>
    </div>
  );
}
