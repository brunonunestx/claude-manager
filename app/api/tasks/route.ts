import { NextResponse } from "next/server";
import { taskService } from "@/lib/services/task.service";
import { createTaskSchema } from "@/lib/dto/task.dto";

export async function GET() {
  const tasks = await taskService.list();
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { task, session } = await taskService.createAndRun(parsed.data);
  return NextResponse.json({ task, session }, { status: 201 });
}
