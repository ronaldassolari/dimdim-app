# ROADMAP DE INTEGRAÇÕES — DIMDIM

**Última atualização:** 2026-03-18
**Status atual:** MVP funcional com dados mock. Nenhuma integração externa ativa.

---

## MATRIZ DE PRIORIZAÇÃO

| Prioridade | Critério |
|------------|----------|
| **P0 — Crítica** | Sem isso, o produto não gera receita |
| **P1 — Alta** | Core do produto. Diferencial competitivo direto |
| **P2 — Média** | Melhora retenção e experiência, mas funciona sem |
| **P3 — Baixa** | Nice-to-have. Fase de escala |

---

## FASE 1 — FUNDAÇÃO MONETIZÁVEL (Semanas 1-3)

> Objetivo: Cobrar assinatura e ter bot funcional via WhatsApp

---

### 1.1 Stripe — Pagamentos e Assinaturas

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Processa pagamentos recorrentes dos planos Lite (R$ 19,90) e Pro (R$ 49,90). Gerencia trials, upgrades, downgrades, cancelamentos e cobranças de membros familiares extras (+R$ 5/mês) |
| **Prioridade** | P0 — Sem pagamento, sem receita |
| **Complexidade** | Média |
| **Custo** | 3,99% + R$ 0,39 por transação (Stripe BR). Sem mensalidade fixa |
| **Como implementar** | 1. `npm install stripe` 2. Criar conta Stripe com BRL habilitado 3. Criar Products e Prices para cada plano (mensal + anual) 4. Novo endpoint `POST /api/pagamentos/checkout` — gera Stripe Checkout Session 5. Novo endpoint `POST /api/pagamentos/webhook` — recebe eventos (checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed) 6. Atualizar tabela `assinaturas` e campo `plano` do user automaticamente 7. Adicionar `stripe_customer_id` e `stripe_subscription_id` na tabela `users` 8. Customer Portal para o usuário gerenciar próprio plano 9. Lógica de trial Pro 30 dias sem cartão |
| **Endpoints novos** | `POST /api/pagamentos/checkout`, `POST /api/pagamentos/webhook`, `POST /api/pagamentos/portal`, `GET /api/pagamentos/historico` |
| **Variáveis .env** | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_LITE_MENSAL`, `STRIPE_PRICE_LITE_ANUAL`, `STRIPE_PRICE_PRO_MENSAL`, `STRIPE_PRICE_PRO_ANUAL` |
| **Quando** | Semana 1 — Primeiro a implementar |

---

### 1.2 WhatsApp Cloud API — Bot Conversacional

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Permite que o bot Dimdim converse com usuários via WhatsApp. Recebe mensagens de texto, áudio e imagem. Envia respostas, relatórios mensais, alertas de pontos e lembretes. É o canal principal do produto |
| **Prioridade** | P0 — O produto é "via WhatsApp" |
| **Complexidade** | Alta |
| **Custo** | Gratuito até 1.000 conversas/mês (Meta free tier). Depois ~R$ 0,25-0,80 por conversa (varia por tipo). Necessita Meta Business Account (gratuita) e número de telefone dedicado |
| **Como implementar** | 1. Criar Meta Business App em developers.facebook.com 2. Configurar WhatsApp Business API com número dedicado 3. `npm install axios` (para chamadas à API Meta) 4. Novo endpoint `GET /api/whatsapp/webhook` — verificação do webhook Meta (hub.verify_token) 5. Novo endpoint `POST /api/whatsapp/webhook` — recebe mensagens 6. Criar `src/lib/whatsapp/sender.ts` — envia mensagens, imagens, templates 7. Criar `src/lib/whatsapp/parser.ts` — identifica tipo (text/image/audio/document) 8. Integrar com o bot existente: mensagem recebida → `/api/bot/mensagem` → resposta → sender.send() 9. Armazenar `whatsapp_phone_id` por user para envios proativos 10. Templates para: boas-vindas, relatório mensal, alerta de pontos, lembrete de conta |
| **Endpoints novos** | `GET /api/whatsapp/webhook`, `POST /api/whatsapp/webhook`, `POST /api/whatsapp/send` (interno) |
| **Variáveis .env** | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` |
| **Quando** | Semana 1-2 |

---

### 1.3 OpenAI API — Inteligência do Bot

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Substitui as respostas hardcoded do bot por IA real. GPT-4o interpreta mensagens em linguagem natural ("gastei 50 no mercado") e retorna ações estruturadas (registrar gasto). Whisper transcreve áudios. Vision lê fotos de cupons/comprovantes e extrai dados automaticamente |
| **Prioridade** | P1 — Bot sem IA é muito limitado |
| **Complexidade** | Média |
| **Custo** | GPT-4o: ~US$ 2,50/1M tokens input + US$ 10/1M output. Whisper: US$ 0,006/min. Vision: mesmos preços do GPT-4o. Estimativa: ~US$ 0,01-0,05 por interação. ~R$ 50-200/mês para 1.000 usuários ativos |
| **Como implementar** | 1. `npm install openai` 2. Criar `src/lib/ai/interpreter.ts` — system prompt com ações disponíveis (REGISTRAR_GASTO, REGISTRAR_RECEITA, CONSULTAR_SALDO, etc.), envia mensagem do user, recebe JSON com ação 3. Criar `src/lib/ai/vision.ts` — recebe imagem base64, extrai: estabelecimento, valor, data, itens, categoria 4. Criar `src/lib/ai/whisper.ts` — transcreve áudio para texto, depois passa para interpreter 5. Criar `src/lib/ai/coach.ts` — gera insights personalizados baseado no histórico do user (modo normal/economia/investidor) 6. Refatorar `POST /api/bot/mensagem` para usar interpreter real 7. System prompts diferentes por modo_bot e humor_bot 8. Cache de respostas frequentes para reduzir custo |
| **Endpoints modificados** | `POST /api/bot/mensagem` (refatorar), `POST /api/whatsapp/webhook` (integrar) |
| **Variáveis .env** | `OPENAI_API_KEY` |
| **Quando** | Semana 2-3 |

---

## FASE 2 — EXPERIÊNCIA COMPLETA (Semanas 4-6)

> Objetivo: Funcionalidades que o usuário espera de um app financeiro moderno

---

### 2.1 Google Calendar API — Sincronização de Lembretes

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Sincroniza contas a pagar, lembretes financeiros e compromissos com o Google Agenda do usuário. Cria eventos automáticos para vencimentos de cartão, contas recorrentes e prazos de metas |
| **Prioridade** | P2 — Feature Pro. Melhora retenção |
| **Complexidade** | Média |
| **Custo** | Gratuito (Google Calendar API sem custo para uso padrão). Requer Google Cloud Project (free tier) |
| **Como implementar** | 1. `npm install googleapis google-auth-library` 2. Criar projeto no Google Cloud Console, habilitar Calendar API 3. Configurar OAuth 2.0 consent screen e credenciais 4. Novo endpoint `GET /api/integracoes/google/auth` — inicia fluxo OAuth, redireciona para Google 5. Novo endpoint `GET /api/integracoes/google/callback` — recebe code, troca por tokens, salva no user 6. Adicionar campos `google_access_token`, `google_refresh_token` na tabela `users` 7. Criar `src/lib/calendar/sync.ts` — cria/atualiza eventos no Calendar 8. Quando transação A_PAGAR é criada → cria evento no dia do vencimento 9. Quando cartão vence → evento de lembrete 2 dias antes 10. Sync bidirecional: marcar evento como concluído no Calendar → atualiza status no Dimdim |
| **Endpoints novos** | `GET /api/integracoes/google/auth`, `GET /api/integracoes/google/callback`, `POST /api/integracoes/google/sync`, `DELETE /api/integracoes/google/disconnect` |
| **Variáveis .env** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| **Quando** | Semana 4 |

---

### 2.2 Busca de Preços Real — Web Scraping

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Substitui os preços mock por buscas reais em lojas brasileiras (Magalu, Amazon, Kabum, Casas Bahia, Shopee, Americanas, Submarino, Fast Shop, Carrefour, Ponto, Extra). Histórico de preços e previsão de tendência |
| **Prioridade** | P1 — Feature destaque do produto |
| **Complexidade** | Alta |
| **Custo** | Opção A — Scraping próprio: apenas infra (~R$ 50-100/mês servidor). Opção B — API de preços (Lomadee, Buscapé API, Zoom API): varia de gratuito (com limitações) a R$ 200-500/mês. Opção C — Google Shopping API via SerpAPI: ~US$ 50/mês (5.000 buscas) |
| **Como implementar** | **Abordagem recomendada: API Lomadee (afiliados) + fallback scraping** 1. Cadastrar no Lomadee (programa de afiliados Magazine Luiza, Americanas, etc.) — gratuito + comissão por vendas 2. `npm install cheerio axios puppeteer-core` 3. Criar `src/lib/precos/lomadee.ts` — busca via API Lomadee (JSON nativo, sem scraping) 4. Criar `src/lib/precos/scraper.ts` — fallback para lojas sem API (Kabum, Shopee) 5. Criar `src/lib/precos/agregador.ts` — unifica resultados de todas as fontes 6. Implementar fila de buscas (evita rate limit): `src/lib/precos/queue.ts` 7. Refatorar `POST /api/buscas` para chamar agregador real 8. Novo endpoint `GET /api/buscas/[id]/historico` — retorna variação de preço ao longo do tempo 9. Job agendado: re-buscar produtos monitorados 1x/dia 10. Análise de tendência: média móvel simples para prever direção do preço 11. Gerar link de afiliado — monetização extra por compras via Dimdim |
| **Endpoints novos** | `GET /api/buscas/[id]/historico`, `POST /api/buscas/[id]/monitorar` |
| **Variáveis .env** | `LOMADEE_APP_TOKEN`, `LOMADEE_SOURCE_ID` |
| **Quando** | Semana 4-5 |

---

### 2.3 Resend (ou SendGrid) — Email Transacional

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Envia emails transacionais: confirmação de cadastro, convites de família, relatórios mensais em PDF, alertas de segurança (login novo), recibos de pagamento, recuperação de senha |
| **Prioridade** | P2 — Necessário para onboarding e comunicação |
| **Complexidade** | Baixa |
| **Custo** | Resend: gratuito até 3.000 emails/mês, depois US$ 20/mês (50K emails). SendGrid: gratuito até 100 emails/dia |
| **Como implementar** | 1. `npm install resend` (ou `@sendgrid/mail`) 2. Criar conta Resend + verificar domínio (DNS TXT record) 3. Criar `src/lib/email/sender.ts` — função genérica de envio 4. Criar templates HTML em `src/lib/email/templates/`: welcome.ts, invite.ts, report.ts, alert.ts, receipt.ts, reset-password.ts 5. Integrar: convite família → email com código, relatório mensal → email com PDF anexo, pagamento → recibo, novo login → alerta 6. Novo endpoint `POST /api/auth/forgot-password` e `POST /api/auth/reset-password` |
| **Endpoints novos** | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| **Variáveis .env** | `RESEND_API_KEY`, `EMAIL_FROM` (ex: noreply@dimdim.com.br) |
| **Quando** | Semana 5 |

---

### 2.4 AWS S3 (ou Cloudflare R2) — Armazenamento de Imagens

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Armazena imagens de cupons/comprovantes enviados pelo WhatsApp, avatares de usuários, PDFs de relatórios gerados. Necessário quando o bot Vision processar fotos de notas fiscais |
| **Prioridade** | P2 — Necessário para feature de foto de cupom |
| **Complexidade** | Baixa |
| **Custo** | S3: ~R$ 0,12/GB/mês + R$ 0,005 por 1.000 requests. R2 (Cloudflare): gratuito até 10GB + 10M requests/mês. **Recomendação: Cloudflare R2 (zero egress)** |
| **Como implementar** | 1. `npm install @aws-sdk/client-s3` (funciona com R2 via endpoint S3-compatible) 2. Criar bucket no R2 ou S3 (região sa-east-1 para Brasil) 3. Criar `src/lib/storage/s3.ts` — upload, download, getSignedUrl, delete 4. Fluxo: WhatsApp envia imagem → download do media → otimizar com Sharp → upload S3 → salvar URL no banco 5. `npm install sharp` para otimização de imagem 6. Adicionar campo `comprovante_url` na tabela `transacoes` 7. Adicionar campo `avatar_url` upload no perfil |
| **Variáveis .env** | `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT` |
| **Quando** | Semana 5-6 |

---

## FASE 3 — CRESCIMENTO E RETENÇÃO (Semanas 7-10)

> Objetivo: Features que aumentam engajamento, LTV e diferenciação

---

### 3.1 OpenClaw Agents — Automação Inteligente

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Agentes especializados que executam tarefas autônomas: CFO gera relatórios financeiros aprofundados, agente de ações dá dicas no modo investidor, agente de economia monitora padrões de gasto e sugere cortes. Cada agente tem personalidade e expertise própria |
| **Prioridade** | P2 — Diferencial competitivo forte |
| **Complexidade** | Alta |
| **Custo** | OpenClaw: auto-hospedado (gratuito). Custo é o LLM por trás (OpenAI ou local). Se local (Ollama): apenas custo de hardware. Se OpenAI: já coberto pelo item 1.3 |
| **Como implementar** | 1. Verificar OpenClaw instalado: `/opt/homebrew/bin/openclaw` 2. Criar/atualizar agents em `~/.openclaw/.openclaw/agents/`: `main/agent/agent.md` (assessor geral com 3 modos), `cfo/agent/agent.md` (relatório mensal, análise de fluxo de caixa), `esp_acoes/agent/agent.md` (modo investidor, educação financeira) 3. Criar `src/lib/openclaw/executor.ts` — wrapper para `execFileSync('/opt/homebrew/bin/openclaw', ['agent', '--agent', agentName, '--local', '-m', prompt])` 4. Refatorar `POST /api/bot/mensagem` para usar executor quando resposta hardcoded não for suficiente 5. Relatório mensal: job no 1º dia do mês → agente CFO analisa dados → gera texto → envia via WhatsApp 6. Timeout de 30s por execução, fallback para resposta hardcoded se falhar 7. Prompt inclui contexto do user: últimas 20 transações, saldo, metas, pontos |
| **Endpoints modificados** | `POST /api/bot/mensagem` (refatorar para usar OpenClaw) |
| **Variáveis .env** | `OPENCLAW_PATH` (default: /opt/homebrew/bin/openclaw) |
| **Quando** | Semana 7 |

---

### 3.2 Cron Jobs — Scheduler de Tarefas Automáticas

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Executa tarefas recorrentes: relatório mensal automático (dia 1 às 8h), alertas de vencimento de pontos, re-busca de preços monitorados, lembrete de contas a pagar, verificação de expiração de assinaturas, transações recorrentes automáticas |
| **Prioridade** | P1 — Sem scheduler, recursos proativos não funcionam |
| **Complexidade** | Média |
| **Custo** | Gratuito se no mesmo servidor. Em produção: Vercel Cron (grátis até 2 jobs, US$ 1/mês por job extra) ou Railway/Render cron |
| **Como implementar** | 1. `npm install node-cron` (dev/self-hosted) ou usar Vercel Cron (vercel.json) 2. Criar `src/lib/scheduler/jobs.ts` com todos os jobs: **Job: relatório mensal** — dia 1 às 8h → gera resumo → envia WhatsApp + email. **Job: alerta pontos** — diário às 9h → verifica pontos com validade < alerta_dias → envia WhatsApp. **Job: re-busca preços** — diário às 6h → busca novos preços para produtos monitorados → alerta se caiu. **Job: lembrete contas** — diário às 7h → transações A_PAGAR com data = hoje+2 → envia lembrete. **Job: transações recorrentes** — diário às 0h → cria transações para recorrentes do dia. **Job: expiração assinatura** — diário → verifica plano_expira, envia alerta 7/3/1 dia antes 3. Para Vercel: criar `vercel.json` com cron config e endpoints `/api/cron/[job]` 4. Rate limiting e idempotência (evitar duplicatas) |
| **Endpoints novos** | `POST /api/cron/relatorio-mensal`, `POST /api/cron/alertas-pontos`, `POST /api/cron/busca-precos`, `POST /api/cron/lembretes`, `POST /api/cron/recorrentes`, `POST /api/cron/assinaturas` |
| **Variáveis .env** | `CRON_SECRET` (para autenticar chamadas dos cron endpoints) |
| **Quando** | Semana 7-8 |

---

### 3.3 Geração de PDF — Relatórios Exportáveis

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Gera PDFs profissionais para: relatório mensal completo, extrato de transações, declaração para IR (notas fiscais), comprovantes de metas atingidas. Feature Pro |
| **Prioridade** | P2 — Valor alto para Pro |
| **Complexidade** | Média |
| **Custo** | Gratuito (bibliotecas open source) |
| **Como implementar** | 1. `npm install @react-pdf/renderer` (para PDFs bonitos com React components) ou `npm install pdfkit` (mais simples) 2. Criar `src/lib/pdf/generator.ts` — funções por tipo de relatório 3. Template relatório mensal: header com logo Dimdim, período, resumo (entradas/saídas/saldo), top 5 categorias com gráfico de barras, lista de transações, comparativo com mês anterior, metas progresso, recomendações 4. Template extrato: formato bancário padrão, data/descrição/valor/saldo 5. Novo endpoint `GET /api/relatorios/mensal?mes=2026-03` → gera PDF → retorna como download 6. Novo endpoint `GET /api/relatorios/extrato?de=2026-01-01&ate=2026-03-31` 7. Integrar com email: enviar PDF como anexo no relatório mensal automático |
| **Endpoints novos** | `GET /api/relatorios/mensal`, `GET /api/relatorios/extrato`, `GET /api/relatorios/ir` |
| **Variáveis .env** | Nenhuma |
| **Quando** | Semana 8-9 |

---

### 3.4 Push Notifications — Web Push

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Notificações push no navegador para: alertas de contas a pagar, variação de preço detectada, bônus de transferência de pontos, lembrete de meta, nova aula disponível. Funciona mesmo com app fechado |
| **Prioridade** | P3 — Nice-to-have, WhatsApp já cobre |
| **Complexidade** | Média |
| **Custo** | Gratuito (Web Push API nativa). Ou Firebase Cloud Messaging (FCM) — gratuito |
| **Como implementar** | 1. `npm install web-push` 2. Gerar VAPID keys: `npx web-push generate-vapid-keys` 3. Criar Service Worker `public/sw.js` — listener de push events 4. Criar `src/lib/push/manager.ts` — salva subscription, envia push 5. Novo endpoint `POST /api/push/subscribe` — salva PushSubscription do browser 6. Adicionar tabela `push_subscriptions` (user_id, endpoint, keys, created_at) 7. Integrar com scheduler: quando alertar via WhatsApp, também enviar push 8. UI: prompt de permissão no primeiro login |
| **Endpoints novos** | `POST /api/push/subscribe`, `DELETE /api/push/unsubscribe` |
| **Variáveis .env** | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` |
| **Quando** | Semana 9-10 |

---

## FASE 4 — ESCALA E DIFERENCIAÇÃO (Semanas 11-16)

> Objetivo: Features avançadas que justificam premium e criam moat

---

### 4.1 Open Finance Brasil — Conexão com Bancos

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Importa automaticamente transações, saldo e faturas de cartão direto dos bancos do usuário via Open Finance (regulado pelo Banco Central). Elimina entrada manual. Atualiza saldo de pontos automaticamente quando disponível |
| **Prioridade** | P2 — Game changer para retenção, mas complexo regulatoriamente |
| **Complexidade** | Muito Alta |
| **Custo** | Via agregador (Pluggy, Belvo, MercadoPago Connect): R$ 2-5 por conexão ativa/mês. Estimativa: R$ 500-2.000/mês para 500 usuários conectados. Direto com Bacen: gratuito mas requer certificação (ITP) — inviável curto prazo |
| **Como implementar** | **Recomendação: usar Pluggy (agregador brasileiro)** 1. Cadastrar em pluggy.ai — solicitar acesso sandbox 2. `npm install pluggy-sdk` 3. Criar `src/lib/openfinance/pluggy.ts` — wrapper do SDK 4. Fluxo: usuário clica "Conectar banco" → abre Pluggy Connect Widget → seleciona banco → autoriza → Pluggy retorna item_id 5. Novo endpoint `POST /api/integracoes/banco/connect` — salva conexão 6. Novo endpoint `POST /api/integracoes/banco/webhook` — recebe novos dados do Pluggy 7. Sync: a cada 12h, Pluggy puxa novas transações → webhook → importa para tabela transacoes com flag `importado=1` 8. Adicionar tabela `conexoes_banco` (user_id, pluggy_item_id, banco, status, last_sync) 9. Reconciliação: detectar duplicatas entre manual e importado 10. UI: card na sidebar mostrando bancos conectados e último sync |
| **Endpoints novos** | `POST /api/integracoes/banco/connect`, `POST /api/integracoes/banco/webhook`, `GET /api/integracoes/banco/status`, `DELETE /api/integracoes/banco/disconnect` |
| **Variáveis .env** | `PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET` |
| **Quando** | Semana 11-13 |

---

### 4.2 Plaid ou Belvo — Alternativa/Complemento Open Finance

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Alternativa ao Pluggy para conexão bancária. Belvo tem forte presença no Brasil e cobre bancos e fintechs que o Pluggy pode não cobrir. Pode rodar em paralelo para maior cobertura |
| **Prioridade** | P3 — Só se Pluggy não cobrir bancos necessários |
| **Complexidade** | Alta |
| **Custo** | Belvo: pay-per-link, ~US$ 2-4/conexão/mês. Plaid: não opera no Brasil diretamente (depende de parceiro) |
| **Como implementar** | Similar ao Pluggy. 1. `npm install belvo` 2. Criar `src/lib/openfinance/belvo.ts` 3. Mesmos endpoints com provider switching |
| **Variáveis .env** | `BELVO_SECRET_ID`, `BELVO_SECRET_PASSWORD` |
| **Quando** | Semana 14+ (se necessário) |

---

### 4.3 OCR Avançado — Leitura de Cupons/Comprovantes

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Pipeline completa de processamento de imagens: recebe foto pelo WhatsApp → otimiza (rotação, contraste, nitidez) → avalia qualidade → extrai dados (estabelecimento, CNPJ, itens, valores) → cria transação automaticamente → armazena imagem no S3 |
| **Prioridade** | P1 — Feature Pro matadora. "Tire foto do cupom e pronto" |
| **Complexidade** | Alta |
| **Custo** | OpenAI Vision (já coberto no item 1.3). Sharp (gratuito, open source). S3 storage (já coberto no item 2.4) |
| **Como implementar** | 1. `npm install sharp` (já necessário para S3) 2. Criar `src/lib/ocr/optimizer.ts` — sharp pipeline: auto-rotate, normalize, sharpen, convert to JPEG 90% 3. Criar `src/lib/ocr/quality.ts` — avalia resolução, brilho, contraste. Score 0-100. Rejeita < 40 4. Criar `src/lib/ocr/extractor.ts` — envia imagem base64 para GPT-4o Vision com prompt estruturado → retorna JSON {estabelecimento, cnpj, data, valorTotal, itens[], categoria} 5. Fluxo WhatsApp: imagem recebida → download media → optimize → evaluate quality → extract → create transaction → upload S3 → respond with summary 6. Adicionar campos na tabela `transacoes`: `comprovante_url`, `origem` (manual/whatsapp/importado) 7. Nova tabela `notas_fiscais` (user_id, imagem_url, dados_extraidos, score_qualidade) |
| **Dependências** | Requer: 1.2 (WhatsApp), 1.3 (OpenAI), 2.4 (S3) |
| **Quando** | Semana 12-14 |

---

### 4.4 Twilio — SMS Fallback e Verificação

| Campo | Detalhe |
|-------|---------|
| **O que faz** | SMS para verificação de número de telefone no cadastro, recuperação de senha via SMS, fallback quando WhatsApp não disponível. Também pode ser usado como alternativa ao WhatsApp Cloud API |
| **Prioridade** | P3 — WhatsApp é suficiente para MVP e crescimento |
| **Complexidade** | Baixa |
| **Custo** | ~R$ 0,35 por SMS enviado no Brasil. Estimativa: R$ 50-200/mês |
| **Como implementar** | 1. `npm install twilio` 2. Criar `src/lib/sms/twilio.ts` — sendSMS, verifyPhone 3. Novo endpoint `POST /api/auth/verify-phone` — envia código SMS 4. Novo endpoint `POST /api/auth/confirm-phone` — valida código |
| **Variáveis .env** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| **Quando** | Semana 14+ |

---

### 4.5 Analytics — Mixpanel ou PostHog

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Rastreia comportamento do usuário para otimizar o produto: funil de conversão (trial → pago), features mais usadas, telas com maior abandono, tempo médio de sessão, retenção por cohort. Essencial para crescer com dados |
| **Prioridade** | P2 — Sem analytics, decisões são no escuro |
| **Complexidade** | Baixa |
| **Custo** | PostHog: gratuito self-hosted ou até 1M eventos/mês no cloud. Mixpanel: gratuito até 20M eventos/mês |
| **Como implementar** | **Recomendação: PostHog (open source, LGPD-friendly)** 1. `npm install posthog-js` (frontend) + `npm install posthog-node` (backend) 2. Criar conta PostHog Cloud ou self-host 3. Criar `src/lib/analytics/posthog.ts` — init, identify, track, pageview 4. Eventos a rastrear: login, criar_transacao, buscar_preco, completar_aula, atingir_meta, upgrade_plano, convidar_familia, conectar_banco 5. Identificar user com ID + properties (plano, modo_bot, qtd_transacoes) 6. Feature flags: testar variações de UI antes de lançar 7. Session replay para debugar problemas de UX |
| **Variáveis .env** | `POSTHOG_KEY`, `POSTHOG_HOST` |
| **Quando** | Semana 9-10 |

---

### 4.6 Sentry — Monitoramento de Erros

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Captura erros em produção com stack trace, contexto do usuário, e replay da sessão. Alerta imediato quando algo quebra. Essencial para manter qualidade em produção |
| **Prioridade** | P1 — Deploy sem monitoramento é voo cego |
| **Complexidade** | Baixa |
| **Custo** | Gratuito até 5K erros/mês (Developer plan). Team: US$ 26/mês |
| **Como implementar** | 1. `npm install @sentry/nextjs` 2. `npx @sentry/wizard@latest -i nextjs` — configura automaticamente 3. Cria `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` 4. Configurar DSN no .env 5. Adicionar `Sentry.captureException(error)` nos catch blocks das APIs 6. Configurar alertas por Slack/email para erros novos |
| **Variáveis .env** | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` |
| **Quando** | Semana 8 (antes de ir para produção) |

---

## FASE 5 — PRODUÇÃO E DEPLOY (Semana 10-12)

> Objetivo: Colocar no ar acessível ao mundo

---

### 5.1 Vercel — Hosting e Deploy

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Hospeda o Next.js com deploy automático por push no Git. Edge functions, CDN global, SSL automático, preview deployments por PR |
| **Prioridade** | P0 — Precisa estar no ar para ter usuários |
| **Complexidade** | Baixa |
| **Custo** | Hobby: gratuito (uso pessoal). Pro: US$ 20/mês (uso comercial, recomendado). Inclui: 100GB bandwidth, serverless functions, cron jobs |
| **Como implementar** | 1. Criar repo no GitHub 2. Conectar repo ao Vercel 3. Configurar variáveis de ambiente no dashboard Vercel 4. Configurar domínio customizado (dimdim.com.br) 5. **ATENÇÃO SQLite:** Vercel serverless não persiste filesystem. Migrar para: Turso (SQLite na edge, compatível com better-sqlite3 via libsql), ou Supabase/Neon (PostgreSQL) 6. Vercel Cron para scheduler jobs 7. Configurar preview deployments para cada branch |
| **Variáveis .env** | Todas as anteriores, configuradas no Vercel Dashboard |
| **Quando** | Semana 10 |

---

### 5.2 Turso — SQLite em Produção

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Resolve o problema do SQLite em serverless. Turso é SQLite distribuído na edge, compatível com a lib libsql (drop-in replacement do better-sqlite3). Mantém a simplicidade do SQLite com a escalabilidade de um banco cloud |
| **Prioridade** | P0 — Sem isso, o banco não funciona na Vercel |
| **Complexidade** | Baixa |
| **Custo** | Starter: gratuito (500 databases, 9GB storage, 25M rows lidas/mês). Scaler: US$ 29/mês |
| **Como implementar** | 1. `npm install @libsql/client` 2. Criar conta Turso, criar database 3. Refatorar `src/lib/db.ts`: trocar `better-sqlite3` por `@libsql/client` 4. Mudar de sync para async (libsql é async, mas API similar) 5. Rodar migrations no Turso: `turso db shell dimdim < schema.sql` 6. Rodar seed no primeiro deploy |
| **Variáveis .env** | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` |
| **Quando** | Semana 10 (junto com Vercel) |

---

### 5.3 Domínio + DNS + SSL

| Campo | Detalhe |
|-------|---------|
| **O que faz** | Domínio personalizado dimdim.com.br com SSL. Subdomínios: app.dimdim.com.br (dashboard), api.dimdim.com.br (se separar). DNS com Cloudflare para CDN e proteção DDoS |
| **Prioridade** | P0 — Sem domínio não é um produto real |
| **Complexidade** | Baixa |
| **Custo** | Domínio .com.br: ~R$ 40/ano (Registro.br). Cloudflare: gratuito (free plan) |
| **Como implementar** | 1. Registrar domínio no Registro.br 2. Apontar nameservers para Cloudflare 3. Configurar DNS: CNAME app → cname.vercel-dns.com 4. Adicionar domínio no Vercel → SSL automático 5. Configurar Cloudflare: SSL Full (Strict), Always HTTPS, minify JS/CSS |
| **Variáveis .env** | Nenhuma |
| **Quando** | Semana 10 |

---

## RESUMO DO CRONOGRAMA

```
SEMANA  INTEGRAÇÃO                    PRIORIDADE  COMPLEXIDADE  CUSTO/MÊS
──────  ────────────────────────────  ──────────  ────────────  ─────────
  1     Stripe (pagamentos)           P0          Média         ~3.99%+tx
  1-2   WhatsApp Cloud API            P0          Alta          R$ 0-200
  2-3   OpenAI API (bot IA)           P1          Média         R$ 50-200
  4     Google Calendar               P2          Média         Grátis
  4-5   Busca de Preços Real          P1          Alta          R$ 0-100
  5     Resend (email)                P2          Baixa         Grátis
  5-6   AWS S3 / Cloudflare R2        P2          Baixa         R$ 0-50
  7     OpenClaw Agents               P2          Alta          Grátis*
  7-8   Cron Jobs (scheduler)         P1          Média         Grátis
  8     Sentry (monitoramento)        P1          Baixa         Grátis
  8-9   PDF Reports                   P2          Média         Grátis
  9-10  PostHog (analytics)           P2          Baixa         Grátis
  9-10  Web Push Notifications        P3          Média         Grátis
  10    Vercel (deploy)               P0          Baixa         US$ 20
  10    Turso (SQLite cloud)          P0          Baixa         Grátis
  10    Domínio + DNS + SSL           P0          Baixa         R$ 40/ano
  11-13 Open Finance (Pluggy)         P2          Muito Alta    R$ 500-2K
  12-14 OCR Cupons (Vision+S3)        P1          Alta          Incl.*
  14+   Twilio (SMS)                  P3          Baixa         R$ 50-200
  14+   Belvo (backup banco)          P3          Alta          US$ 2-4/cx
```

`*` Custo incluso em integrações anteriores (OpenAI, S3)

---

## CUSTO TOTAL ESTIMADO POR FASE

| Fase | Período | Custo fixo/mês | Custo variável |
|------|---------|---------------|----------------|
| **Fase 1** | Sem 1-3 | ~R$ 0 | ~3.99% receita (Stripe) + R$ 50-200 (OpenAI) + R$ 0-200 (WhatsApp) |
| **Fase 2** | Sem 4-6 | ~R$ 0 | +R$ 0-100 (scraping/afiliados) |
| **Fase 3** | Sem 7-10 | ~R$ 0 | Custos já inclusos |
| **Fase 4** | Sem 11-16 | ~R$ 500-2.000 | Open Finance (por conexão) |
| **Fase 5** | Sem 10-12 | ~US$ 20 (Vercel) + R$ 3,33 (domínio) | — |

**Custo mínimo para lançar (Fases 1+5):** ~R$ 150-400/mês + transações Stripe
**Custo completo todas as fases:** ~R$ 800-2.500/mês (escala com usuários)

---

## DEPENDÊNCIAS ENTRE INTEGRAÇÕES

```
Stripe ──────────────────── (independente, fazer primeiro)
WhatsApp Cloud API ──────── (independente)
OpenAI API ──────────────── (independente)
  │
  ├── OCR Cupons ────────── (requer: WhatsApp + OpenAI + S3)
  ├── Bot IA real ────────── (requer: OpenAI)
  └── OpenClaw Agents ───── (requer: OpenAI ou LLM local)

Google Calendar ─────────── (independente)
Busca Preços Real ───────── (independente)
Email (Resend) ──────────── (independente)
S3/R2 Storage ───────────── (independente)
  │
  └── OCR Cupons ────────── (requer: S3)

Cron Jobs ───────────────── (requer: WhatsApp + Email para envios)
PDF Reports ─────────────── (independente, melhor com Email)
Push Notifications ──────── (independente)
Analytics (PostHog) ─────── (independente)
Sentry ──────────────────── (independente)

Vercel ──────────────────── (requer: Turso)
Turso ───────────────────── (requer: refatorar db.ts)
Domínio ─────────────────── (requer: Vercel)

Open Finance (Pluggy) ───── (independente, mas melhor após WhatsApp)
```

---

## CHECKLIST DE VARIÁVEIS DE AMBIENTE (.env.local)

```env
# === FASE 1 ===
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_LITE_MENSAL=price_...
STRIPE_PRICE_LITE_ANUAL=price_...
STRIPE_PRICE_PRO_MENSAL=price_...
STRIPE_PRICE_PRO_ANUAL=price_...

# WhatsApp
WHATSAPP_TOKEN=EAAx...
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_VERIFY_TOKEN=dimdim_verify_2026
WHATSAPP_APP_SECRET=abc123...

# OpenAI
OPENAI_API_KEY=sk-...

# === FASE 2 ===
# Google Calendar
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://app.dimdim.com.br/api/integracoes/google/callback

# Busca de Preços (Lomadee)
LOMADEE_APP_TOKEN=xxx
LOMADEE_SOURCE_ID=xxx

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@dimdim.com.br

# Storage (Cloudflare R2)
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
S3_BUCKET=dimdim-uploads
S3_REGION=auto
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com

# === FASE 3 ===
# OpenClaw
OPENCLAW_PATH=/opt/homebrew/bin/openclaw

# Cron
CRON_SECRET=dimdim-cron-secret-2026

# Push Notifications
VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx
VAPID_EMAIL=admin@dimdim.com.br

# Analytics (PostHog)
POSTHOG_KEY=phc_...
POSTHOG_HOST=https://app.posthog.com

# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_...

# === FASE 4 ===
# Open Finance (Pluggy)
PLUGGY_CLIENT_ID=xxx
PLUGGY_CLIENT_SECRET=xxx

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+55...

# === FASE 5 ===
# Turso
TURSO_DATABASE_URL=libsql://dimdim-xxx.turso.io
TURSO_AUTH_TOKEN=xxx

# App
JWT_SECRET=dimdim-jwt-secret-2026-production
NEXT_PUBLIC_APP_URL=https://app.dimdim.com.br
```

---

*Documento gerado em 2026-03-18. Atualizar conforme integrações forem implementadas.*
