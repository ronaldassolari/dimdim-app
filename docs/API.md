# Dimdim API Documentation

Base URL: `/api`

## Authentication

All endpoints except `/api/auth/login`, `/api/health`, and `/api/consent` require authentication via JWT cookie `dimdim_session`.

The cookie is set automatically on login and has a 7-day TTL. It is `httpOnly`, `sameSite: lax`, and `secure` in production.

Unauthenticated requests receive:
```json
{ "error": "Nao autorizado" }
```
**Status:** `401`

---

## Auth

### POST /api/auth/login

Authenticates a user and sets the session cookie.

- **Auth required:** No
- **Body:**
  ```json
  { "username": "string", "password": "string" }
  ```
- **Validations:**
  - `username` and `password` are required strings
  - `username` max 100 chars, `password` max 200 chars
- **Success Response (200):**
  ```json
  {
    "success": true,
    "user": { "id": 1, "nome": "Ronald", "plano": "free", "modo_bot": "normal" }
  }
  ```
  Sets `dimdim_session` cookie.
- **Errors:**
  - `400` — Credenciais invalidas (missing/invalid fields)
  - `401` — Credenciais invalidas (wrong username or password)
  - `500` — Internal server error

---

### GET /api/auth/me

Returns the currently authenticated user.

- **Auth required:** Yes
- **Response (200):**
  ```json
  {
    "user": {
      "id": 1,
      "username": "ronald",
      "nome": "Ronald",
      "email": "ronald@email.com",
      "whatsapp": "+5511999999999",
      "plano": "free",
      "plano_expira": null,
      "modo_bot": "normal",
      "humor_bot": "amigavel",
      "avatar_url": null
    }
  }
  ```
- **Errors:**
  - `401` — Nao autenticado

---

### POST /api/auth/logout

Clears the session cookie.

- **Auth required:** No (clears cookie regardless)
- **Response (200):**
  ```json
  { "success": true }
  ```

---

## Health

### GET /api/health

Health check endpoint. Verifies database connectivity.

- **Auth required:** No
- **Response (200):**
  ```json
  { "status": "ok", "timestamp": "2025-01-01T00:00:00.000Z", "db": "connected" }
  ```
- **Error Response (503):**
  ```json
  { "status": "error", "timestamp": "2025-01-01T00:00:00.000Z", "db": "disconnected" }
  ```

---

## Consent

### POST /api/consent

Registers user consent (LGPD compliance). Logs IP and acceptance.

- **Auth required:** No
- **Body:**
  ```json
  { "accepted": true }
  ```
  `accepted` defaults to `true` if omitted.
- **Response (200):**
  ```json
  { "ok": true }
  ```
- **Errors:**
  - `500` — Erro interno

---

## Dashboard

### GET /api/dashboard

Returns aggregated financial data for a given month.

- **Auth required:** Yes
- **Query Params:**
  - `mes` (optional) — Month in `YYYY-MM` format. Defaults to current month.
- **Response (200):**
  ```json
  {
    "saldo": {
      "receitas": 5000.00,
      "gastos": 3200.00,
      "aReceber": 1000.00,
      "aPagar": 500.00,
      "saldo": 1800.00
    },
    "grafico": [
      { "dia": 1, "realizado": 100.00, "projetado": 150.00 },
      { "dia": 2, "realizado": 50.00, "projetado": 140.00 }
    ],
    "metas": [
      { "id": 1, "titulo": "Reserva", "valor_alvo": 10000, "valor_atual": 5000, "categoria": "Investimentos", "progresso": 50 }
    ],
    "pontos": { "total": 15000, "valorReais": 150.00 },
    "insights": ["Voce gastou 64% da sua receita recebida este mes"],
    "alertas": 2
  }
  ```
- **Errors:**
  - `401` — Nao autorizado
  - `500` — Erro interno do servidor

---

## Transacoes

### GET /api/transacoes

Lists transactions with filtering and pagination.

- **Auth required:** Yes
- **Query Params:**
  - `status` (optional) — Filter by status: `PAGO`, `A_PAGAR`, `RECEBIDO`, `A_RECEBER`
  - `search` (optional) — Search in `descricao` (case-insensitive)
  - `mes` (optional) — Filter by month `YYYY-MM`
  - `page` (optional) — Page number, default `1`
  - `limit` (optional) — Items per page, default `50`, max `200`
- **Response (200):**
  ```json
  {
    "transacoes": [
      {
        "id": 1,
        "user_id": 1,
        "descricao": "Supermercado",
        "valor": 250.00,
        "tipo": "GASTO",
        "categoria": "Alimentacao",
        "status": "PAGO",
        "data": "2025-01-15",
        "cartao_id": null,
        "recorrente": 0,
        "frequencia": null,
        "observacoes": null
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 120, "totalPages": 3 }
  }
  ```
- **Errors:**
  - `401` — Nao autorizado
  - `500` — Erro interno do servidor

---

### POST /api/transacoes

Creates a new transaction.

- **Auth required:** Yes
- **Body:**
  ```json
  {
    "descricao": "Supermercado",
    "valor": 250.00,
    "tipo": "GASTO",
    "categoria": "Alimentacao",
    "data": "2025-01-15",
    "status": "PAGO",
    "cartao_id": null,
    "recorrente": false,
    "frequencia": null,
    "observacoes": "Compras semanais"
  }
  ```
- **Required fields:** `descricao`, `valor`, `tipo`, `categoria`, `data`
- **Validations:**
  - `descricao`: string, max 500 chars
  - `valor`: positive number
  - `tipo`: `"GASTO"` or `"RECEITA"`
  - `status` defaults to `"PAGO"`
- **Response (201):** Created transaction object
- **Errors:**
  - `400` — Validation errors (descricao invalida, valor invalido, tipo invalido, campos obrigatorios)
  - `401` — Nao autorizado
  - `500` — Erro interno do servidor

---

### GET /api/transacoes/:id

Returns a single transaction by ID.

- **Auth required:** Yes
- **Response (200):** Transaction object
- **Errors:**
  - `401` — Nao autorizado
  - `404` — Transacao nao encontrada
  - `500` — Erro interno do servidor

---

### PUT /api/transacoes/:id

Updates a transaction. All fields are optional (partial update via COALESCE).

- **Auth required:** Yes
- **Body:** Same fields as POST (all optional)
- **Response (200):** Updated transaction object
- **Errors:**
  - `401` — Nao autorizado
  - `404` — Transacao nao encontrada
  - `500` — Erro interno do servidor

---

### DELETE /api/transacoes/:id

Deletes a transaction permanently.

- **Auth required:** Yes
- **Response (200):**
  ```json
  { "message": "Transacao excluida com sucesso" }
  ```
- **Errors:**
  - `401` — Nao autorizado
  - `404` — Transacao nao encontrada
  - `500` — Erro interno do servidor

---

### GET /api/transacoes/export

Exports transactions as CSV file.

- **Auth required:** Yes
- **Query Params:**
  - `mes` (optional) — Filter by month `YYYY-MM`
- **Response (200):** CSV file download
  - `Content-Type: text/csv; charset=utf-8`
  - Columns: ID, Data, Descricao, Valor, Tipo, Categoria, Status, Cartao ID, Recorrente, Frequencia, Observacoes
- **Errors:**
  - `401` — Nao autorizado
  - `500` — Erro interno do servidor

---

## Cartoes

### GET /api/cartoes

Lists all active cards for the authenticated user.

- **Auth required:** Yes
- **Response (200):** Array of card objects
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "apelido": "Nubank",
      "banco": "Nubank",
      "bandeira": "Mastercard",
      "nivel": "Ultravioleta",
      "limite": 15000,
      "vencimento": 10,
      "cor": "#820AD1",
      "pontos_por_real": 1,
      "programas_pontos": "[\"Nubank Rewards\"]",
      "ativo": 1
    }
  ]
  ```
- **Errors:**
  - `401` — Nao autorizado
  - `500` — Erro interno do servidor

---

### POST /api/cartoes

Creates a new card. Points-per-real is auto-calculated based on bank and level.

- **Auth required:** Yes
- **Body:**
  ```json
  {
    "apelido": "Meu Nubank",
    "banco": "Nubank",
    "bandeira": "Mastercard",
    "nivel": "Ultravioleta",
    "limite": 15000,
    "vencimento": 10,
    "cor": "#820AD1",
    "programas_pontos": ["Nubank Rewards"]
  }
  ```
- **Required fields:** `apelido`, `banco`, `bandeira`, `nivel`
- **Validations:**
  - `apelido`: string, max 200 chars
  - `banco`: string, max 200 chars
  - `bandeira`: string, max 100 chars
  - `limite`: non-negative number (optional)
- **Response (201):** Created card object
- **Errors:**
  - `400` — Validation errors
  - `401` — Nao autorizado
  - `500` — Erro interno do servidor

---

### GET /api/cartoes/:id

Returns a single active card by ID.

- **Auth required:** Yes
- **Response (200):** Card object
- **Errors:**
  - `401` — Nao autorizado
  - `404` — Cartao nao encontrado
  - `500` — Erro interno do servidor

---

### PUT /api/cartoes/:id

Updates a card. All fields are optional.

- **Auth required:** Yes
- **Body:** Same fields as POST (all optional), plus `ativo`, `gasto_mes`, `pontos_por_real`
- **Response (200):** Updated card object
- **Errors:**
  - `401` — Nao autorizado
  - `404` — Cartao nao encontrado
  - `500` — Erro interno do servidor

---

### DELETE /api/cartoes/:id

Soft-deletes a card (sets `ativo = 0`).

- **Auth required:** Yes
- **Response (200):**
  ```json
  { "message": "Cartao excluido com sucesso" }
  ```
- **Errors:**
  - `401` — Nao autorizado
  - `404` — Cartao nao encontrado
  - `500` — Erro interno do servidor

---

## Metas

### GET /api/metas

Lists all active goals.

- **Auth required:** Yes
- **Response (200):** Array of meta objects
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "titulo": "Reserva de Emergencia",
      "valor_alvo": 10000,
      "valor_atual": 5000,
      "categoria": "Investimentos",
      "prazo": "2025-12-31",
      "ativa": 1
    }
  ]
  ```
- **Errors:**
  - `401` — Nao autorizado
  - `500` — Erro interno do servidor

---

### POST /api/metas

Creates a new goal.

- **Auth required:** Yes
- **Body:**
  ```json
  {
    "titulo": "Reserva de Emergencia",
    "valor_alvo": 10000,
    "valor_atual": 0,
    "categoria": "Investimentos",
    "prazo": "2025-12-31"
  }
  ```
- **Required fields:** `titulo`, `valor_alvo`
- **Validations:**
  - `titulo`: string, max 300 chars
  - `valor_alvo`: positive number
- **Response (201):** Created meta object
- **Errors:**
  - `400` — Titulo invalido, Valor alvo invalido
  - `401` — Nao autorizado
  - `500` — Erro interno do servidor

---

### PUT /api/metas/:id

Updates a goal. All fields are optional.

- **Auth required:** Yes
- **Body:** Same fields as POST (all optional), plus `ativa` (0 or 1)
- **Response (200):** Updated meta object
- **Errors:**
  - `401` — Nao autorizado
  - `404` — Meta nao encontrada
  - `500` — Erro interno do servidor

---

### DELETE /api/metas/:id

Deletes a goal permanently.

- **Auth required:** Yes
- **Response (200):**
  ```json
  { "message": "Meta excluida com sucesso" }
  ```
- **Errors:**
  - `401` — Nao autorizado
  - `404` — Meta nao encontrada
  - `500` — Erro interno do servidor

---

## Bot

### POST /api/bot/mensagem

Sends a message to the DimdimBot. Supports intent detection (expense registration, price search, financial summary) and general financial advice.

- **Auth required:** Yes (via session or `whatsapp` field)
- **Body:**
  ```json
  {
    "mensagem": "gastei 50 reais no supermercado",
    "whatsapp": "+5511999999999",
    "tipo": "text"
  }
  ```
- **Required fields:** `mensagem` (max 1000 chars)
- **Response (200) — Expense registered:**
  ```json
  {
    "resposta": "Registrado! R$ 50.00 em Alimentacao (supermercado). ID: #42",
    "intencao": "gasto",
    "transacao": { ... }
  }
  ```
- **Response (200) — Price search:**
  ```json
  {
    "resposta": "iPhone 15...",
    "intencao": "busca",
    "resultados": [{ "preco": 4999.00, "loja": "Amazon" }]
  }
  ```
- **Response (200) — Monthly summary:**
  ```json
  {
    "resposta": "Resumo de janeiro...",
    "intencao": "resumo",
    "dados": { "receitas": 5000, "gastos": 3200, "saldo": 1800 }
  }
  ```
- **Response (200) — General advice:**
  ```json
  {
    "resposta": "Dica financeira...",
    "intencao": "geral"
  }
  ```
- **Errors:**
  - `400` — Envie uma mensagem / Mensagem muito longa
  - `401` — Usuario nao encontrado
  - `500` — Erro interno do servidor

---

## Insights

### GET /api/insights

Returns AI-powered financial insights. Uses Anthropic API when available, falls back to static analysis. Results are cached for 6 hours per user.

- **Auth required:** Yes
- **Response (200):**
  ```json
  {
    "insights": [
      {
        "tipo": "gasto_alto",
        "mensagem": "Voce gastou 85% da sua receita este mes.",
        "acao_sugerida": "Revise gastos variaveis.",
        "urgencia": "media"
      }
    ],
    "cached": false
  }
  ```
  - `urgencia`: `"baixa"`, `"media"`, or `"alta"`
  - `tipo`: `"gasto_alto"`, `"economia"`, `"pendencia"`, `"meta_progresso"`, `"pontos"`, `"categoria"`
- **Errors:**
  - `401` — Nao autorizado
  - `500` — Erro interno do servidor

---

## Conta

### DELETE /api/conta

Deletes the user account and all associated data (LGPD Art. 18).

- **Auth required:** Yes
- **Response (200):**
  ```json
  { "message": "Conta e todos os dados excluidos com sucesso" }
  ```
- **Errors:**
  - `401` — Nao autorizado
  - `500` — Erro ao excluir conta

---

### GET /api/conta/export

Exports all user data as JSON (LGPD Art. 18 - data portability).

- **Auth required:** Yes
- **Response (200):**
  ```json
  {
    "exportado_em": "2025-01-01T00:00:00.000Z",
    "usuario": { "id": 1, "username": "ronald", "nome": "Ronald", ... },
    "transacoes": [...],
    "cartoes": [...],
    "metas": [...],
    "pontos": [...],
    "buscas": [...],
    "familia": [...],
    "progresso_aulas": [...]
  }
  ```
- **Errors:**
  - `401` — Nao autorizado
  - `500` — Erro ao exportar dados

---

## Configuracoes

### GET /api/configuracoes

Returns user settings/profile.

- **Auth required:** Yes
- **Response (200):**
  ```json
  {
    "id": 1,
    "username": "ronald",
    "nome": "Ronald",
    "email": "ronald@email.com",
    "whatsapp": "+5511999999999",
    "plano": "free",
    "plano_expira": null,
    "modo_bot": "normal",
    "humor_bot": "amigavel",
    "horario_lembrete": "09:00",
    "horario_relatorio": 1,
    "avatar_url": null,
    "created_at": "2025-01-01T00:00:00.000Z"
  }
  ```
- **Errors:**
  - `401` — Nao autorizado
  - `404` — Usuario nao encontrado
  - `500` — Erro interno do servidor

---

### PUT /api/configuracoes

Updates user settings.

- **Auth required:** Yes
- **Body (all fields optional):**
  ```json
  {
    "nome": "Ronald Santos",
    "email": "novo@email.com",
    "whatsapp": "+5511999999999",
    "modo_bot": "economia",
    "humor_bot": "direto",
    "horario_lembrete": "08:00"
  }
  ```
- **Validations:**
  - `modo_bot`: `"normal"`, `"economia"`, or `"investidor"`
  - `humor_bot`: `"amigavel"`, `"direto"`, or `"tecnico"`
- **Response (200):** Updated user settings object
- **Errors:**
  - `400` — modo_bot invalido / humor_bot invalido
  - `401` — Nao autorizado
  - `500` — Erro interno do servidor

---

## Pontos

### GET /api/pontos

Lists all loyalty programs with user balances.

- **Auth required:** Yes
- **Response (200):** Array of program objects with user-specific balances
  ```json
  [
    {
      "id": 1,
      "nome": "Livelo",
      "tipo": "pontos",
      "ativo": 1,
      "saldo": 15000,
      "validade": "2025-12-31",
      "alerta_dias": 30,
      "interesse": 1,
      "analise_id": 5
    }
  ]
  ```
- **Errors:**
  - `401` — Nao autorizado
  - `500` — Erro interno do servidor

---

### POST /api/pontos

Creates or updates a user's balance for a loyalty program (upsert).

- **Auth required:** Yes
- **Body:**
  ```json
  {
    "programa_id": 1,
    "saldo": 15000,
    "validade": "2025-12-31",
    "alerta_dias": 30,
    "interesse": 1
  }
  ```
- **Required fields:** `programa_id`
- **Response (200):** Updated program with balance
- **Errors:**
  - `400` — Campo obrigatorio: programa_id
  - `401` — Nao autorizado
  - `500` — Erro interno do servidor
