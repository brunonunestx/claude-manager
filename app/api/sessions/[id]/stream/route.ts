import { sessionEvents } from "@/lib/events";
import { sessionService } from "@/lib/services/session.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const session = await sessionService.get(id);
      if (!session) {
        send({ type: "error", error: "session not found" });
        controller.close();
        return;
      }

      // Replay what's already persisted so a client connecting mid-run (or
      // after a finished run) sees the full transcript immediately.
      send({
        type: "snapshot",
        status: session.status,
        transcript: JSON.parse(session.transcript),
      });

      if (session.status !== "queued" && session.status !== "running") {
        controller.close();
        return;
      }

      const unsubscribe = sessionEvents.subscribe(id, (event) => {
        send(event);
        if (event.type === "done") {
          closed = true;
          unsubscribe();
          controller.close();
        }
      });

      req.signal.addEventListener("abort", () => {
        closed = true;
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
