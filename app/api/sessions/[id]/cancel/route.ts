import { NextResponse } from "next/server";
import { cancelSession } from "@/lib/claude/runner";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const canceled = cancelSession(id);
  return NextResponse.json({ canceled });
}
