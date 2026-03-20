# Contribuindo com o Dimdim

## Setup local

1. Clone o repositorio
2. Copie `.env.example` para `.env.local` e configure as variaveis
3. `npm install`
4. `npm run dev` (porta 3500)

## Estrutura do projeto

- `src/app/api/` — API Routes (Next.js App Router)
- `src/app/(dashboard)/` — Paginas protegidas
- `src/lib/` — Modulos compartilhados (auth, db, nlp, validators)
- `src/components/` — Componentes React reutilizaveis
- `src/__tests__/` — Testes unitarios (Vitest)
- `tests/e2e/` — Testes E2E (Playwright)

## Convencoes

- **API routes**: Use `withAuth()` de `@/lib/api-handler` para rotas protegidas
- **Validacao**: Use funcoes de `@/lib/validators` para validar input
- **Tipos**: Defina interfaces em `@/types/db.ts`
- **Testes**: Adicione testes para novas funcionalidades

## Padrao de API

Toda rota segue: `withAuth(handler)` -> handler recebe `(request, session)` -> retorna `NextResponse.json()`

## Testes

```bash
npm test          # Watch mode
npm run test:run  # Single run
npm run test:e2e  # E2E (requer servidor rodando)
```

## Pull Requests

1. Crie uma branch: `git checkout -b feature/nome`
2. Faca as alteracoes
3. Rode `npm run lint && npm run test:run && npm run build`
4. Abra um PR para `main`

## Deploy

Push para `main` trigga o CI/CD pipeline automaticamente.
