import Link from "next/link";
import {
  Bot,
  ExternalLink,
  Layers,
  MessageSquareText,
  Paperclip,
  Radio,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getLatestRelease } from "@/lib/github";
import { DownloadButtons } from "@/components/download-buttons";

const REPO_URL = "https://github.com/brunonunestx/claude-manager";

const FEATURES = [
  {
    icon: Users,
    title: "Agentes com contexto fixo",
    description:
      "Monte presets reutilizáveis — system prompt, diretório do projeto e arquivos de contexto sempre carregados. Um agente por cliente/produto.",
  },
  {
    icon: Layers,
    title: "Sessões em paralelo",
    description:
      "Dispare várias tarefas ao mesmo tempo e acompanhe o status de cada uma — cada sessão roda isolada, sem uma travar a outra.",
  },
  {
    icon: MessageSquareText,
    title: "Continue a conversa",
    description:
      "Responda dentro de uma tarefa e o Claude retoma o histórico real da sessão anterior — sem perder o contexto do que já foi feito.",
  },
  {
    icon: Paperclip,
    title: "Contexto e anexos por tarefa",
    description:
      "Além do prompt, anexe arquivos e escreva contexto extra específico daquela tarefa, sem misturar com o preset do agente.",
  },
  {
    icon: Radio,
    title: "Acompanhe em tempo real",
    description:
      "Veja o raciocínio, as tool calls e o resultado final aparecendo ao vivo conforme o Claude trabalha, via streaming.",
  },
  {
    icon: ShieldCheck,
    title: "100% local",
    description:
      "Roda inteiramente na sua máquina — banco SQLite local, sem servidor externo. Seus dados não saem do seu computador.",
  },
];

export default async function Home() {
  const release = await getLatestRelease();

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-16 sm:py-24">
      {/* Hero */}
      <div className="flex size-16 items-center justify-center rounded-2xl bg-neutral-900 text-orange-500">
        <Bot className="size-8" />
      </div>

      <h1 className="mt-6 text-center text-4xl font-semibold tracking-tight sm:text-5xl">
        Claude Manager
      </h1>

      <p className="mt-4 max-w-xl text-center text-lg text-neutral-400">
        Transforme o Claude Code num app de verdade: crie tarefas, monte agentes com contexto
        próprio e rode várias sessões em paralelo — tudo local, num instalável pra desktop.
      </p>

      <div className="mt-10 flex w-full flex-col items-center gap-4">
        <DownloadButtons assets={release?.assets ?? []} />
        {release && (
          <p className="text-sm text-neutral-500">
            versão {release.version} ·{" "}
            <a href={`${REPO_URL}/releases`} className="hover:text-neutral-300 hover:underline">
              ver todas as versões
            </a>
          </p>
        )}
        {!release && (
          <a
            href={`${REPO_URL}/releases/latest`}
            className="text-sm text-orange-500 hover:underline"
          >
            Ver releases no GitHub
          </a>
        )}
      </div>

      {/* Mockup */}
      <div className="mt-20 w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        <div className="flex items-center gap-1.5 border-b border-neutral-800 bg-neutral-900 px-4 py-3">
          <span className="size-2.5 rounded-full bg-neutral-700" />
          <span className="size-2.5 rounded-full bg-neutral-700" />
          <span className="size-2.5 rounded-full bg-neutral-700" />
        </div>
        <div className="grid grid-cols-[64px_1fr] bg-neutral-950">
          <div className="flex flex-col items-center gap-3 border-r border-neutral-900 py-6">
            <div className="flex size-9 items-center justify-center rounded-xl bg-neutral-800 text-orange-500">
              <Bot className="size-4" />
            </div>
            <div className="size-9 rounded-xl bg-orange-600" />
            <div className="size-9 rounded-xl bg-neutral-900" />
          </div>
          <div className="space-y-3 p-6">
            {[
              { agent: "Scoder", status: "running", color: "bg-blue-600/20 text-blue-400" },
              { agent: "Trezio", status: "done", color: "bg-green-600/20 text-green-400" },
              { agent: "iPass", status: "queued", color: "bg-neutral-700 text-neutral-300" },
            ].map((row) => (
              <div
                key={row.agent}
                className="flex items-center justify-between rounded-xl border border-neutral-900 bg-neutral-900/60 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-neutral-700" />
                  <span className="text-sm text-neutral-300">{row.agent}</span>
                  <div className="h-2 w-40 rounded-full bg-neutral-800 sm:w-64" />
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.color}`}>
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-24 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-2xl border border-neutral-800 p-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-900 text-orange-500">
              <Icon className="size-5" />
            </div>
            <h3 className="mt-4 font-medium text-neutral-100">{title}</h3>
            <p className="mt-1.5 text-sm text-neutral-400">{description}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-24 flex flex-col items-center gap-3 border-t border-neutral-900 pt-8 text-sm text-neutral-500">
        <Link
          href={REPO_URL}
          className="flex items-center gap-1.5 hover:text-neutral-300 hover:underline"
        >
          <ExternalLink className="size-4" />
          brunonunestx/claude-manager
        </Link>
        <p>Ferramenta pessoal de desenvolvimento — código aberto.</p>
      </footer>
    </div>
  );
}
