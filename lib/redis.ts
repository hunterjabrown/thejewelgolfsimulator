import { Redis } from "@upstash/redis";
import type { Session } from "./types";

let _redis: Redis | null = null;
function redis(): Redis {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

const SESSIONS_KEY = "lux:sessions";

const MS_PER_HOUR = 60 * 60 * 1000;
const RETENTION_MS = 36 * MS_PER_HOUR;

export async function getAllSessions(): Promise<Session[]> {
  const raw = await redis().get<Session[] | string>(SESSIONS_KEY);
  if (!raw) return [];
  const sessions = typeof raw === "string" ? (JSON.parse(raw) as Session[]) : raw;
  return Array.isArray(sessions) ? sessions : [];
}

async function writeSessions(sessions: Session[]): Promise<void> {
  await redis().set(SESSIONS_KEY, JSON.stringify(sessions));
}

function pruneOld(sessions: Session[], now: number): Session[] {
  return sessions.filter((s) => s.endsAt > now - RETENTION_MS);
}

export async function addSession(session: Session): Promise<Session[]> {
  const now = Date.now();
  const existing = await getAllSessions();
  const next = pruneOld([...existing, session], now);
  await writeSessions(next);
  return next;
}

export async function deleteSession(id: string): Promise<Session[]> {
  const now = Date.now();
  const existing = await getAllSessions();
  const next = pruneOld(
    existing.filter((s) => s.id !== id),
    now,
  );
  await writeSessions(next);
  return next;
}
