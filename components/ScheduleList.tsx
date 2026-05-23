"use client";

import type { Session } from "@/lib/types";
import { formatTime } from "@/lib/time";

export function ScheduleList({
  sessions,
  myName,
  onDelete,
}: {
  sessions: Session[];
  myName: string | null;
  onDelete: (id: string) => void;
}) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-muted)]">
        Nothing else on the books today.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {sessions.map((s) => {
        const mine = myName != null && s.name.toLowerCase() === myName.toLowerCase();
        return (
          <li
            key={s.id}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-medium truncate">
                  {formatTime(s.startsAt)} – {formatTime(s.endsAt)}
                </p>
                <p className="text-sm text-[var(--color-muted)] truncate">
                  {s.name} · {s.players === 1 ? "solo" : `${s.players} players`}
                  {s.openToJoin ? " · open to join" : ""}
                </p>
              </div>
              {mine && (
                <button
                  onClick={() => onDelete(s.id)}
                  className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-white hover:border-white/40"
                  aria-label="Remove my slot"
                >
                  Cancel
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
