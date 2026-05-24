"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NameGate } from "@/components/NameGate";
import { ScheduleList } from "@/components/ScheduleList";
import { SessionDialog } from "@/components/SessionDialog";
import { StatusCard } from "@/components/StatusCard";
import type { CreateSessionInput, Session } from "@/lib/types";

const NAME_KEY = "lux-golf:name";
const DEVICE_KEY = "lux-golf:device";
const POLL_MS = 15_000;

type DialogMode = "now" | "schedule" | null;

export default function HomePage() {
  const [name, setName] = useState<string | null>(null);
  const [nameReady, setNameReady] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [serverOffset, setServerOffset] = useState(0);
  const [tick, setTick] = useState(0);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(NAME_KEY);
      if (stored) setName(stored);
    } catch {
      /* ignore */
    }
    setNameReady(true);

    let deviceId: string | null = null;
    try {
      deviceId = window.localStorage.getItem(DEVICE_KEY);
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        window.localStorage.setItem(DEVICE_KEY, deviceId);
      }
    } catch {
      /* ignore */
    }
    fetch("/api/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  const saveName = useCallback((n: string) => {
    setName(n);
    try {
      window.localStorage.setItem(NAME_KEY, n);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { sessions: Session[]; now: number };
      setSessions(data.sessions);
      setServerOffset(data.now - Date.now());
      setLoadError(null);
      setLoaded(true);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Network error");
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now() + serverOffset;

  const current = useMemo(() => {
    return (
      sessions
        .filter((s) => s.startsAt <= now && s.endsAt > now)
        .sort((a, b) => a.startsAt - b.startsAt)[0] ?? null
    );
  }, [sessions, now]);

  const upcoming = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = startOfToday.getTime() + 24 * 60 * 60 * 1000;
    return sessions
      .filter(
        (s) => s.startsAt > now && s.startsAt < endOfToday && s !== current,
      )
      .sort((a, b) => a.startsAt - b.startsAt);
  }, [sessions, now, current]);

  const handleSubmit = useCallback(
    async (input: CreateSessionInput) => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(data.error ?? "Could not save");
      }
      const data = (await res.json()) as { sessions: Session[]; now: number };
      setSessions(data.sessions);
      setServerOffset(data.now - Date.now());
      setDialog(null);
    },
    [],
  );

  const handleDelete = useCallback(async (id: string) => {
    const ok = window.confirm("Cancel this slot?");
    if (!ok) return;
    const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    const data = (await res.json()) as { sessions: Session[]; now: number };
    setSessions(data.sessions);
    setServerOffset(data.now - Date.now());
  }, []);

  // Reference `tick` so the countdown in StatusCard refreshes each second.
  void tick;

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 py-8 pb-24">
      <header className="flex flex-col items-center gap-3 pt-2 text-center">
        <Image
          src="/logo.webp"
          alt="LUX by Garden"
          width={160}
          height={120}
          priority
          className="h-20 w-auto"
        />
        <div>
          <h1 className="text-xl font-light tracking-[0.32em] uppercase">
            The Jewel
          </h1>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
            Golf Simulator
          </p>
        </div>
        <p className="text-xs text-[var(--color-muted)]">{todayLabel()}</p>
        {name && (
          <button
            onClick={() => {
              const next = window.prompt("Your name?", name);
              if (next && next.trim()) saveName(next.trim());
            }}
            className="absolute right-5 top-8 text-xs text-[var(--color-muted)] hover:text-white"
          >
            {name}
          </button>
        )}
      </header>

      {loaded ? (
        <StatusCard
          current={current}
          now={now}
          myName={name}
          onEnd={handleDelete}
        />
      ) : (
        <div className="h-44 animate-pulse rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={() => setDialog("now")}
          disabled={!name}
          className="rounded-2xl bg-white px-4 py-4 text-base font-medium text-black transition disabled:opacity-40"
        >
          I'm playing right now
        </button>
        <button
          onClick={() => setDialog("schedule")}
          disabled={!name}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 text-base font-medium transition hover:border-white/40 disabled:opacity-40"
        >
          Schedule a slot today
        </button>
        <p className="px-1 text-center text-[11px] leading-relaxed text-[var(--color-muted)]">
          Day-of scheduling only — no booking ahead, so everyone gets a fair
          shot at the sim.
        </p>
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Coming up today
          </h2>
          {upcoming.length > 0 && (
            <span className="text-xs text-[var(--color-muted)]">
              {upcoming.length} {upcoming.length === 1 ? "slot" : "slots"}
            </span>
          )}
        </div>
        <ScheduleList
          sessions={upcoming}
          myName={name}
          onDelete={handleDelete}
        />
      </section>

      {loadError && (
        <p className="text-center text-xs text-[var(--color-busy)]">
          Couldn't reach the server. Retrying…
        </p>
      )}

      <footer className="mt-auto pt-6 text-center text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
        Honor system · be cool · clean up after
      </footer>

      {nameReady && !name && <NameGate onSave={saveName} />}
      {dialog && name && (
        <SessionDialog
          mode={dialog}
          name={name}
          onClose={() => setDialog(null)}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}

function todayLabel(): string {
  return new Date().toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
