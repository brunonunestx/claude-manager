import { NextResponse } from "next/server";
import { agentService } from "@/lib/services/agent.service";
import { createAgentSchema } from "@/lib/dto/agent.dto";

export async function GET() {
  const agents = await agentService.list();
  return NextResponse.json(agents);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const agent = await agentService.create(parsed.data);
  return NextResponse.json(agent, { status: 201 });
}
