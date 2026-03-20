# Dimdim — Assistente Financeiro Pessoal

Controle suas finanças via WhatsApp ou dashboard web. Registre gastos com mensagens simples como "30 bigpao", veja resumos, busque preços e receba insights de IA.

## Stack
- **Frontend:** Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes + Vercel Postgres (Neon)
- **Bot:** OpenClaw + GPT-4o-mini + WhatsApp (Baileys)
- **IA:** Anthropic Claude (insights) + Mercado Livre API (preços)

## Setup Local

```bash
git clone <repo-url>
cd dimdim
npm install
cp .env.example .env.local
# Preencha as variáveis no .env.local
npm run dev  # http://localhost:3500
```

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|------------|-----------|
| POSTGRES_URL | Sim | URL do Vercel Postgres |
| JWT_SECRET | Recomendado | Segredo JWT (tem fallback dev) |
| ANTHROPIC_API_KEY | Não | Insights IA (fallback estático) |
| CRON_SECRET | Não | Proteção do cron endpoint |

## Comandos do Bot (WhatsApp)

| Mensagem | Ação |
|----------|------|
| `30 bigpao` | Registra gasto de R$30 |
| `gastei 50 no ifood` | Registra gasto de R$50 em Alimentação |
| `resumo` / `saldo` / `extrato` | Resumo financeiro do mês |
| `busca iphone` | Busca preços no Mercado Livre |

## Formatos aceitos pelo NLP

- `[valor] [lugar]` — "30 bigpao", "50 ifood", "150 luz"
- `gastei/paguei/comprei [valor] [lugar]` — "gastei 50 no ifood"
- `R$[valor] [lugar]` — "R$150 luz"
- `[valor],[centavos] [lugar]` — "30,50 padaria"

## Testes

```bash
npm test          # Vitest watch mode
npm run test:run  # Roda uma vez
```

## Deploy

Deploy automático via Vercel. Push para main → deploy em produção.

## Arquitetura

```
WhatsApp → OpenClaw (GPT-4o-mini) → POST /api/bot/mensagem → NLP → Postgres → Resposta
Browser  → Dashboard React → API Routes → Postgres → JSON
```

### CD Automático

O deploy para produção é feito automaticamente via GitHub Actions ao fazer push na branch `main`.

**Configuração:**

1. Adicione os seguintes **GitHub Secrets** no repositório (Settings → Secrets and variables → Actions):
   - `VERCEL_TOKEN` — Token de acesso da Vercel (gere em vercel.com/account/tokens)
   - `VERCEL_ORG_ID` — ID da organização na Vercel (encontre em vercel.com/account)
   - `VERCEL_PROJECT_ID` — ID do projeto na Vercel (encontre em Project Settings → General)

2. **Pipeline:** O workflow executa em sequência: `lint` → `typecheck` → `test` → `deploy`

3. O deploy só acontece em push para a branch `main`. Pull requests executam apenas lint, typecheck e testes.

## Licença

Privado — Ronald Santos Assolari
