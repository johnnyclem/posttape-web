import { createFileRoute, Link } from "@tanstack/react-router";
import { Disc3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-bg-elevated text-tape">
            <Disc3 className="size-4" />
          </span>
          <span className="font-display text-xl">Posttape</span>
        </Link>
        <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-6 shadow-[var(--shadow-soft)]">
          <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Save private songs and collaborate under your name.
          </p>
          <div className="mt-5 space-y-2">
            {authEnabled ? (
              GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/library" })}
                >
                  Continue with {p.label}
                </Button>
              ))
            ) : (
              <p className="text-sm text-fg-subtle">Sign-in is disabled.</p>
            )}
          </div>
          <p className="mt-5 text-center text-xs text-fg-subtle">
            You can explore public demos without an account.
          </p>
        </div>
      </div>
    </div>
  );
}
