import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/legal/terms", label: "Terms" },
  { to: "/legal/privacy", label: "Privacy" },
  { to: "/legal/dmca", label: "DMCA" },
  { to: "/legal/transparency", label: "Transparency" },
] as const;

export function LegalShell({
  title,
  children,
  current,
}: {
  title: string;
  children: React.ReactNode;
  current: (typeof LINKS)[number]["to"];
}) {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <nav className="flex flex-wrap gap-1.5">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                current === l.to
                  ? "border-border-strong bg-bg-subtle text-fg"
                  : "border-border text-fg-muted hover:bg-bg-subtle/60",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <h1 className="mt-6 font-display text-3xl tracking-tight">{title}</h1>
        <div className="prose-legal mt-6 space-y-4 text-sm leading-relaxed text-fg-muted">
          {children}
        </div>
      </div>
    </AppShell>
  );
}
