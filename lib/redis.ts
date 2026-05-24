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
const VISITS_COUNTER_KEY = "lux:visits";
const DEVICES_SET_KEY = "lux:devices";

export async function getAllSessions(): Promise<Session[]> {
  const raw = await redis().get<Session[] | string>(SESSIONS_KEY);
  if (!raw) return [];
  const sessions = typeof raw === "string" ? (JSON.parse(raw) as Session[]) : raw;
  return Array.isArray(sessions) ? sessions : [];
}

async function writeSessions(sessions: Session[]): Promise<void> {
  await redis().set(SESSIONS_KEY, JSON.stringify(sessions));
}

export async function addSession(session: Session): Promise<Session[]> {
  const existing = await getAllSessions();
  const next = [...existing, session];
  await writeSessions(next);
  return next;
}

export async function deleteSession(id: string): Promise<Session[]> {
  const existing = await getAllSessions();
  const next = existing.filter((s) => s.id !== id);
  await writeSessions(next);
  return next;
}

export async function recordVisit(deviceId: string | null): Promise<void> {
  const client = redis();
  const ops: Promise<unknown>[] = [client.incr(VISITS_COUNTER_KEY)];
  if (deviceId) {
    ops.push(client.sadd(DEVICES_SET_KEY, deviceId));
  }
  await Promise.all(ops);
}

export async function getVisitStats(): Promise<{
  totalVisits: number;
  uniqueDevices: number;
}> {
  const client = redis();
  const [visits, devices] = await Promise.all([
    client.get<number>(VISITS_COUNTER_KEY),
    client.scard(DEVICES_SET_KEY),
  ]);
  return {
    totalVisits: typeof visits === "number" ? visits : Number(visits ?? 0),
    uniqueDevices: typeof devices === "number" ? devices : 0,
  };
}
