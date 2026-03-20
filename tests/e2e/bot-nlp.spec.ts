import { test, expect } from '@playwright/test';

const API = '/api/bot/mensagem';
const BODY = (msg: string) => ({
  whatsapp: '+554196444719',
  mensagem: msg,
  tipo: 'texto',
});

test.describe('Bot NLP API', () => {
  test('"30 bigpao" → gasto', async ({ request }) => {
    const res = await request.post(API, { data: BODY('30 bigpao') });
    const json = await res.json();
    expect(json.intencao).toBe('gasto');
    expect(json.resposta).toContain('30.00');
  });

  test('"gastei 50 no ifood" → gasto alimentação', async ({ request }) => {
    const res = await request.post(API, { data: BODY('gastei 50 no ifood') });
    const json = await res.json();
    expect(json.intencao).toBe('gasto');
    expect(json.resposta).toContain('Alimentação');
  });

  test('"R$150 luz" → gasto moradia', async ({ request }) => {
    const res = await request.post(API, { data: BODY('R$150 luz') });
    const json = await res.json();
    expect(json.intencao).toBe('gasto');
    expect(json.resposta).toContain('Moradia');
  });

  test('"resumo" → resumo', async ({ request }) => {
    const res = await request.post(API, { data: BODY('resumo') });
    const json = await res.json();
    expect(json.intencao).toBe('resumo');
    expect(json.resposta).toContain('Resumo');
  });

  test('"saldo" → resumo', async ({ request }) => {
    const res = await request.post(API, { data: BODY('saldo') });
    const json = await res.json();
    expect(json.intencao).toBe('resumo');
  });

  test('"busca iphone 15" → busca', async ({ request }) => {
    const res = await request.post(API, { data: BODY('busca iphone 15') });
    const json = await res.json();
    expect(json.intencao).toBe('busca');
    expect(json.resposta).toContain('R$');
  });

  test('"oi" → geral', async ({ request }) => {
    const res = await request.post(API, { data: BODY('oi') });
    const json = await res.json();
    expect(json.intencao).toBe('geral');
  });

  test('"30,50 padaria" → gasto decimal com vírgula', async ({ request }) => {
    const res = await request.post(API, { data: BODY('30,50 padaria') });
    const json = await res.json();
    expect(json.intencao).toBe('gasto');
    expect(json.resposta).toContain('30.50');
  });

  test('"paguei 200 aluguel" → gasto moradia', async ({ request }) => {
    const res = await request.post(API, { data: BODY('paguei 200 aluguel') });
    const json = await res.json();
    expect(json.intencao).toBe('gasto');
    expect(json.resposta).toContain('Moradia');
  });

  test('mensagem vazia → erro 400', async ({ request }) => {
    const res = await request.post(API, { data: { whatsapp: '+554196444719', mensagem: '', tipo: 'texto' } });
    expect(res.status()).toBe(400);
  });
});
