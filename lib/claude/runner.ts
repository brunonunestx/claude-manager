import path from "node:path";
import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { prisma } from "@/lib/prisma";
import { sessionEvents } from "@/lib/events";

// Tracks the AbortController for every session currently running, so a
// cancel request from the UI can stop the underlying `claude` subprocess.
const activeAborts = new Map<string, AbortController>();

export async function startSession(sessionId: string) {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      task: {
        include: {
          agent: true,
          sessions: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  const { task } = session;
  const { agent } = task;

  const contextFiles: string[] = JSON.parse(agent.contextFiles || "[]");
  const attachments: string[] = JSON.parse(task.attachments || "[]");

  // Grant Read access to whatever directories hold context files/attachments
  // that live outside the agent's own cwd.
  const additionalDirectories = Array.from(
    new Set([...contextFiles, ...attachments].map((f) => path.dirname(f)))
  ).filter((dir) => dir !== agent.cwd);

  // A reply continues the most recent prior turn's Claude Code session
  // instead of starting a fresh conversation.
  const priorTurn = task.sessions.find((s) => s.id !== session.id && s.sdkSessionId);
  const resume = priorTurn?.sdkSessionId ?? undefined;

  const abortController = new AbortController();
  activeAborts.set(sessionId, abortController);

  await prisma.session.update({
    where: { id: sessionId },
    data: { status: "running", startedAt: new Date() },
  });
  sessionEvents.publish(sessionId, { type: "status", status: "running" });

  const transcript: SDKMessage[] = [];
  let finalStatus: "done" | "error" | "canceled" = "done";
  let resultText: string | undefined;
  let errorText: string | undefined;
  let sdkSessionId: string | undefined;

  try {
    const stream = query({
      prompt: session.userMessage,
      options: {
        cwd: agent.cwd,
        systemPrompt: agent.systemPrompt,
        additionalDirectories,
        // Local single-user tool with no UI for interactive tool approval yet,
        // so the agent runs unattended. Revisit if per-tool approval is added.
        permissionMode: "bypassPermissions",
        abortController,
        resume,
      },
    });

    for await (const message of stream) {
      transcript.push(message);
      sessionEvents.publish(sessionId, { type: "message", message });

      if (!sdkSessionId && "session_id" in message && message.session_id) {
        sdkSessionId = message.session_id;
        // Persisted as soon as it's known so a reply sent while this turn is
        // still running (once that's supported) can resume from it.
        await prisma.session.update({ where: { id: sessionId }, data: { sdkSessionId } });
      }

      if (message.type === "result") {
        finalStatus = message.is_error ? "error" : "done";
        if ("result" in message) resultText = message.result;
        if (message.is_error) errorText = JSON.stringify(message);
      }
    }
  } catch (err) {
    if (abortController.signal.aborted) {
      finalStatus = "canceled";
    } else {
      finalStatus = "error";
      errorText = err instanceof Error ? err.message : String(err);
    }
  } finally {
    activeAborts.delete(sessionId);

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: finalStatus,
        resultText,
        errorText,
        transcript: JSON.stringify(transcript),
        endedAt: new Date(),
      },
    });

    sessionEvents.publish(sessionId, { type: "status", status: finalStatus });
    sessionEvents.publish(sessionId, { type: "done" });
  }
}

export function cancelSession(sessionId: string) {
  const controller = activeAborts.get(sessionId);
  if (!controller) return false;
  controller.abort();
  return true;
}
