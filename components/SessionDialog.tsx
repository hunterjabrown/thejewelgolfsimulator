"use client";

import { useEffect, useMemo, useState } from "react";
import type { CreateSessionInput } from "@/lib/types";
import {
  endOfLocalDay,
  fromLocalDatetimeInputValue,
  roundToNext,
  toLocalDatetimeInputValue,
} from "@/lib/time";

type Mode = "now" | "schedule";

const DURATIONS = [
  { label: "30m", min: 30 },
  { label: "1h", min: 60 },
  { label: "1.5h", min: 90 },
  { label: "2h", min: 120 },
  { label: "3h", min: 180 },
];

export function SessionDialog({
  mode,
  name,
  onClose,
  onSubmit,
}: {
  mode: Mode;
  name: string;
  onClose: () => void;
  onSubmit: (input: CreateSessionInput) => Promise<void>;
}) {
  const [durationMin, setDurationMin] = useState(60);
  const [players, setPlayers] = useState(1);
  const [openToJoin, setOpenToJoin] = useState(true);
  const [startInput, setStartInput] = useState(() =>
    toLocalDatetimeInputValue(roundToNext(15, Date.now() + 15 * 60_000)),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayEnd = useMemo(() => endOfLocalDay(), []);
  const maxStartInput = useMemo(
    () => toLocalDatetimeInputValue(dayEnd - 15 * 60_000),
    [dayEnd],
  );
  const minStartInput = useMemo(
    () => toLocalDatetimeInputValue(roundToNext(5, Date.now())),
    [],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const startsAt =
        mode === "now" ? Date.now() : fromLocalDatetimeInputValue(startInput);
      const endsAt = startsAt + durationMin * 60_000;

      if (mode === "schedule" && startsAt >= dayEnd) {
        setError("Day-of scheduling only — pick a time today.");
        return;
      }
      if (mode === "schedule" && startsAt < Date.now() - 60_000) {
        setError("Pick a time in the future.");
        return;
      }

      await onSubmit({
        name,
        startsAt,
        endsAt,
        players,
        openToJoin,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === "now" ? "I'm playing right now" : "Schedule a slot";
  const cta = mode === "now" ? "Mark me on the sim" : "Add to today";

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-t-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {mode === "schedule" && (
          <>
            <div className="mb-5 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 p-3 text-xs leading-relaxed">
              <p className="font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                Day-of scheduling only
              </p>
              <p className="mt-1 text-white/80">
                Slots open the day they're for — no booking ahead. Keeps it
                fair for everyone in the building.
              </p>
            </div>
            <Field label="Start time (today)">
              <input
                type="datetime-local"
                value={startInput}
                min={minStartInput}
                max={maxStartInput}
                step={300}
                onChange={(e) => setStartInput(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-base outline-none focus:border-[var(--color-accent)]"
              />
            </Field>
          </>
        )}

        <Field label="How long?">
          <div className="grid grid-cols-5 gap-2">
            {DURATIONS.map((d) => (
              <Chip
                key={d.min}
                selected={durationMin === d.min}
                onClick={() => setDurationMin(d.min)}
              >
                {d.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Players">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPlayers((p) => Math.max(1, p - 1))}
              className="h-10 w-10 rounded-full border border-[var(--color-border)] text-lg leading-none disabled:opacity-30"
              disabled={players <= 1}
              aria-label="Fewer players"
            >
              −
            </button>
            <div className="flex-1 text-center text-2xl font-light">
              {players}
            </div>
            <button
              type="button"
              onClick={() => setPlayers((p) => Math.min(8, p + 1))}
              className="h-10 w-10 rounded-full border border-[var(--color-border)] text-lg leading-none disabled:opacity-30"
              disabled={players >= 8}
              aria-label="More players"
            >
              +
            </button>
          </div>
        </Field>

        <Field label="Cool with others joining?">
          <div className="flex gap-2">
            <Chip selected={openToJoin} onClick={() => setOpenToJoin(true)}>
              Yes, come hang
            </Chip>
            <Chip selected={!openToJoin} onClick={() => setOpenToJoin(false)}>
              Prefer not
            </Chip>
          </div>
        </Field>

        {error && (
          <p className="mt-3 text-sm text-[var(--color-busy)]">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-xl bg-white px-4 py-3.5 text-base font-medium text-black transition disabled:opacity-50"
        >
          {submitting ? "Saving…" : cta}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
        {label}
      </p>
      {children}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 rounded-xl border px-3 py-2.5 text-sm transition " +
        (selected
          ? "border-white bg-white text-black"
          : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-white/80 hover:border-white/40")
      }
    >
      {children}
    </button>
  );
}
