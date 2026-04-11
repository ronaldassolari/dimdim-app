import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN ?? 'dimdim2026fb'

// ── ENVIAR mensagem via Messenger Graph API ─────────────────────
async function sendMessenger(recipientId: string, text: string) {
    if (!FB_PAGE_ACCESS_TOKEN) {
          console.error('❌ FB_PAGE_ACCESS_TOKEN não configurado')
          return
        }
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${FB_PAGE_ACCESS_TOKEN}`
    const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
                  recipient: { id: recipientId },
                  message: { text },
                  messaging_type: 'RESPONSE',
                }),
        })
    if (!res.ok) {
          const err = await res.text()
          console.error('❌ Erro Graph API Messenger:', err)
        }
  }

// ── PROCESSAR mensagem e gerar resposta ──────────────────────────
async function processarMensagem(senderId: string, texto: string): Promise<string> {
    const msg = texto.trim().toLowerCase()

    // Busca usuário pelo facebook_id
    const { rows } = await sql`
      SELECT id, nome FROM users
      WHERE facebook_id = ${senderId}
      LIMIT 1
    `

    if (!rows || rows.length === 0) {
          return `👋 Olá! Não encontrei sua conta no Dimdim.\n\nAcesse *dimdim-snowy.vercel.app*, vá em Configurações e vincule seu Facebook para usar o bot.`
        }

    const user = rows[0] as { id: number; nome: string }
    const nome = user.nome?.split(' ')[0] ?? 'amigo'
    const saudacao = `Oi, ${nome}!`

    // Resumo do mês
    if (msg === 'resumo' || msg === 'saldo') {
          const mes = new Date().toISOString().slice(0, 7) + '%'
          const { rows: recR } = await sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${user.id} AND tipo='RECEITA' AND status='RECEBIDO' AND data::text LIKE ${mes}`
          const { rows: gasR } = await sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${user.id} AND tipo='GASTO' AND status='PAGO' AND data::text LIKE ${mes}`
          const rec = Number((recR as any)[0]?.t ?? 0)
          const gas = Number((gasR as any)[0]?.t ?? 0)
          const saldo = rec - gas
          const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long' })
          return `📊 *Resumo de ${mesNome}*\n\n✅ Entradas: R$ ${rec.toFixed(2)}\n❌ Saídas: R$ ${gas.toFixed(2)}\n💰 Saldo: R$ ${saldo.toFixed(2)}\n\n🔗 dimdim-snowy.vercel.app`
        }

    // Registrar gasto simples (ex: "50 ifood")
    const matchGasto = msg.match(/(\d+[,.]?\d*)\s+(.+)/)
    if (matchGasto) {
          const valor = parseFloat(matchGasto[1].replace(',', '.'))
          const descricao = matchGasto[2].trim()
          const hoje = new Date().toISOString().slice(0, 10)
          await sql`INSERT INTO transacoes (user_id, descricao, valor, tipo, categoria, status, data) VALUES (${user.id}, ${descricao}, ${valor}, 'GASTO', 'Outros', 'PAGO', ${hoje})`
          return `✅ ${saudacao} Registrado!\n💸 R$ ${valor.toFixed(2)} — ${descricao}\n\nDigite *resumo* para ver seu saldo.`
        }

    // Ajuda
    if (msg === 'ajuda' || msg === 'help' || msg === '?') {
          return `💰 *DimdimBot — Comandos:*\n\n📝 *Gastos:* 30 farmácia\n📊 *Saldo:* resumo\n❓ *Ajuda:* ajuda\n\n🔗 dimdim-snowy.vercel.app`
        }

    return `${saudacao} 💬 Não entendi.\n\nTente:\n• *30 farmácia* (registrar gasto)\n• *resumo* (ver saldo)\n• *ajuda* (ver comandos)`
  }

// ── GET — verificação do webhook pela Meta ───────────────────────
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
          console.log('✅ Webhook Facebook Messenger verificado')
          return new Response(challenge, { status: 200 })
        }
    return new Response('Forbidden', { status: 403 })
  }

// ── POST — recebe mensagens do Messenger ─────────────────────────
export async function POST(request: NextRequest) {
    try {
          const body = await request.json()

          // Só processa eventos de página
          if (body?.object !== 'page') {
                  return NextResponse.json({ status: 'ignored' })
                }

          const messagingEvents = body.entry?.[0]?.messaging
          if (!messagingEvents || messagingEvents.length === 0) {
                  return NextResponse.json({ status: 'no_message' })
                }

          for (const event of messagingEvents) {
                  const senderId = String(event.sender?.id)

                  // Ignora echo (mensagens enviadas pela página)
                  if (event.message?.is_echo) continue

                  // Só processa mensagens de texto
                  if (!event.message?.text) {
                            await sendMessenger(senderId, '👋 No momento só processo mensagens de texto!\n\nDigite *ajuda* para ver os comandos.')
                            continue
                          }

                  const texto = String(event.message.text).trim()
                  if (!texto) continue

                  console.log(`📱 FB Messenger de ${senderId}: ${texto}`)
                  const resposta = await processarMensagem(senderId, texto)
                  await sendMessenger(senderId, resposta)
                }

          return NextResponse.json({ status: 'ok' })
        } catch (err) {
          console.error('❌ Webhook Facebook erro:', err)
          // Retorna 200 para Meta não reenviar
          return NextResponse.json({ status: 'error' }, { status: 200 })
        }
  }
