import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";

export type TranscriptLine = {
  id: string;
  kind: "text" | "tool" | "system" | "result" | "other";
  label: string;
  body: string;
};

let counter = 0;
const nextId = () => `m${counter++}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Reduces the wide SDKMessage union to the handful of lines worth showing in
// a simple transcript view — most event types (hooks, retries, hints, etc.)
// are dropped rather than surfaced.
export function summarizeMessage(message: SDKMessage): TranscriptLine[] {
  const lines: TranscriptLine[] = [];

  if (message.type === "system" && message.subtype === "init") {
    lines.push({
      id: nextId(),
      kind: "system",
      label: "sessão iniciada",
      body: `modelo: ${message.model} · cwd: ${message.cwd}`,
    });
    return lines;
  }

  if (message.type === "assistant") {
    const content = message.message.content;
    for (const block of content) {
      if (!isRecord(block)) continue;
      if (block.type === "text" && typeof block.text === "string" && block.text.trim()) {
        lines.push({ id: nextId(), kind: "text", label: "Claude", body: block.text });
      } else if (block.type === "tool_use") {
        lines.push({
          id: nextId(),
          kind: "tool",
          label: `tool: ${String(block.name)}`,
          body: JSON.stringify(block.input, null, 2),
        });
      }
    }
    return lines;
  }

  if (message.type === "result") {
    lines.push({
      id: nextId(),
      kind: "result",
      label: message.is_error ? "erro" : "resultado final",
      body: "result" in message ? message.result : message.subtype,
    });
    return lines;
  }

  return lines;
}
