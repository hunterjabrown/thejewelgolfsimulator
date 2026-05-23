import { Redis } from "@upstash/redis";
import type { Session } from "./types";

let _redis: Redis | null = null;
function redis(): Redis {
  if (_redis) return _redis;
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Missing Redis credentials: set UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN",
    );
  }
  _redis = new Redis({ url, token });
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
