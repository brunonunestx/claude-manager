import { NextResponse } from "next/server";
import { agentService } from "@/lib/services/agent.service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await agentService.get(id);
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(agent);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await agentService.remove(id);
  return NextResponse.json({ ok: true });
}
