import { NextResponse } from "next/server";
import { recordNamed } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let deviceId: string | null = null;
  try {
    const body = await req.json();
    if (typeof body?.deviceId === "string" && body.deviceId.length <= 64) {
      deviceId = body.deviceId;
    }
  } catch {
    /* ignore */
  }
  await recordNamed(deviceId);
  return NextResponse.json({ ok: true });
}
