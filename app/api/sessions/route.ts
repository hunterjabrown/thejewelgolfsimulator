import { NextResponse } from "next/server";
import { addSession, getAllSessions } from "@/lib/redis";
import type { CreateSessionInput, Session } from "@/lib/types";
import { formatTime } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NAME_LEN = 40;
const MAX_PLAYERS = 8;
const MIN_DURATION_MIN = 15;
const MAX_DURATION_MIN = 6 * 60;

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export async function GET() {
  const sessions = await getAllSessions();
  return NextResponse.json({ sessions, now: Date.now() });
}

export async function POST(req: Request) {
  let body: Partial<CreateSessionInput>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return bad("Name is required");
  if (name.length > MAX_NAME_LEN) return bad("Name too long");

  if (!isFiniteNumber(body.startsAt) || !isFiniteNumber(body.endsAt)) {
    return bad("startsAt and endsAt required");
  }
  if (body.endsAt <= body.startsAt) return bad("endsAt must be after startsAt");

  const durationMin = (body.endsAt - body.startsAt) / 60000;
  if (durationMin < MIN_DURATION_MIN) return bad("Session too short");
  if (durationMin > MAX_DURATION_MIN) return bad("Session too long");

  const players = isFiniteNumber(body.players) ? Math.floor(body.players) : 1;
  if (players < 1 || players > MAX_PLAYERS) return bad("Players out of range");

  const openToJoin = Boolean(body.openToJoin);

  const now = Date.now();
  const MAX_HORIZON_MS = 24 * 60 * 60 * 1000;

  if (body.startsAt > now + MAX_HORIZON_MS) {
    return bad("Day-of scheduling only — pick a time within the next 24 hours");
  }
  if (body.endsAt < now - 60_000) {
    return bad("Cannot create a session in the past");
  }

  const existing = await getAllSessions();
  const blocker = existing.find(
    (s) =>
      !s.openToJoin &&
      s.startsAt < body.endsAt! &&
      body.startsAt! < s.endsAt,
  );
  if (blocker) {
    return NextResponse.json(
      {
        error: `${blocker.name} reserved the sim from ${formatTime(blocker.startsAt)} to ${formatTime(blocker.endsAt)} (no joiners). Pick a time outside that window.`,
      },
      { status: 409 },
    );
  }

  const session: Session = {
    id: crypto.randomUUID(),
    name,
    startsAt: body.startsAt,
    endsAt: body.endsAt,
    players,
    openToJoin,
    createdAt: now,
  };

  const sessions = await addSession(session);
  return NextResponse.json({ session, sessions, now: Date.now() }, { status: 201 });
}
