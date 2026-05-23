import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const sessions = await deleteSession(id);
  return NextResponse.json({ sessions, now: Date.now() });
}
