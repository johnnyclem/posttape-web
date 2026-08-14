import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { usePosttape } from "@/lib/store";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function NoticeBell() {
  const { user, isPending } = useCurrentUserState();
  const unreadCount = usePosttape((s) => s.unreadCount);
  const notificationsFor = usePosttape((s) => s.notificationsFor);
  const markNotificationsRead = usePosttape((s) => s.markNotificationsRead);
  const notifications = usePosttape((s) => s.notifications);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const count = user ? unreadCount(user.id) : 0;
  const recent = user ? notificationsFor(user.id).slice(0, 6) : [];
  void notifications;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (isPending || !user) return null;

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        className="relative inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-fg-muted hover:bg-bg-subtle hover:text-fg"
        aria-label={count ? `${count} unread notifications` : "Notifications"}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute right-1 top-1 min-w-3.5 rounded-full bg-tape px-1 text-[9px] font-medium leading-3.5 text-bg tabular-nums">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-elevated shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-medium">Notifications</span>
            {count > 0 && (
              <button
                type="button"
                className="text-[11px] text-fg-subtle hover:text-fg"
                onClick={() => markNotificationsRead(user.id)}
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-auto">
            {recent.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-fg-subtle">
                Quiet desk. No tape yet.
              </li>
            )}
            {recent.map((n) => (
              <li key={n.id} className="border-b border-border last:border-0">
                <Link
                  to={n.url ?? "/notifications"}
                  onClick={() => {
                    markNotificationsRead(user.id, [n.id]);
                    setOpen(false);
                  }}
                  className={cn(
                    "block px-3 py-2.5 hover:bg-bg-subtle/60",
                    !n.readAt && "bg-signal/5",
                  )}
                >
                  <div className="text-xs text-fg">{n.message}</div>
                  <div className="mt-0.5 text-[11px] text-fg-subtle tabular-nums">
                    {formatRelative(n.createdAt)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-3 py-2 text-center text-xs text-fg-muted hover:text-fg"
          >
            Open inbox
          </Link>
        </div>
      )}
    </div>
  );
}
