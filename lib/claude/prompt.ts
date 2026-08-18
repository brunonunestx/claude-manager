// Assembles the message sent to Claude for the first turn of a task. Later
// turns (replies) skip this — they just send the raw reply text, since the
// resumed conversation already has the task prompt/context in its history.
export function buildInitialPrompt(params: {
  taskPrompt: string;
  extraContext?: string | null;
  contextFiles: string[];
  attachments: string[];
}) {
  const parts = [params.taskPrompt];

  if (params.extraContext) {
    parts.push(`\nContexto adicional fornecido para esta tarefa:\n${params.extraContext}`);
  }

  if (params.contextFiles.length > 0) {
    parts.push(
      `\nArquivos de contexto fixos do agente (leia-os antes de começar):\n${params.contextFiles
        .map((f) => `- ${f}`)
        .join("\n")}`
    );
  }

  if (params.attachments.length > 0) {
    parts.push(
      `\nArquivos anexados especificamente a esta tarefa:\n${params.attachments
        .map((f) => `- ${f}`)
        .join("\n")}`
    );
  }

  return parts.join("\n");
}
