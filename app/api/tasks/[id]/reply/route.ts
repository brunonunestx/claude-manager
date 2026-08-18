import { NextResponse } from "next/server";
import { taskService } from "@/lib/services/task.service";
import { replySchema } from "@/lib/dto/reply.dto";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await taskService.reply(id, parsed.data.message);
    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "não foi possível continuar a tarefa";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
