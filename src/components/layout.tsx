import { Link, useRouterState } from "@tanstack/react-router";
import {
  Disc3,
  Library,
  Menu,
  Plus,
  Radio,
  Search,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/explore", label: "Explore", icon: Search },
  { to: "/library", label: "Library", icon: Library },
  { to: "/activity", label: "Tape feed", icon: Radio },
] as const;

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <span className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-bg-elevated text-tape">
            <Disc3 className="size-4" strokeWidth={1.75} />
          </span>
          <span className="font-display text-lg tracking-tight text-fg group-hover:text-accent transition-colors">
            Posttape
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-sm transition-colors",
                  active
                    ? "bg-bg-subtle text-fg"
                    : "text-fg-muted hover:bg-bg-subtle/60 hover:text-fg",
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/new">
              <Plus className="size-3.5" />
              New song
            </Link>
          </Button>
          <Button asChild size="icon-sm" variant="secondary" className="sm:hidden">
            <Link to="/new" aria-label="New song">
              <Plus className="size-4" />
            </Link>
          </Button>

          {isPending ? (
            <div className="size-8 animate-pulse rounded-full bg-bg-subtle" />
          ) : user ? (
            <SignedIn>
              <Link
                to="/settings"
                className={cn(
                  "hidden h-9 items-center gap-1.5 rounded-[var(--radius-sm)] px-2 text-sm md:inline-flex",
                  pathname.startsWith("/settings")
                    ? "bg-bg-subtle text-fg"
                    : "text-fg-muted hover:bg-bg-subtle/60 hover:text-fg",
                )}
              >
                <Settings className="size-3.5" />
                Settings
              </Link>
              <UserButton />
            </SignedIn>
          ) : (
            <SignedOut>
              <Button asChild variant="secondary" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
            </SignedOut>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm text-fg-muted hover:bg-bg-subtle hover:text-fg"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            {user && (
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm text-fg-muted hover:bg-bg-subtle hover:text-fg"
              >
                <Settings className="size-4" />
                Settings
              </Link>
            )}
            <Link
              to="/design"
              onClick={() => setOpen(false)}
              className="flex h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm text-fg-muted hover:bg-bg-subtle hover:text-fg"
            >
              Design system
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-fg-subtle">
            Posttape — send songs like mail. Freeze before you post.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-fg-subtle">
            <Link to="/design" className="hover:text-fg transition-colors">
              Design system
            </Link>
            <Link to="/settings" className="hover:text-fg transition-colors">
              Settings
            </Link>
            <span>Ableton Live · flat folders · plugin-aware collab</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
