# The Self Map: guia para agentes

Detalhes de stack, estrutura e decisões em `.claude/CLAUDE.md`.

- Gerenciador: pnpm. Antes de concluir: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
- Nunca editar à mão `src/routeTree.gen.ts` nem `src/integrations/supabase/types.ts` (gerados).
- Alterações de banco só via `supabase/migrations/`, antes do código que as usa.
- Segredos nunca em arquivo versionado nem com prefixo `VITE_` (exceto URL e publishable key do Supabase).
- Identificadores em inglês, textos de UI em pt-BR.
- Fluxo: branch própria, commits atômicos (conventional commits) e PR. Nunca push direto na `main`.
