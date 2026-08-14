import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { usePosttape } from "@/lib/store";
import { formatRelative } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

const KIND_LABEL: Record<string, string> = {
  mention: "Mention",
  comment: "Comment",
  invite: "Invite",
  push: "Push",
  "freeze.ready": "Freeze",
  "compat.break": "Compatibility",
};

function NotificationsPage() {
  const { user, isPending } = useCurrentUserState();
  const notifications = usePosttape((s) => s.notifications);
  const notificationsFor = usePosttape((s) => s.notificationsFor);
  const markNotificationsRead = usePosttape((s) => s.markNotificationsRead);
  void notifications;

  if (isPending) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-fg-subtle">Loading…</div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-2xl">Sign in to read your tape</h1>
          <Button asChild className="mt-6">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const rows = notificationsFor(user.id);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-tape" />
              <h1 className="font-display text-3xl tracking-tight">Inbox</h1>
            </div>
            <p className="mt-1 text-sm text-fg-muted">
              Mentions, comments, invites, pushes, freeze packages. Email is
              opt-out per category in Settings — this prototype stores the
              preference, it does not send mail.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => markNotificationsRead(user.id)}>
            Mark all read
          </Button>
        </div>
        <ul className="mt-8 space-y-2">
          {rows.length === 0 && (
            <li className="rounded-[var(--radius-lg)] border border-border px-4 py-10 text-center text-sm text-fg-subtle">
              Nothing waiting.
            </li>
          )}
          {rows.map((n) => (
            <li key={n.id}>
              <Link
                to={n.url ?? "/notifications"}
                onClick={() => markNotificationsRead(user.id, [n.id])}
                className="block rounded-[var(--radius-lg)] border border-border bg-bg-elevated px-4 py-3 hover:border-border-strong"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={n.readAt ? "default" : "signal"}>
                    {KIND_LABEL[n.kind] ?? n.kind}
                  </Badge>
                  {!n.readAt && <span className="text-[11px] text-tape">Unread</span>}
                  <span className="ml-auto text-[11px] text-fg-subtle tabular-nums">
                    {formatRelative(n.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-fg">{n.message}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
