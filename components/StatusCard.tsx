"use client";

import type { Session } from "@/lib/types";
import { formatDuration, formatTime } from "@/lib/time";

export function StatusCard({
  current,
  now,
  myName,
  onEnd,
}: {
  current: Session | null;
  now: number;
  myName: string | null;
  onEnd: (id: string) => void;
}) {
  if (!current) {
    return (
      <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7">
        <div className="flex items-center gap-3 text-[var(--color-accent)]">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em]">
            Available
          </span>
        </div>
        <p className="mt-4 text-3xl font-light leading-tight">
          The sim is free.
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Tap below if you're heading in.
        </p>
      </section>
    );
  }

  const remaining = current.endsAt - now;
  const playerLabel =
    current.players === 1 ? "Solo" : `${current.players} players`;
  const mine =
    myName != null && current.name.toLowerCase() === myName.toLowerCase();

  return (
    <section className="rounded-3xl border border-[var(--color-busy)]/30 bg-gradient-to-br from-[var(--color-busy)]/15 to-transparent p-7">
      <div className="flex items-center gap-3 text-[var(--color-busy)]">
        <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-[var(--color-busy)]" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">
          On the sim
        </span>
      </div>
      <p className="mt-4 text-3xl font-light leading-tight">{current.name}</p>
      <dl className="mt-5 grid grid-cols-2 gap-y-3 text-sm">
        <dt className="text-[var(--color-muted)]">Players</dt>
        <dd className="text-right">{playerLabel}</dd>
        <dt className="text-[var(--color-muted)]">Until</dt>
        <dd className="text-right">{formatTime(current.endsAt)}</dd>
        <dt className="text-[var(--color-muted)]">Remaining</dt>
        <dd className="text-right">{formatDuration(remaining)}</dd>
        <dt className="text-[var(--color-muted)]">Open to join</dt>
        <dd className="text-right">{current.openToJoin ? "Yes" : "No"}</dd>
      </dl>
      {mine && (
        <button
          onClick={() => onEnd(current.id)}
          className="mt-5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-medium text-white/90 transition hover:border-white/40"
        >
          Done playing — free the sim
        </button>
      )}
    </section>
  );
}
