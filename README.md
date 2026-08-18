# Claude Manager

Gerenciador local de sessões do Claude Code: crie tarefas com contexto e arquivos, dispare
sessões em paralelo (cada uma roda o binário do Claude Code como subprocesso via
`@anthropic-ai/claude-agent-sdk`) e acompanhe o status/transcript de cada uma em tempo real.

## Stack

- Next.js (App Router) + TypeScript — UI e API routes num único app
- Prisma + SQLite (`dev.db` na raiz do projeto) — persistência de agentes/tarefas/sessões
- `@anthropic-ai/claude-agent-sdk` — dispara cada sessão como um processo `claude` isolado
- SSE (`/api/sessions/[id]/stream`) — transcript e status ao vivo na tela da sessão

## Modelo

- **Agent** — preset reutilizável: nome, system prompt, diretório do projeto (`cwd`) e arquivos
  de contexto sempre carregados (ex: um agente "Scoder" apontando pro CLAUDE.md do projeto Scoder).
- **Task** — o pedido: agente escolhido, prompt, contexto extra livre e arquivos anexados.
- **Session** — uma execução de uma task. Guarda status (`queued`/`running`/`done`/`error`/`canceled`)
  e o transcript completo dos eventos do SDK.

## Rodando localmente

Requer autenticação do Claude Code já configurada na máquina (`claude` já logado, ou
`ANTHROPIC_API_KEY` no ambiente) — é o mesmo processo `claude` que a SDK sobe por baixo.

```bash
npm install
npx prisma migrate dev   # primeira vez, cria/atualiza o dev.db
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

> Nota: se o shell tiver `NODE_OPTIONS=--use-system-ca` definido, o build (`next build`) falha
> com `ERR_WORKER_INVALID_EXEC_ARGV` — é uma incompatibilidade do Next com essa flag em
> `NODE_OPTIONS`, não um problema do projeto. Rode com `NODE_OPTIONS= npm run build` se precisar.

## Observações de arquitetura

- Sessões rodam em memória no processo do servidor Next (`lib/claude/runner.ts` guarda os
  `AbortController`s ativos) — cancelar reinicia o servidor perde o controle das sessões em
  andamento, mas o histórico já persistido no SQLite continua íntegro.
- `permissionMode: "bypassPermissions"` está fixo no runner — não há UI de aprovação de tool
  use ainda, então cada sessão roda sem parar pra pedir permissão. Ajuste em
  `lib/claude/runner.ts` se quiser um modo mais conservador.
- Uploads de anexos ficam em `./uploads` (fora do controle de versão) e o `cwd`/diretórios de
  contexto do agente são liberados via `additionalDirectories` pro Claude conseguir ler.
