# DIMDIM — REAL vs MOCK (atualizado 2026-03-19 após implementações)

> Auditoria: 41/41 testes passando em produção (Vercel)
> URL: https://dimdim-snowy.vercel.app
> Login: ronald / dimdim2026

---

## ✅ REAL (funciona de verdade)

| # | Módulo | Detalhes |
|---|--------|----------|
| 1 | **Autenticação** | JWT + bcrypt + cookie httpOnly + Postgres Neon |
| 2 | **Transações CRUD** | GET/POST/PUT/DELETE + filtros + export CSV real |
| 3 | **Cartões + Catálogo** | CRUD + 36 cartões reais de bancos BR + soft-delete |
| 4 | **Programas de Pontos** | 13 programas reais + saldo + upsert |
| 5 | **Calculadora de Cartões** | Ranking real por pontos_por_real × valor |
| 6 | **Metas** | CRUD completo + progresso no dashboard |
| 7 | **Academia** | 30 aulas + quiz + progressão + controle por plano |
| 8 | **Família** | CRUD + convites com código único |
| 9 | **Configurações** | Perfil + modo_bot + humor_bot + preferências |
| 10 | **Busca de Preços** | **REAL via Mercado Livre API** — preços, imagens, links reais. Fallback simulado com aviso |
| 11 | **Bot WhatsApp** | **REAL** — registra gastos via NLP (extrai valor+categoria), busca preços, mostra resumo |
| 12 | **Bot Busca** | `/api/bot/busca` retorna preços reais formatados para WhatsApp |
| 13 | **Bot Resumo** | `/api/bot/resumo` calcula entradas/saídas/saldo real do mês |
| 14 | **Insights IA** | **REAL com Anthropic API** (Claude Sonnet) — análise personalizada. Cache 6h. Fallback estático |
| 15 | **Foto Comprovante** | **REAL via Claude Vision** — OCR extrai estabelecimento, valor, data, categoria |
| 16 | **Áudio Transcrição** | Extração de dados do texto transcrito (via IA ou regex) |
| 17 | **Relatório Mensal** | Cron Vercel (dia 1, 8h) — gera relatório + tenta enviar via OpenClaw WhatsApp |
| 18 | **Segurança** | Todas rotas protegidas por sessão. 401 para não-autenticados |

## ⚠️ PARCIAL (funciona mas com limitações)

| # | Módulo | Status | O que falta |
|---|--------|--------|-------------|
| 1 | **Busca de Preços** | Fonte única (Mercado Livre) | Adicionar Google Shopping, Buscapé, lojas diretas |
| 2 | **Bot WhatsApp** | Funciona via API + OpenClaw | Precisa Mac ligado para OpenClaw. Para escala: WhatsApp Business API (Twilio/Z-API) |
| 3 | **Pontos** | Saldo informado manualmente | Integrar APIs dos programas (Livelo, Smiles) |
| 4 | **Insights IA** | Depende de ANTHROPIC_API_KEY | Sem a key, usa insights estáticos (ainda são data-driven) |
| 5 | **Foto/Áudio** | Depende de ANTHROPIC_API_KEY | Sem a key, retorna template vazio para preenchimento manual |
| 6 | **Relatório Mensal** | Gera relatório mas envio WhatsApp via OpenClaw | Para produção: usar SendGrid/Resend para email |
| 7 | **Família** | Convite gerado mas não enviado | Falta enviar email/WhatsApp com o código |

## ❌ PENDENTE (fase 2)

| # | Módulo | Complexidade |
|---|--------|-------------|
| 1 | Integração bancária Open Finance (Pluggy) | Alta |
| 2 | APIs oficiais de programas de pontos | Alta |
| 3 | WhatsApp Business API oficial | Média |
| 4 | Notificações push nativas | Média |
| 5 | Google Agenda sync | Alta |
| 6 | Stripe / pagamentos | Alta |
| 7 | Comunidade e ranking | Média |

---

## Dependências para funcionalidade completa

| Env Var | Para quê | Status |
|---------|----------|--------|
| `POSTGRES_URL` | Banco Neon | ✅ Configurado |
| `ANTHROPIC_API_KEY` | Insights IA + Foto OCR + Áudio | ⚠️ Adicionar no Vercel |
| `CRON_SECRET` | Proteger cron endpoint | ⚠️ Adicionar no Vercel |
| `JWT_SECRET` | Auth (tem fallback) | ⚠️ Recomendado adicionar |

---

## Novas rotas implementadas

```
POST /api/bot/mensagem    — Bot inteligente (registra gasto, busca, resumo, dicas)
GET  /api/bot/busca       — Busca preços formatado para WhatsApp
GET  /api/bot/resumo      — Resumo financeiro do mês
POST /api/bot/foto        — OCR de comprovante via Claude Vision
POST /api/bot/audio       — Extração de dados de texto transcrito
GET  /api/insights        — Insights IA personalizados (cache 6h)
GET  /api/cron/relatorio-mensal — Relatório mensal automático
```

---

*41/41 testes passando em produção — 2026-03-19*
