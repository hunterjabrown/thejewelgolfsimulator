import type { Metadata } from "next";
import { getAllSessions, getVisitStats } from "@/lib/redis";
import type { Session } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "The Jewel · Dashboard",
  robots: { index: false, follow: false, nocache: true },
};

const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => i);
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function hoursLabel(ms: number): string {
  const total = ms / 3_600_000;
  if (total >= 10) return `${total.toFixed(0)} h`;
  return `${total.toFixed(1)} h`;
}

function fmtDuration(ms: number): string {
  if (ms <= 0) return "0 m";
  const totalMin = Math.round(ms / 60_000);
  if (totalMin < 60) return `${totalMin} m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} m`;
}

function hourLabel(h: number): string {
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

type PerPlayer = {
  name: string;
  sessions: number;
  totalMs: number;
  avgMs: number;
  totalPlayers: number;
};

function computePlayerLeaderboard(sessions: Session[]): PerPlayer[] {
  const map = new Map<string, PerPlayer>();
  for (const s of sessions) {
    const key = s.name.trim().toLowerCase();
    if (!key) continue;
    const ms = Math.max(0, s.endsAt - s.startsAt);
    const existing = map.get(key);
    if (existing) {
      existing.sessions += 1;
      existing.totalMs += ms;
      existing.totalPlayers += s.players ?? 1;
    } else {
      map.set(key, {
        name: s.name.trim(),
        sessions: 1,
        totalMs: ms,
        avgMs: 0,
        totalPlayers: s.players ?? 1,
      });
    }
  }
  for (const v of map.values()) {
    v.avgMs = v.sessions ? v.totalMs / v.sessions : 0;
  }
  return Array.from(map.values()).sort(
    (a, b) => b.totalMs - a.totalMs || b.sessions - a.sessions,
  );
}

function computeHourHistogram(sessions: Session[]): number[] {
  const counts = new Array(24).fill(0);
  for (const s of sessions) {
    const hr = new Date(s.startsAt).getHours();
    counts[hr] += 1;
  }
  return counts;
}

function computeDayHistogram(sessions: Session[]): number[] {
  const counts = new Array(7).fill(0);
  for (const s of sessions) {
    const day = new Date(s.startsAt).getDay();
    counts[day] += 1;
  }
  return counts;
}

function pickPeak(counts: number[], labelFn: (i: number) => string): string {
  let max = 0;
  let idx = -1;
  counts.forEach((c, i) => {
    if (c > max) {
      max = c;
      idx = i;
    }
  });
  if (idx < 0 || max === 0) return "—";
  return `${labelFn(idx)} · ${max}`;
}

export default async function Dashboard() {
  const [sessions, visitStats] = await Promise.all([
    getAllSessions(),
    getVisitStats(),
  ]);

  const totalSessions = sessions.length;
  const totalMs = sessions.reduce(
    (sum, s) => sum + Math.max(0, s.endsAt - s.startsAt),
    0,
  );
  const totalPlayers = sessions.reduce((sum, s) => sum + (s.players ?? 1), 0);
  const avgSessionMs = totalSessions ? totalMs / totalSessions : 0;
  const avgParty = totalSessions ? totalPlayers / totalSessions : 0;
  const players = computePlayerLeaderboard(sessions);
  const uniquePlayers = players.length;
  const hourHist = computeHourHistogram(sessions);
  const dayHist = computeDayHistogram(sessions);
  const peakHour = pickPeak(hourHist, hourLabel);
  const peakDay = pickPeak(dayHist, (i) => DAY_NAMES[i]);
  const maxHourCount = Math.max(1, ...hourHist);
  const maxDayCount = Math.max(1, ...dayHist);

  const updated = new Date().toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <main className="mx-auto min-h-dvh w-full max-w-4xl px-5 py-10">
      <header className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
          The Jewel · Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-light">Sim activity</h1>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Updated {updated}
        </p>
      </header>

      <Grid>
        <Tile label="Total sessions" value={String(totalSessions)} />
        <Tile label="Unique players" value={String(uniquePlayers)} />
        <Tile label="Hours played" value={hoursLabel(totalMs)} />
        <Tile label="Avg session" value={fmtDuration(avgSessionMs)} />
        <Tile label="Page visits" value={String(visitStats.totalVisits)} />
        <Tile label="Unique scans" value={String(visitStats.uniqueDevices)} />
        <Tile
          label="Avg party"
          value={avgParty ? avgParty.toFixed(1) : "—"}
        />
        <Tile label="Peak hour" value={peakHour} />
      </Grid>

      <Section title="Most played day of week">
        <div className="grid grid-cols-7 gap-2">
          {dayHist.map((count, i) => (
            <BarCell
              key={DAY_NAMES[i]}
              label={DAY_NAMES[i]}
              count={count}
              max={maxDayCount}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Busiest day: <span className="text-white">{peakDay}</span>
        </p>
      </Section>

      <Section title="Most played hour of day">
        <div className="grid grid-cols-12 gap-1 sm:grid-cols-24">
          {HOURS_OF_DAY.map((h) => (
            <BarCell
              key={h}
              label={hourLabel(h)}
              count={hourHist[h]}
              max={maxHourCount}
              compact
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Busiest hour: <span className="text-white">{peakHour}</span>
        </p>
      </Section>

      <Section title="Player leaderboard">
        {players.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            No sessions on record yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-2)] text-left text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3 text-right">Sessions</th>
                  <th className="px-4 py-3 text-right">Hours</th>
                  <th className="px-4 py-3 text-right">Avg / session</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr
                    key={p.name + i}
                    className="border-t border-[var(--color-border)] bg-[var(--color-surface)]"
                  >
                    <td className="px-4 py-3">
                      <span className="mr-2 inline-block w-5 text-[var(--color-muted)]">
                        {i + 1}.
                      </span>
                      {p.name}
                    </td>
                    <td className="px-4 py-3 text-right">{p.sessions}</td>
                    <td className="px-4 py-3 text-right">
                      {hoursLabel(p.totalMs)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {fmtDuration(p.avgMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <p className="mt-12 text-center text-[10px] uppercase tracking-[0.32em] text-[var(--color-muted)]">
        Internal · do not share
      </p>
    </main>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-light leading-none">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function BarCell({
  label,
  count,
  max,
  compact,
}: {
  label: string;
  count: number;
  max: number;
  compact?: boolean;
}) {
  const pct = max ? Math.max(2, Math.round((count / max) * 100)) : 0;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={
          "flex w-full items-end justify-center rounded-md bg-[var(--color-surface)] " +
          (compact ? "h-16" : "h-24")
        }
      >
        <div
          className="w-full rounded-md bg-[var(--color-accent)]/80"
          style={{ height: count > 0 ? `${pct}%` : "0" }}
          aria-label={`${label}: ${count}`}
        />
      </div>
      <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
        {label}
      </span>
      <span className="text-[10px] text-white/80">{count}</span>
    </div>
  );
}
