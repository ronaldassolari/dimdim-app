export interface AulaContent {
  titulo: string;
  conteudo: string;
  quiz: { pergunta: string; opcoes: string[]; correta: number }[];
}

// ============================================================
// INICIANTE — 10 aulas
// ============================================================

export const AULAS_INICIANTE: AulaContent[] = [
  {
    titulo: 'O que é orçamento e por que você precisa de um',
    conteudo: `## O que é um orçamento pessoal?

Um orçamento é o mapa do seu dinheiro. Ele mostra **de onde vem** (salário, freelance, renda extra) e **para onde vai** (aluguel, comida, transporte, lazer). Sem esse mapa, você dirige no escuro.

### Por que a maioria dos brasileiros não faz orçamento?

Pesquisas do SPC Brasil mostram que **quase 60% dos brasileiros não controlam o próprio orçamento**. O resultado? Gastos invisíveis que somam centenas de reais por mês — aquele cafezinho de R$8 todo dia vira R$176/mês ou **R$2.112/ano**.

### Exemplo prático

Maria ganha R$5.000 líquidos. Sem orçamento, no dia 25 já está no cheque especial. João ganha o mesmo, mas anota tudo: sabe que gasta R$1.500 em moradia, R$800 em alimentação, R$600 em transporte. Sobram R$2.100 que ele divide entre lazer e investimentos.

### Como começar agora

1. **Anote toda receita** do mês (salário, bônus, extras)
2. **Registre cada gasto** — apps como o Dimdim fazem isso automaticamente
3. **Compare**: receita – gastos = quanto sobra (ou falta)
4. **Ajuste**: corte o que não traz valor real

O simples ato de anotar já reduz gastos em até 20%, segundo estudos de finanças comportamentais. Comece hoje.`,
    quiz: [
      {
        pergunta: 'Qual é o principal objetivo de fazer um orçamento pessoal?',
        opcoes: [
          'Gastar menos do que você quer',
          'Saber de onde vem e para onde vai o seu dinheiro',
          'Evitar pagar imposto de renda',
        ],
        correta: 1,
      },
      {
        pergunta: 'Um cafezinho de R$8 por dia, 22 dias úteis por mês, custa quanto no ano?',
        opcoes: ['R$960', 'R$2.112', 'R$1.500'],
        correta: 1,
      },
      {
        pergunta: 'Segundo pesquisas, qual porcentagem dos brasileiros NÃO controla o orçamento?',
        opcoes: ['Cerca de 30%', 'Cerca de 60%', 'Cerca de 80%'],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Diferença entre dívida boa e dívida ruim',
    conteudo: `## Nem toda dívida é igual

Existe uma diferença fundamental entre se endividar para **construir patrimônio** e se endividar para **consumir algo que perde valor**.

### Dívida boa

É aquela que **gera retorno maior que o custo**. Exemplos:
- **Financiamento imobiliário** a 9% a.a. para um imóvel que valoriza 12% a.a.
- **Financiamento estudantil** (FIES) para um curso que aumenta sua renda
- **Empréstimo para investir no próprio negócio** com retorno comprovado

### Dívida ruim

É aquela que **destrói seu patrimônio**. Exemplos:
- **Cartão de crédito rotativo**: cobra em média **410% a.a.** no Brasil — a maior taxa do mundo
- **Cheque especial**: até 150% a.a.
- **Empréstimo pessoal** para comprar eletrônicos, roupas ou viagens

### O custo real no Brasil

Se você deve R$3.000 no rotativo do cartão e paga apenas o mínimo, em 12 meses essa dívida pode passar de **R$15.000**. Isso porque os juros compostos trabalham contra você.

### Regra de ouro

Antes de fazer qualquer dívida, pergunte: **"Isso vai valer mais ou menos daqui a 5 anos?"** Se a resposta for menos, pague à vista ou não compre. Se for mais, analise se o custo do financiamento compensa o retorno esperado.`,
    quiz: [
      {
        pergunta: 'Qual é um exemplo clássico de dívida boa?',
        opcoes: [
          'Parcelar um celular novo no cartão',
          'Financiar um imóvel que valoriza acima do custo do financiamento',
          'Usar o cheque especial para cobrir gastos do mês',
        ],
        correta: 1,
      },
      {
        pergunta: 'Qual é a taxa média anual do cartão de crédito rotativo no Brasil?',
        opcoes: ['Cerca de 50% a.a.', 'Cerca de 150% a.a.', 'Acima de 400% a.a.'],
        correta: 2,
      },
      {
        pergunta: 'R$3.000 no rotativo do cartão, pagando só o mínimo, pode virar quanto em 12 meses?',
        opcoes: ['R$4.500', 'R$8.000', 'Mais de R$15.000'],
        correta: 2,
      },
    ],
  },
  {
    titulo: 'O que são juros compostos (a 8ª maravilha do mundo)',
    conteudo: `## Juros sobre juros: o conceito mais importante das finanças

A frase atribuída a Einstein diz: *"Os juros compostos são a oitava maravilha do mundo. Quem entende, ganha. Quem não entende, paga."*

### Juros simples vs compostos

- **Juros simples**: incidem apenas sobre o valor inicial. R$1.000 a 1% a.m. por 12 meses = R$1.000 + R$120 = **R$1.120**
- **Juros compostos**: incidem sobre o valor **atualizado**. R$1.000 a 1% a.m. por 12 meses = **R$1.126,83**

A diferença parece pequena em 1 ano, mas em 20 anos é brutal.

### O poder do tempo

R$500/mês investidos a 1% a.m. (≈12,68% a.a.):
- Em **5 anos**: R$40.834
- Em **10 anos**: R$115.019
- Em **20 anos**: R$494.627

Você aportou R$120.000 em 20 anos, mas os juros geraram quase **R$375.000 extras**. Isso é o efeito bola de neve.

### O lado sombrio

Os mesmos juros compostos que enriquecem o investidor **destroem o devedor**. Um cartão com rotativo de 15% a.m. transforma R$1.000 em R$5.350 em apenas 12 meses.

### Lição prática

Comece a investir **o mais cedo possível**, mesmo que pouco. O tempo é o ingrediente principal dos juros compostos.`,
    quiz: [
      {
        pergunta: 'R$1.000 aplicados a 1% a.m. em juros compostos rendem quanto em 12 meses?',
        opcoes: ['R$1.120,00', 'R$1.126,83', 'R$1.200,00'],
        correta: 1,
      },
      {
        pergunta: 'Qual é a principal diferença entre juros simples e compostos?',
        opcoes: [
          'Juros simples rendem mais',
          'Juros compostos incidem sobre o valor atualizado (principal + juros acumulados)',
          'Não há diferença prática',
        ],
        correta: 1,
      },
      {
        pergunta: 'R$500/mês a 1% a.m. por 20 anos gera aproximadamente quanto?',
        opcoes: ['R$120.000', 'R$250.000', 'R$494.000'],
        correta: 2,
      },
    ],
  },
  {
    titulo: 'Como montar sua reserva de emergência',
    conteudo: `## Sua rede de segurança financeira

A reserva de emergência é o dinheiro guardado para **imprevistos**: perda de emprego, problema de saúde, conserto urgente. Sem ela, qualquer imprevisto vira dívida.

### Quanto guardar?

A regra geral é **3 a 6 meses de gastos essenciais**:
- CLT com estabilidade: 3 meses
- Autônomo ou freelancer: 6 meses ou mais
- Exemplo: se seus gastos mensais são R$3.000, sua reserva deve ser entre **R$9.000 e R$18.000**

### Onde guardar? (Liquidez é a prioridade!)

A reserva precisa ter **liquidez diária** (resgate rápido) e **baixo risco**:

✅ **Tesouro Selic** — rende ≈100% da Selic, resgate em D+1, garantido pelo governo
✅ **CDB 100% CDI com liquidez diária** — Nubank, Inter, C6 oferecem. Protegido pelo FGC até R$250.000
✅ **Conta remunerada** — Nubank, Mercado Pago (rendem 100% CDI)

❌ **Poupança** — rende apenas 70% da Selic quando ela está acima de 8,5%. Perde para a inflação em muitos períodos
❌ **Ações ou FIIs** — têm volatilidade, podem cair quando você mais precisa

### Como começar

Defina um valor mensal automático (mesmo que R$100). Programe transferência no dia do salário. Trate como uma conta obrigatória, não como "o que sobrar".`,
    quiz: [
      {
        pergunta: 'Qual é o tamanho recomendado da reserva de emergência para um CLT?',
        opcoes: [
          '1 mês de salário',
          '3 a 6 meses de gastos essenciais',
          '12 meses de renda bruta',
        ],
        correta: 1,
      },
      {
        pergunta: 'Qual destes NÃO é recomendado para guardar a reserva de emergência?',
        opcoes: ['Tesouro Selic', 'CDB 100% CDI com liquidez diária', 'Ações na B3'],
        correta: 2,
      },
      {
        pergunta: 'Por que a poupança não é ideal para reserva de emergência?',
        opcoes: [
          'Porque tem risco de crédito alto',
          'Porque rende menos que outras opções seguras e pode perder para a inflação',
          'Porque não tem liquidez',
        ],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Cartão de crédito: vilão ou aliado?',
    conteudo: `## Entendendo o cartão de crédito

O cartão de crédito é a ferramenta financeira mais usada e mais **mal usada** no Brasil. Em 2024, mais de 70 milhões de brasileiros tinham dívidas no cartão.

### Como funciona

1. Você compra durante o mês (período de faturamento)
2. Recebe a **fatura** com todas as compras
3. Tem até o **vencimento** para pagar
4. Se pagar integral: **juros zero**
5. Se pagar o mínimo ou parcial: entra no **rotativo** (400%+ a.a.)

### O perigo do pagamento mínimo

O mínimo (geralmente 15% da fatura) parece um alívio, mas é uma armadilha. Exemplo: fatura de R$2.000, mínimo de R$300. Os R$1.700 restantes entram no rotativo. Em 3 meses, sua dívida já ultrapassa R$3.500.

### Como usar a seu favor

- **Pague sempre 100% da fatura** — use como meio de pagamento, não como crédito
- **Concentre gastos** em um cartão com bom programa de pontos
- **Defina um limite pessoal** menor que o limite do banco
- Aproveite **parcelamento sem juros** quando disponível (lojista paga o custo)

### Pontos e cashback

Cartões como Nubank Ultravioleta, Inter Black ou Itaú Personnalité oferecem 1-2% de cashback ou pontos que viram milhas. Em R$3.000/mês de gastos, isso pode render R$360-720/ano em benefícios — desde que você **nunca pague juros**.`,
    quiz: [
      {
        pergunta: 'O que acontece se você paga apenas o valor mínimo da fatura do cartão?',
        opcoes: [
          'O restante é perdoado pelo banco',
          'O restante entra no crédito rotativo com juros altíssimos',
          'Não acontece nada, o saldo some no próximo mês',
        ],
        correta: 1,
      },
      {
        pergunta: 'Qual a melhor forma de usar o cartão de crédito?',
        opcoes: [
          'Pagar sempre o mínimo para manter crédito disponível',
          'Usar como crédito e parcelar o máximo possível',
          'Pagar 100% da fatura e usar como meio de pagamento',
        ],
        correta: 2,
      },
      {
        pergunta: 'Quem paga o custo do parcelamento sem juros nas lojas?',
        opcoes: ['O consumidor, embutido no preço', 'O lojista', 'O governo federal'],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Como categorizar seus gastos',
    conteudo: `## Por que categorizar gastos muda tudo

Saber que gastou R$4.200 no mês não ajuda muito. Saber que R$1.200 foram em alimentação fora de casa — **isso sim muda comportamento**.

### Categorias essenciais

Organize seus gastos nestas categorias principais:
- **Moradia**: aluguel/financiamento, condomínio, IPTU, energia, água, gás, internet
- **Alimentação**: supermercado, restaurantes, iFood, padaria
- **Transporte**: combustível, estacionamento, Uber, metrô, manutenção do carro
- **Saúde**: plano de saúde, farmácia, consultas, academia
- **Educação**: cursos, faculdade, livros, materiais
- **Lazer**: streaming, bares, viagens, hobbies
- **Pessoais**: roupas, beleza, presentes

### Gastos fixos vs variáveis

**Fixos** são previsíveis todo mês (aluguel, plano de saúde, streaming). **Variáveis** mudam conforme seu comportamento (alimentação fora, Uber, compras). É nos variáveis que estão as maiores oportunidades de economia.

### Automatize com tecnologia

Apps como o Dimdim categorizam transações automaticamente usando inteligência artificial. Ao conectar sua conta, cada compra é classificada — Pix no iFood vai para "Alimentação", recarga de Uber para "Transporte". Isso elimina o trabalho manual e mostra padrões que você não percebe sozinho.

### Descubra seus vilões

Após 1 mês categorizando, identifique os **3 maiores gastos variáveis**. Ali está seu potencial de economia imediata.`,
    quiz: [
      {
        pergunta: 'Qual é a vantagem de categorizar gastos em vez de apenas somar o total?',
        opcoes: [
          'Facilita o pagamento de impostos',
          'Permite identificar onde exatamente o dinheiro está indo e agir sobre isso',
          'É obrigatório pelo Banco Central',
        ],
        correta: 1,
      },
      {
        pergunta: 'Qual destes é um exemplo de gasto variável?',
        opcoes: ['Aluguel', 'Plano de saúde', 'Alimentação fora de casa'],
        correta: 2,
      },
      {
        pergunta: 'Em qual tipo de gasto geralmente há maior oportunidade de economia?',
        opcoes: ['Gastos fixos como aluguel', 'Gastos variáveis como lazer e alimentação fora', 'Impostos'],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Regra 50-30-20: necessidades, desejos, investimentos',
    conteudo: `## O método mais simples de orçamento pessoal

Criada pela senadora americana Elizabeth Warren, a regra 50-30-20 divide sua **renda líquida** em três blocos:

### 50% — Necessidades

Gastos essenciais que você não pode evitar:
- Aluguel ou financiamento
- Supermercado, energia, água, gás
- Transporte para o trabalho
- Plano de saúde, farmácia básica

Se suas necessidades passam de 50%, é sinal de que sua moradia ou estilo de vida está acima da sua renda.

### 30% — Desejos

Tudo que melhora sua qualidade de vida mas não é essencial:
- Streaming (Netflix, Spotify), restaurantes, delivery
- Roupas além do básico, academia premium
- Viagens, hobbies, presentes

### 20% — Investimentos e dívidas

Seu futuro financeiro:
- Reserva de emergência (prioridade 1)
- Pagar dívidas acima do mínimo
- Investimentos (Tesouro, CDB, ações)

### Exemplo prático: salário líquido de R$4.000

| Categoria | % | Valor |
|-----------|---|-------|
| Necessidades | 50% | R$2.000 |
| Desejos | 30% | R$1.200 |
| Investimentos | 20% | R$800 |

### Adaptação à realidade brasileira

Em cidades como São Paulo, o aluguel sozinho pode consumir 35%+ da renda. Nesse caso, ajuste para 60-20-20 ou 55-25-20, mas **nunca elimine os 20% de investimentos**. Reduza desejos primeiro.`,
    quiz: [
      {
        pergunta: 'Na regra 50-30-20, qual porcentagem deve ir para investimentos e pagamento de dívidas?',
        opcoes: ['50%', '30%', '20%'],
        correta: 2,
      },
      {
        pergunta: 'Se você ganha R$4.000 líquidos, quanto deveria destinar para necessidades segundo a regra?',
        opcoes: ['R$1.200', 'R$2.000', 'R$2.800'],
        correta: 1,
      },
      {
        pergunta: 'Se suas necessidades ultrapassam 50% da renda, o que a regra sugere?',
        opcoes: [
          'Eliminar os investimentos para compensar',
          'Reduzir desejos primeiro, mas manter os 20% de investimentos',
          'Pedir um empréstimo para cobrir a diferença',
        ],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'O que é inflação e como ela corrói seu dinheiro',
    conteudo: `## O inimigo invisível do seu dinheiro

Inflação é o aumento generalizado dos preços ao longo do tempo. Quando o IPCA (índice oficial brasileiro) marca 5% ao ano, significa que o que custava R$100 agora custa **R$105**.

### O efeito prático

Se você guarda R$10.000 debaixo do colchão e a inflação é 5% a.a., após 1 ano seu dinheiro compra o equivalente a **R$9.524** em poder de compra. Em 10 anos, cai para R$5.987. Você ainda tem as mesmas notas, mas elas compram quase metade.

### Rendimento real vs nominal

- **Nominal**: o que o banco mostra (ex: poupança rendeu 7%)
- **Real**: nominal menos inflação (7% - 5% = **2% real**)

A poupança frequentemente perde para a inflação. Em 2021, o IPCA foi 10,06% e a poupança rendeu apenas 4,94% — quem deixou na poupança **perdeu dinheiro** em termos reais.

### O trauma brasileiro

O Brasil viveu hiperinflação nos anos 80-90. Preços dobravam em semanas. O Plano Real (1994) estabilizou a moeda, mas a inflação nunca parou — apenas ficou controlável (meta de 3% a.a. com tolerância de 1,5%).

### Proteja-se da inflação

Invista em ativos que **rendem acima do IPCA**: Tesouro IPCA+, CDBs atrelados ao IPCA, FIIs e ações de empresas com poder de repasse de preços. Nunca deixe dinheiro parado.`,
    quiz: [
      {
        pergunta: 'Se a inflação é 5% ao ano, R$100 hoje equivalem a quanto em poder de compra daqui a 1 ano?',
        opcoes: ['R$105', 'R$95,24', 'R$100'],
        correta: 1,
      },
      {
        pergunta: 'Qual é o índice oficial de inflação do Brasil?',
        opcoes: ['Selic', 'CDI', 'IPCA'],
        correta: 2,
      },
      {
        pergunta: 'Se a poupança rende 7% e a inflação é 10%, qual é o rendimento real?',
        opcoes: ['7%', '-3% (perda real)', '17%'],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Como sair do vermelho em 90 dias',
    conteudo: `## Plano de ação para quitar dívidas

Estar endividado gera estresse, insônia e problemas de relacionamento. A boa notícia: com método, é possível sair do vermelho em 90 dias.

### Passo 1: Liste TODAS as dívidas (Semana 1)

Anote: credor, valor total, taxa de juros mensal, parcela mínima. Exemplo:
- Cartão de crédito: R$3.000 a 14% a.m.
- Empréstimo pessoal: R$5.000 a 3% a.m.
- Cheque especial: R$1.500 a 8% a.m.

### Passo 2: Negocie (Semanas 2-3)

- **Serasa Limpa Nome**: oferece descontos de 40-90% para pagamento à vista
- **Mutirões de negociação** dos Procons estaduais
- Ligue direto para o banco: peça troca do rotativo por parcelado (juros menores)

### Passo 3: Escolha uma estratégia

- **Avalanche** (matemático): pague primeiro a dívida com **maior juros**. Economiza mais dinheiro no total
- **Bola de neve** (psicológico): pague primeiro a dívida com **menor saldo**. Gera motivação ao eliminar dívidas rápido

### Passo 4: Corte temporário (90 dias)

Cancele streaming, reduza delivery, venda o que não usa (Enjoei, OLX). Todo R$1 extra vai para as dívidas. É temporário — não é para sempre.

### Passo 5: Previna recaídas

Após quitar, construa a reserva de emergência antes de qualquer novo gasto. Use o Dimdim para monitorar e nunca mais ser pego de surpresa.`,
    quiz: [
      {
        pergunta: 'No método avalanche, qual dívida você prioriza pagar primeiro?',
        opcoes: [
          'A de menor valor total',
          'A de maior taxa de juros',
          'A mais antiga',
        ],
        correta: 1,
      },
      {
        pergunta: 'Qual plataforma oferece descontos de até 90% para quitar dívidas à vista?',
        opcoes: ['Banco Central', 'Serasa Limpa Nome', 'Receita Federal'],
        correta: 1,
      },
      {
        pergunta: 'Qual é a vantagem do método bola de neve sobre o avalanche?',
        opcoes: [
          'Economiza mais dinheiro em juros',
          'Gera motivação psicológica ao eliminar dívidas menores rapidamente',
          'É recomendado pelo Banco Central',
        ],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Primeiros passos para poupar todo mês',
    conteudo: `## Poupar não é se privar — é se priorizar

A maioria das pessoas tenta poupar "o que sobra" no fim do mês. O problema? Nunca sobra. A solução é simples: **pague-se primeiro**.

### O conceito de "pague-se primeiro"

No dia que o salário cai, antes de qualquer gasto, transfira uma quantia para investimentos. Trate como uma conta obrigatória, como aluguel ou energia.

### Comece pequeno — mas comece

- **R$50/mês** investidos a 10% a.a. por 20 anos = **R$38.283**
- **R$200/mês** nas mesmas condições = **R$153.132**
- **R$500/mês** = **R$382.830**

O valor inicial importa menos que a **consistência**. Pular meses destrói o efeito dos juros compostos.

### Automatize tudo

Configure débito automático ou Pix agendado recorrente para o dia do pagamento. Quando é automático, você não precisa de disciplina — o sistema faz por você.

### Truques que funcionam

1. **Arredonde gastos**: comprou algo por R$47? Transfira R$3 para investimento (arredondando para R$50)
2. **Desafio das 52 semanas**: semana 1 guarde R$5, semana 2 R$10... semana 52 R$260. Total: R$6.890/ano
3. **Regra das 24h**: quer comprar algo caro? Espere 24h. Se ainda quiser, compre. Muitas compras por impulso desaparecem

### Celebre os marcos

A cada R$1.000 guardados, comemore (sem gastar muito!). Reforço positivo cria hábito. O Dimdim mostra seu progresso com badges e metas visuais para manter a motivação.`,
    quiz: [
      {
        pergunta: 'O que significa o conceito de "pague-se primeiro"?',
        opcoes: [
          'Pagar todas as contas antes de gastar com lazer',
          'Separar dinheiro para investimentos ANTES de qualquer outro gasto',
          'Pagar as dívidas mais caras primeiro',
        ],
        correta: 1,
      },
      {
        pergunta: 'Qual é a melhor forma de garantir que você poupe todo mês?',
        opcoes: [
          'Guardar o que sobrar no fim do mês',
          'Automatizar uma transferência no dia do pagamento',
          'Anotar num caderno quanto quer poupar',
        ],
        correta: 1,
      },
      {
        pergunta: 'No desafio das 52 semanas (começando com R$5 e aumentando R$5/semana), quanto se acumula no ano?',
        opcoes: ['R$2.600', 'R$5.200', 'R$6.890'],
        correta: 2,
      },
    ],
  },
];

// ============================================================
// MODERADO — 10 aulas
// ============================================================

export const AULAS_MODERADO: AulaContent[] = [
  {
    titulo: 'Tesouro Direto: o investimento mais seguro do Brasil',
    conteudo: `## O que é o Tesouro Direto?

O Tesouro Direto é um programa do **Governo Federal** que permite a qualquer pessoa emprestar dinheiro ao governo em troca de juros. É o investimento mais seguro do Brasil porque o risco é o próprio país quebrar.

### Tipos de título

- **Tesouro Selic (LFT)**: rende a taxa Selic. Ideal para **reserva de emergência** — não perde valor se resgatado antes do vencimento
- **Tesouro IPCA+ (NTN-B)**: rende IPCA + taxa fixa (ex: IPCA + 6%). Protege da inflação. Ideal para **metas de longo prazo** (5+ anos)
- **Tesouro Prefixado (LTN)**: taxa fixa definida na compra (ex: 12% a.a.). Ideal quando você acredita que os juros vão **cair**

### Como investir

1. Abra conta em uma corretora (muitas têm taxa zero: Nubank, Inter, XP)
2. Acesse a plataforma do Tesouro Direto
3. Escolha o título e o valor (mínimo de aproximadamente **R$30**)
4. Confirme a compra — o título fica custodiado na B3

### Custos

- **Taxa de custódia B3**: 0,20% a.a. sobre o valor investido (isento até R$10.000 no Tesouro Selic)
- **IR regressivo**: de 22,5% (até 180 dias) a 15% (acima de 720 dias)

### Dica prática

Use o Tesouro Selic para reserva de emergência e o IPCA+ para aposentadoria. Ambos são comprados no mesmo lugar e com o mesmo cadastro.`,
    quiz: [
      {
        pergunta: 'Qual título do Tesouro Direto é mais indicado para reserva de emergência?',
        opcoes: ['Tesouro IPCA+', 'Tesouro Selic', 'Tesouro Prefixado'],
        correta: 1,
      },
      {
        pergunta: 'Qual é o investimento mínimo aproximado no Tesouro Direto?',
        opcoes: ['R$30', 'R$500', 'R$1.000'],
        correta: 0,
      },
      {
        pergunta: 'O que acontece com o Tesouro IPCA+ se resgatado antes do vencimento?',
        opcoes: [
          'Rende sempre mais que o Tesouro Selic',
          'Pode ter rentabilidade negativa (marcação a mercado)',
          'Não pode ser resgatado antes do vencimento',
        ],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'CDB, LCI e LCA: o que são e como funcionam',
    conteudo: `## Emprestando dinheiro para bancos

Quando você investe em CDB, LCI ou LCA, está **emprestando dinheiro** para o banco. Em troca, ele paga juros.

### CDB (Certificado de Depósito Bancário)

- Emitido por qualquer banco
- Rentabilidade comum: 100% a 120% do CDI
- **Tem Imposto de Renda** (tabela regressiva: 22,5% a 15%)
- Pode ter liquidez diária ou prazo fixo

### LCI (Letra de Crédito Imobiliário)

- O banco usa seu dinheiro para financiar o setor imobiliário
- **Isenta de IR para pessoa física**
- Rentabilidade típica: 90-97% do CDI
- Geralmente exige prazo mínimo de 90 dias

### LCA (Letra de Crédito do Agronegócio)

- Funciona igual à LCI, mas financia o agronegócio
- **Também isenta de IR**
- Rentabilidade similar à LCI

### Qual rende mais? A conta que poucos fazem

CDB 110% CDI **com IR** vs LCI 93% CDI **sem IR** (prazo de 1 ano, IR de 17,5%):
- CDB: 110% × (1 - 0,175) = **90,75% do CDI líquido**
- LCI: **93% do CDI líquido**
- **LCI vence!**

### Segurança: FGC

Todos são protegidos pelo **Fundo Garantidor de Créditos** até **R$250.000 por CPF por instituição**. Isso significa que mesmo se o banco quebrar, você recebe até esse limite. Distribua valores maiores entre bancos diferentes.`,
    quiz: [
      {
        pergunta: 'Qual destes investimentos é isento de Imposto de Renda para pessoa física?',
        opcoes: ['CDB', 'LCI', 'Tesouro Selic'],
        correta: 1,
      },
      {
        pergunta: 'Até quanto o FGC garante por CPF por instituição financeira?',
        opcoes: ['R$100.000', 'R$250.000', 'R$500.000'],
        correta: 1,
      },
      {
        pergunta: 'Um CDB 110% CDI com IR de 17,5% rende líquido aproximadamente quanto do CDI?',
        opcoes: ['110%', '90,75%', '100%'],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Fundo de renda fixa vs investimento direto',
    conteudo: `## Investir sozinho ou via fundo?

Fundos de investimento funcionam como um "condomínio": vários investidores colocam dinheiro juntos e um **gestor profissional** decide onde aplicar.

### Como funciona um fundo de renda fixa

Você compra **cotas** do fundo. O gestor aplica em Tesouro, CDBs, debêntures e outros ativos de renda fixa. O valor da cota sobe conforme os investimentos rendem.

### Vantagens dos fundos

- **Diversificação automática**: o gestor investe em dezenas de ativos diferentes
- **Gestão profissional**: alguém qualificado toma as decisões
- **Praticidade**: você não precisa escolher cada título
- **Acesso a ativos exclusivos**: fundos podem acessar CDBs e debêntures com taxas melhores que o varejo

### Desvantagens dos fundos

- **Taxa de administração**: varia de 0,3% a 2% a.a. — come rentabilidade silenciosamente
- **Come-cotas**: antecipação semestral do IR (maio e novembro), reduzindo o efeito dos juros compostos
- **Menos controle**: você não escolhe os ativos
- **Rentabilidade passada não garante futura**

### Quando o fundo faz sentido?

- Quando você tem **pouco tempo** para gerenciar investimentos
- Quando o fundo acessa **taxas melhores** que o varejo
- Quando a taxa de administração é **menor que 0,5% a.a.**

### Quando investir direto é melhor?

Se você aplica em Tesouro Selic ou CDB de bancão, não precisa de gestor. Compre direto, pague menos taxas e tenha controle total.`,
    quiz: [
      {
        pergunta: 'O que é o "come-cotas" nos fundos de investimento?',
        opcoes: [
          'Taxa cobrada na compra das cotas',
          'Antecipação semestral do Imposto de Renda que reduz suas cotas',
          'Desconto dado para investidores antigos',
        ],
        correta: 1,
      },
      {
        pergunta: 'Qual é uma desvantagem de investir via fundo em vez de direto?',
        opcoes: [
          'Não tem proteção do FGC',
          'Cobra taxa de administração que reduz a rentabilidade',
          'Não pode investir em Tesouro Direto',
        ],
        correta: 1,
      },
      {
        pergunta: 'Em qual situação investir direto (sem fundo) é mais vantajoso?',
        opcoes: [
          'Quando você quer acesso a debêntures exclusivas',
          'Quando aplica em Tesouro Selic ou CDB simples e quer pagar menos taxas',
          'Quando não tem tempo de acompanhar investimentos',
        ],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Como funciona o Imposto de Renda em investimentos',
    conteudo: `## IR em investimentos: não pague mais do que deve

Entender a tributação é essencial para escolher investimentos. No Brasil, a maioria dos investimentos de renda fixa segue a **tabela regressiva de IR**.

### Tabela regressiva

| Prazo | Alíquota |
|-------|----------|
| Até 180 dias | 22,5% |
| 181 a 360 dias | 20,0% |
| 361 a 720 dias | 17,5% |
| Acima de 720 dias | 15,0% |

O IR incide apenas sobre o **rendimento** (lucro), não sobre o valor total investido. Se aplicou R$10.000 e resgatou R$10.800, paga IR sobre R$800.

### IOF nos primeiros 30 dias

Resgates antes de 30 dias pagam IOF regressivo (de 96% a 0% sobre o rendimento). Após 30 dias, IOF é zero. Nunca resgate investimentos antes de 30 dias se puder evitar.

### Investimentos ISENTOS de IR

- **LCI e LCA**: totalmente isentos para pessoa física
- **Dividendos de ações e FIIs**: isentos (por enquanto — pode mudar)
- **Poupança**: isenta, mas rende pouco
- **Debêntures incentivadas**: isentas (infraestrutura)

### Retenção na fonte

Em Tesouro Direto e CDB, o IR é **retido automaticamente** no resgate. Você não precisa pagar DARF nem declarar pagamento — apenas informar na declaração anual.

### Estratégia prática

Para objetivos de curto prazo (< 1 ano), prefira LCI/LCA (isentos). Para longo prazo (> 2 anos), CDB e Tesouro compensam pois a alíquota cai para 15%.`,
    quiz: [
      {
        pergunta: 'Qual é a alíquota de IR para investimentos em renda fixa com prazo acima de 720 dias?',
        opcoes: ['22,5%', '17,5%', '15%'],
        correta: 2,
      },
      {
        pergunta: 'Qual imposto incide sobre resgates de renda fixa nos primeiros 30 dias?',
        opcoes: ['Apenas IR', 'IOF + IR', 'ICMS'],
        correta: 1,
      },
      {
        pergunta: 'Qual destes investimentos é isento de Imposto de Renda para pessoa física?',
        opcoes: ['CDB', 'Tesouro Selic', 'LCA'],
        correta: 2,
      },
    ],
  },
  {
    titulo: 'O que é taxa Selic e como ela afeta sua vida',
    conteudo: `## A taxa que move toda a economia

A **Selic** (Sistema Especial de Liquidação e Custódia) é a taxa básica de juros da economia brasileira, definida a cada 45 dias pelo **Copom** (Comitê de Política Monetária do Banco Central).

### Como a Selic afeta você diretamente

**Quando a Selic SOBE:**
- Financiamentos ficam mais caros (imóvel, carro)
- Cartão de crédito e cheque especial ficam mais caros
- Renda fixa (CDB, Tesouro) rende **mais**
- Consumo desacelera → inflação tende a cair
- Bolsa de valores tende a cair (empresas investem menos)

**Quando a Selic DESCE:**
- Crédito fica mais barato — bom momento para financiar
- Renda fixa rende **menos**
- Bolsa tende a subir (empresas investem mais e lucram mais)
- Consumo acelera → economia aquece

### CDI ≈ Selic

O **CDI** (taxa de empréstimos entre bancos) acompanha a Selic de perto. Quando investimentos dizem "100% CDI", estão rendendo praticamente a taxa Selic.

### Impacto prático

Com Selic a 13,75%: um CDB 100% CDI rende ~13,75% a.a. bruto. Ótimo para renda fixa.
Com Selic a 2%: o mesmo CDB rende ~2% a.a. Péssimo — mal cobre a inflação.

### O que fazer em cada cenário

- **Selic alta**: priorize renda fixa, evite financiamentos, pague dívidas
- **Selic baixa**: considere mais renda variável (ações, FIIs), aproveite crédito barato para investir em patrimônio`,
    quiz: [
      {
        pergunta: 'Quem define a taxa Selic no Brasil?',
        opcoes: ['Presidente da República', 'Copom do Banco Central', 'Congresso Nacional'],
        correta: 1,
      },
      {
        pergunta: 'O que tende a acontecer quando a Selic sobe?',
        opcoes: [
          'Renda fixa rende menos e bolsa sobe',
          'Crédito fica mais barato e consumo aumenta',
          'Renda fixa rende mais e crédito fica mais caro',
        ],
        correta: 2,
      },
      {
        pergunta: 'CDI é aproximadamente igual a qual taxa?',
        opcoes: ['IPCA', 'Selic', 'IGPM'],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Planejamento de metas financeiras em 1, 5 e 10 anos',
    conteudo: `## Dinheiro sem destino é dinheiro que desaparece

Investir sem meta é como dirigir sem GPS. Você pode até se mover, mas não sabe se está chegando a algum lugar. Metas financeiras dão **direção e motivação**.

### O método SMART para metas financeiras

Toda meta deve ser: **Específica, Mensurável, Atingível, Relevante e Temporal**.
- ❌ "Quero guardar dinheiro" → vago
- ✅ "Quero juntar R$18.000 para reserva de emergência em 12 meses" → SMART

### Metas de curto prazo (até 1 ano)

- Reserva de emergência
- Quitar dívidas pendentes
- Comprar algo específico à vista
- **Onde investir**: Tesouro Selic, CDB liquidez diária, LCI/LCA curta

### Metas de médio prazo (1-5 anos)

- Entrada de um apartamento (20% do valor)
- Trocar de carro
- Fazer uma viagem internacional
- **Onde investir**: CDB a prazo, Tesouro IPCA+ 2029, LCI/LCA longa

### Metas de longo prazo (5-10+ anos)

- Aposentadoria antecipada
- Independência financeira
- Patrimônio para filhos
- **Onde investir**: Tesouro IPCA+ 2045, ações, FIIs, previdência privada

### Cálculo prático

Meta: R$60.000 em 5 anos (entrada de imóvel). A 10% a.a.:
- Aporte necessário: **R$772/mês**
- Total aportado: R$46.320
- Juros ganhos: R$13.680

Use calculadoras online do Tesouro Direto ou da CVM para simular seus cenários.`,
    quiz: [
      {
        pergunta: 'Para uma meta de curto prazo (menos de 1 ano), qual investimento é mais adequado?',
        opcoes: ['Ações na bolsa', 'Tesouro Selic ou CDB com liquidez diária', 'Fundo de ações'],
        correta: 1,
      },
      {
        pergunta: 'O que significa uma meta SMART?',
        opcoes: [
          'Uma meta inteligente, sem critérios específicos',
          'Específica, Mensurável, Atingível, Relevante e Temporal',
          'Uma meta definida por um robô de investimentos',
        ],
        correta: 1,
      },
      {
        pergunta: 'Para juntar R$60.000 em 5 anos a 10% a.a., o aporte mensal aproximado é:',
        opcoes: ['R$500', 'R$772', 'R$1.000'],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Como usar cartão de crédito para acumular pontos sem gastar mais',
    conteudo: `## Transforme gastos obrigatórios em benefícios

O segredo não é gastar mais — é **concentrar gastos que você já teria** em um único cartão com bom programa de recompensas.

### Regras de ouro

1. **NUNCA pague juros** — se a fatura não for paga integralmente, qualquer benefício de pontos é anulado
2. **Use apenas para gastos planejados** — não gaste mais só para acumular pontos
3. **Concentre em 1 cartão** — fragmentar gastos dilui os pontos

### Principais programas brasileiros

- **Livelo**: parceiro de Bradesco e BB. Pontos valem milhas, produtos e cashback
- **Smiles (GOL)**: milhas para passagens domésticas e internacionais
- **TudoAzul (Azul)**: bom para voos domésticos, pontos não expiram se houver movimentação
- **iupp (Itaú)**: pontos que viram cashback, viagens ou produtos

### A matemática dos pontos

Cartão premium que dá 2 pontos/dólar (≈10 pontos/R$1):
- Gastos mensais: R$4.000
- Pontos/mês: 40.000
- Pontos/ano: 480.000
- Passagem SP→Lisboa ida e volta: ~80.000-120.000 milhas
- Resultado: **até 4 passagens internacionais por ano** sem gastar nada extra

### Bônus de transferência

Periodicamente, programas oferecem **bônus de 80-100%** na transferência de pontos. Se o Livelo está com bônus de 100% para TudoAzul, seus 50.000 pontos viram 100.000 milhas. Acompanhe essas promoções.

### Anuidade: faça a conta

Cartão com anuidade de R$1.200/ano só compensa se os benefícios (pontos + sala VIP + cashback) **superarem esse custo**. Muitos cartões negociam isenção via gasto mínimo.`,
    quiz: [
      {
        pergunta: 'Qual é a regra número 1 para acumular pontos no cartão de crédito?',
        opcoes: [
          'Gastar o máximo possível para ter mais pontos',
          'Nunca pagar juros — sempre quitar a fatura integralmente',
          'Ter vários cartões para diversificar os pontos',
        ],
        correta: 1,
      },
      {
        pergunta: 'O que é um bônus de transferência em programas de milhas?',
        opcoes: [
          'Desconto na anuidade do cartão',
          'Promoção que multiplica seus pontos ao transferir entre programas',
          'Cashback automático nas compras',
        ],
        correta: 1,
      },
      {
        pergunta: 'Por que concentrar gastos em um único cartão é vantajoso?',
        opcoes: [
          'Porque bancos dão desconto no IR',
          'Porque acumula mais pontos em um só programa e facilita atingir benefícios',
          'Porque limita seus gastos mensais',
        ],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Seguros: quais você realmente precisa',
    conteudo: `## Seguro bom é o que protege — não o que vende

O mercado de seguros no Brasil fatura bilhões, mas muitas apólices são **desnecessárias ou com custo-benefício ruim**. Entenda o que vale a pena.

### Seguros ESSENCIAIS

**Seguro de vida** (se tem dependentes):
- Protege cônjuge e filhos se algo acontecer com você
- Valor ideal: 5-10x sua renda anual
- Custo médio: R$50-200/mês dependendo do valor e idade
- Priorize cobertura por morte e invalidez

**Seguro saúde/plano de saúde:**
- No Brasil, uma internação pode custar R$20.000-100.000+
- Se não tem plano da empresa, considere planos individuais ou cooperativas (Unimed)

**Seguro auto** (se tem carro):
- Carro é patrimônio significativo. Roubo sem seguro = perda total
- Compare preços: susep.gov.br lista corretoras autorizadas

### Seguros DISPENSÁVEIS

- **Capitalização**: não é investimento nem seguro — rende menos que poupança e as chances de ganhar o sorteio são mínimas. Gerente de banco empurra porque dá comissão
- **Garantia estendida**: fabricantes já oferecem garantia legal de 90 dias. O custo extra raramente compensa
- **Seguro de celular**: franquia alta, burocracia para acionar. Melhor guardar o dinheiro
- **Seguro prestamista embutido em empréstimos**: encarece o crédito sem você perceber

### Regra prática

Faça seguro contra riscos que podem **destruir suas finanças** (morte, invalidez, perda do carro). Não faça seguro contra inconveniências pequenas (celular quebrado, eletrodoméstico).`,
    quiz: [
      {
        pergunta: 'Qual destes seguros é considerado essencial para quem tem dependentes?',
        opcoes: ['Seguro de celular', 'Seguro de vida', 'Garantia estendida'],
        correta: 1,
      },
      {
        pergunta: 'Por que título de capitalização NÃO é um bom produto financeiro?',
        opcoes: [
          'Porque é ilegal no Brasil',
          'Porque rende menos que a poupança e as chances de ganhar o sorteio são mínimas',
          'Porque tem risco de crédito altíssimo',
        ],
        correta: 1,
      },
      {
        pergunta: 'Qual é a regra prática para decidir se precisa de um seguro?',
        opcoes: [
          'Se o prêmio mensal cabe no orçamento, sempre vale a pena',
          'Faça seguro contra riscos que podem destruir suas finanças, não contra inconveniências pequenas',
          'Quanto mais seguros melhor, para cobrir qualquer situação',
        ],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Previdência privada PGBL vs VGBL',
    conteudo: `## Aposentadoria além do INSS

A previdência privada complementa a aposentadoria pública (INSS). Mas a escolha errada pode custar **milhares de reais** em impostos e taxas.

### PGBL (Plano Gerador de Benefício Livre)

- **Deduz do IR**: até 12% da renda bruta anual
- Indicado para quem faz declaração **completa**
- Exemplo: renda bruta R$120.000/ano → pode deduzir até R$14.400, economizando R$3.960 de IR (alíquota 27,5%)
- **Atenção**: no resgate, o IR incide sobre o valor **total** (aporte + rendimento)

### VGBL (Vida Gerador de Benefício Livre)

- **NÃO deduz** do IR
- Indicado para quem faz declaração **simplificada** ou já usa os 12% do PGBL
- No resgate, o IR incide apenas sobre o **rendimento** (não sobre o aporte)

### Tabela progressiva vs regressiva

Na contratação, você escolhe:
- **Progressiva**: alíquotas de 0% a 27,5% (como salário). Boa se resgatar pouco por mês
- **Regressiva**: começa em 35% e cai até **10% após 10 anos**. Ideal para longo prazo

### Cuidado com as taxas!

- **Taxa de administração**: aceitável até 1% a.a. Acima disso, corroem o retorno
- **Taxa de carregamento**: cobrada sobre cada aporte. Evite — muitas gestoras já zeraram essa taxa
- **Portabilidade**: se está em plano caro, pode migrar para outro sem pagar IR

### Dica final

Previdência privada só compensa se as taxas forem baixas e o benefício fiscal for aproveitado. Caso contrário, investir direto em Tesouro IPCA+ pode render mais.`,
    quiz: [
      {
        pergunta: 'Para quem o PGBL é mais indicado?',
        opcoes: [
          'Quem faz declaração simplificada do IR',
          'Quem faz declaração completa e quer deduzir até 12% da renda bruta',
          'Quem não paga Imposto de Renda',
        ],
        correta: 1,
      },
      {
        pergunta: 'Na tabela regressiva de previdência, qual é a menor alíquota de IR possível?',
        opcoes: ['15% após 5 anos', '10% após 10 anos', '0% após 15 anos'],
        correta: 1,
      },
      {
        pergunta: 'O que é portabilidade de previdência privada?',
        opcoes: [
          'Transferir o plano para outro beneficiário',
          'Migrar de uma gestora para outra sem pagar IR',
          'Resgatar todo o valor investido',
        ],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Como negociar dívidas e sair do Serasa',
    conteudo: `## Seu nome sujo não é uma sentença permanente

Mais de 70 milhões de brasileiros estão negativados. Se você é um deles, saiba: existem caminhos reais para limpar seu nome e recomeçar.

### Passo 1: Descubra tudo que você deve

Acesse gratuitamente:
- **Serasa.com.br**: mostra dívidas negativadas e ofertas de acordo
- **Registrato (Banco Central)**: lista todas suas contas e dívidas em bancos
- **SPC Brasil**: outro birô de crédito

### Passo 2: Negocie com desconto

- **Serasa Limpa Nome**: campanhas regulares com descontos de **40% a 90%** para pagamento à vista
- **Feirões de negociação**: eventos presenciais e online do Serasa e Procons
- **Contato direto**: ligue para o credor e peça desconto. Bancos preferem receber algo a não receber nada

### Estratégias de negociação

- Sempre peça desconto para pagamento **à vista** — os maiores descontos vêm assim
- Se não pode pagar à vista, negocie **parcelas fixas sem juros**
- Nunca aceite a primeira proposta — sempre é possível melhorar
- Tenha o valor disponível antes de negociar (aumenta seu poder de barganha)

### Prazo de limpeza

- Após pagar: nome limpa em **até 5 dias úteis**
- Sem pagar: a negativação **caduca em 5 anos** (a dívida continua existindo, mas sai do Serasa)

### Reconstruindo o score

Após quitar:
1. Pague tudo em dia (contas, boletos, faturas)
2. Tenha um cartão de crédito e pague integral
3. Mantenha cadastro atualizado no Serasa e SPC
4. Em 3-6 meses, seu score já melhora significativamente`,
    quiz: [
      {
        pergunta: 'Em quanto tempo uma negativação caduca no Serasa, mesmo sem pagamento?',
        opcoes: ['2 anos', '5 anos', '10 anos'],
        correta: 1,
      },
      {
        pergunta: 'Qual é o desconto típico em campanhas do Serasa Limpa Nome para pagamento à vista?',
        opcoes: ['5% a 10%', '10% a 20%', '40% a 90%'],
        correta: 2,
      },
      {
        pergunta: 'Após quitar a dívida, em quanto tempo o nome é limpo no Serasa?',
        opcoes: ['Até 5 dias úteis', '30 dias', '6 meses'],
        correta: 0,
      },
    ],
  },
];

// ============================================================
// AVANÇADO — 10 aulas
// ============================================================

export const AULAS_AVANCADO: AulaContent[] = [
  {
    titulo: 'Fundos Imobiliários (FIIs): renda passiva todo mês',
    conteudo: `## Receba aluguel sem comprar imóvel

Fundos Imobiliários (FIIs) permitem que você invista no mercado imobiliário comprando **cotas na B3**, como se fossem ações. Mensalmente, recebem rendimentos isentos de IR.

### Como funciona

O fundo compra ou financia imóveis (shoppings, galpões logísticos, lajes corporativas, hospitais). O aluguel cobrado dos inquilinos é distribuído aos cotistas — por lei, **no mínimo 95% do lucro**.

### Tipos de FIIs

- **Tijolo**: donos de imóveis físicos (HGLG11 — galpões logísticos, XPML11 — shoppings)
- **Papel**: investem em CRIs e LCIs (KNCR11, MXRF11) — rendimento atrelado ao CDI ou IPCA
- **FOFs (Fundos de Fundos)**: investem em outros FIIs (BCFF11) — diversificação automática

### Números reais

- Dividend yield médio: **8-10% a.a.** (rendimento mensal sobre o preço da cota)
- Cota mínima: a partir de **R$10** em alguns fundos
- Rendimentos mensais: **isentos de IR** para pessoa física (para fundos com +50 cotistas e negociados em bolsa)

### Riscos principais

- **Vacância**: imóvel vazio não gera aluguel → rendimento cai
- **Inadimplência**: inquilino não paga
- **Risco de mercado**: preço da cota oscila na bolsa
- **Concentração**: fundo com poucos imóveis ou inquilinos tem risco maior

### Exemplo prático

Para receber R$1.000/mês em rendimentos de FIIs (DY médio de 9% a.a.):
Patrimônio necessário: R$1.000 × 12 / 0,09 = **R$133.333**`,
    quiz: [
      {
        pergunta: 'Os rendimentos mensais de FIIs para pessoa física são:',
        opcoes: [
          'Tributados em 20% na fonte',
          'Isentos de Imposto de Renda',
          'Tributados pela tabela regressiva',
        ],
        correta: 1,
      },
      {
        pergunta: 'O que é um FII de "tijolo"?',
        opcoes: [
          'Um fundo que investe em CRIs e LCIs',
          'Um fundo que é dono de imóveis físicos',
          'Um fundo que investe em outros fundos imobiliários',
        ],
        correta: 1,
      },
      {
        pergunta: 'Para receber R$1.000/mês de FIIs com DY de 9% a.a., quanto precisa investir aproximadamente?',
        opcoes: ['R$50.000', 'R$133.000', 'R$250.000'],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Ações: como funciona a bolsa para iniciantes',
    conteudo: `## Tornando-se sócio das maiores empresas do Brasil

Ao comprar uma ação, você se torna **sócio** de uma empresa. Se ela lucra e cresce, sua ação valoriza e você pode receber dividendos.

### Como funciona a B3

A B3 (Brasil, Bolsa, Balcão) é a bolsa de valores brasileira. Empresas como Petrobras, Vale, Itaú e Magazine Luiza têm ações negociadas lá. Você compra e vende via **corretora** (XP, Clear, Inter, Nubank).

### Tipos de ações

- **ON (Ordinárias) — final 3**: VALE3, PETR3. Dão direito a **voto** em assembleias
- **PN (Preferenciais) — final 4**: PETR4, ITUB4. Têm **preferência no recebimento de dividendos**
- **Units — final 11**: TAEE11, KLBN11. Pacote de ONs + PNs

### Indicadores fundamentalistas básicos

- **P/L (Preço/Lucro)**: quantos anos de lucro para "pagar" a ação. P/L 10 = 10 anos. Menor geralmente é mais barato
- **DY (Dividend Yield)**: dividendos anuais / preço da ação. DY 6% = R$6 de dividendo por R$100 investidos
- **ROE (Return on Equity)**: lucro / patrimônio. Mede eficiência da empresa. Acima de 15% é bom

### Riscos

- Ações **oscilam diariamente** — você pode perder 30-50% em crises
- Empresas podem dar prejuízo ou até falir
- Viés emocional: medo e ganância levam a decisões ruins

### Como começar

1. Abra conta em corretora (gratuito)
2. Comece com **pouco** (R$100-500)
3. Estude a empresa antes de comprar (não siga "dicas quentes")
4. Pense em **anos**, não dias — tempo suaviza a volatilidade`,
    quiz: [
      {
        pergunta: 'Qual a diferença entre ações ON (final 3) e PN (final 4)?',
        opcoes: [
          'ON dá direito a voto; PN tem preferência em dividendos',
          'ON é mais barata; PN é mais cara',
          'ON é para empresas privadas; PN para estatais',
        ],
        correta: 0,
      },
      {
        pergunta: 'O que significa um P/L (Preço/Lucro) de 8?',
        opcoes: [
          'A ação custa 8 reais',
          'Seriam necessários 8 anos de lucro atual para "pagar" o preço da ação',
          'A empresa tem 8 bilhões de lucro',
        ],
        correta: 1,
      },
      {
        pergunta: 'Qual é a recomendação para quem está começando a investir em ações?',
        opcoes: [
          'Investir todo o dinheiro disponível em uma única ação promissora',
          'Começar com pouco, estudar a empresa e pensar em longo prazo',
          'Seguir dicas de influenciadores e comprar na alta',
        ],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Diversificação de carteira: não coloque tudo num lugar',
    conteudo: `## O princípio mais importante do investimento

"Não coloque todos os ovos na mesma cesta" — essa frase resume a diversificação. Se uma cesta cai, as outras salvam seu patrimônio.

### O que é asset allocation

Asset allocation (alocação de ativos) é a distribuição do seu dinheiro entre **classes diferentes** de investimentos. Cada classe reage de forma diferente a eventos econômicos.

### Classes de ativos

- **Renda fixa**: Tesouro, CDB, LCI, LCA — estável, previsível
- **Renda variável nacional**: ações e FIIs na B3 — mais volátil, maior potencial
- **Internacional**: ETFs, BDRs, contas globais — protege contra risco-Brasil
- **Alternativos**: ouro, cripto, imóveis físicos — descorrelacionados

### Correlação: o segredo

Investimentos com **correlação negativa** se movem em direções opostas. Quando a bolsa cai, Tesouro Selic sobe. Quando o real desvaloriza, investimentos em dólar sobem em reais. Isso **reduz a volatilidade total** da carteira.

### Modelos de alocação por perfil

| Perfil | Renda Fixa | Ações/FIIs | Internacional |
|--------|-----------|------------|---------------|
| Conservador | 80% | 15% | 5% |
| Moderado | 60% | 30% | 10% |
| Arrojado | 40% | 40% | 20% |

### Rebalanceamento

A cada 6-12 meses, sua carteira sai da proporção ideal (se ações subiram muito, ficam com peso maior). **Rebalancear** = vender o que subiu demais e comprar o que ficou para trás. Ou simplesmente direcionar novos aportes para a classe defasada.

### Regra prática

Sua idade em % de renda fixa: 30 anos → 30% RF, 70% variável. 50 anos → 50% RF, 50% variável.`,
    quiz: [
      {
        pergunta: 'O que é correlação negativa entre investimentos?',
        opcoes: [
          'Quando dois investimentos sempre caem juntos',
          'Quando dois investimentos se movem em direções opostas',
          'Quando um investimento não rende nada',
        ],
        correta: 1,
      },
      {
        pergunta: 'O que significa rebalancear a carteira?',
        opcoes: [
          'Vender tudo e recomeçar',
          'Ajustar proporções vendendo o que subiu demais e comprando o que ficou defasado',
          'Trocar todos os investimentos de renda fixa por ações',
        ],
        correta: 1,
      },
      {
        pergunta: 'Para um perfil moderado, qual seria uma alocação típica?',
        opcoes: [
          '100% renda fixa',
          '60% renda fixa, 30% ações/FIIs, 10% internacional',
          '80% ações, 20% cripto',
        ],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'ETFs: invista no índice todo de uma vez',
    conteudo: `## O que são ETFs?

ETFs (Exchange Traded Funds) são fundos de investimento negociados na bolsa como ações. Cada cota replica um **índice inteiro**, permitindo diversificação instantânea com uma única compra.

### Principais ETFs no Brasil

- **BOVA11**: replica o Ibovespa (as ~80 maiores empresas da B3). Taxa: 0,10% a.a.
- **IVVB11**: replica o S&P 500 (as 500 maiores empresas dos EUA) em reais. Taxa: 0,23% a.a.
- **SMAL11**: replica o índice Small Caps (empresas menores com potencial de crescimento). Taxa: 0,50% a.a.
- **HASH11**: replica índice de criptomoedas (Bitcoin, Ethereum, etc.). Taxa: 0,30% a.a.
- **IMAB11**: replica índice de títulos IPCA+ do Tesouro. Taxa: 0,25% a.a.

### Vantagens dos ETFs

- **Diversificação barata**: com 1 cota de BOVA11 (~R$110), você investe nas 80 maiores empresas do Brasil
- **Taxa baixa**: 0,10-0,50% a.a. vs 1-2% de fundos tradicionais
- **Liquidez**: compra e vende na bolsa em tempo real
- **Transparência**: você sabe exatamente o que está dentro

### ETF vs stock picking

Estudos mostram que **a maioria dos gestores profissionais NÃO bate o índice** no longo prazo. Se profissionais não conseguem, amadores dificilmente conseguirão. ETFs são a solução prática.

### Tributação

- **15% de IR** sobre o ganho de capital na venda (não tem isenção de R$20.000/mês como ações)
- Não distribuem dividendos — reinvestem automaticamente (mais eficiente tributariamente)
- DARF deve ser pago até o último dia útil do mês seguinte à venda com lucro`,
    quiz: [
      {
        pergunta: 'O que o ETF IVVB11 replica?',
        opcoes: ['O Ibovespa', 'O S&P 500 (maiores empresas dos EUA)', 'O índice de criptomoedas'],
        correta: 1,
      },
      {
        pergunta: 'Qual é uma vantagem tributária dos ETFs em relação a ações?',
        opcoes: [
          'São isentos de IR',
          'Reinvestem dividendos automaticamente, sem tributação no recebimento',
          'Têm alíquota fixa de 5%',
        ],
        correta: 1,
      },
      {
        pergunta: 'Por que ETFs são recomendados para a maioria dos investidores?',
        opcoes: [
          'Porque garantem retorno acima de 20% a.a.',
          'Porque a maioria dos gestores profissionais não consegue bater o índice no longo prazo',
          'Porque não têm nenhum risco',
        ],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Dividendos: como viver de renda passiva',
    conteudo: `## Receber dinheiro enquanto dorme

Dividendos são a parte do **lucro da empresa distribuída aos acionistas**. No Brasil, empresas listadas na B3 são obrigadas a distribuir no mínimo 25% do lucro líquido.

### Empresas boas pagadoras de dividendos

- **Utilities (energia/saneamento)**: TAEE11 (Taesa), EGIE3 (Engie), CPLE6 (Copel) — receita estável, regulada
- **Bancos**: BBAS3 (Banco do Brasil), ITUB4 (Itaú), BBDC4 (Bradesco) — lucros consistentes
- **Seguradoras**: BBSE3 (BB Seguridade) — baixa necessidade de reinvestimento
- **Telecomunicações**: VIVT3 (Vivo) — fluxo de caixa previsível

### Dividend Yield: a métrica chave

DY = dividendos pagos no ano / preço da ação × 100

Exemplo: BBAS3 paga R$4,50/ação/ano e custa R$55 → DY = **8,18%**

### O cálculo da liberdade financeira

Para viver de dividendos, você precisa que a renda passiva cubra seus gastos:
- Gastos mensais: R$5.000 → R$60.000/ano
- DY médio da carteira: 8%
- Patrimônio necessário: R$60.000 / 0,08 = **R$750.000**

### Reinvestir ou gastar?

Na fase de **acumulação** (trabalhando): reinvista todos os dividendos. O efeito de reinvestimento composto é poderoso — R$100.000 investidos a DY 8% reinvestindo tudo viram R$466.000 em 20 anos (sem valorização da cota).

Na fase de **renda**: use os dividendos para viver.

### Tributação

Dividendos de ações são atualmente **isentos de IR** para pessoa física no Brasil (pode mudar em reformas tributárias futuras). Dividendos de FIIs também são isentos.`,
    quiz: [
      {
        pergunta: 'Qual é o percentual mínimo de lucro que empresas listadas na B3 devem distribuir como dividendo?',
        opcoes: ['10%', '25%', '50%'],
        correta: 1,
      },
      {
        pergunta: 'Quanto de patrimônio é necessário para gerar R$5.000/mês de dividendos com DY médio de 8%?',
        opcoes: ['R$250.000', 'R$500.000', 'R$750.000'],
        correta: 2,
      },
      {
        pergunta: 'Qual setor é tradicionalmente um bom pagador de dividendos?',
        opcoes: ['Startups de tecnologia', 'Utilities (energia e saneamento)', 'Empresas de e-commerce'],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Planejamento de aposentadoria antecipada (FIRE)',
    conteudo: `## Financial Independence, Retire Early

O movimento FIRE propõe acumular patrimônio suficiente para que os **rendimentos cubram seus gastos** — permitindo parar de trabalhar (ou trabalhar por escolha, não necessidade).

### A Regra dos 4%

Estudo da Trinity University (1998): se você retirar **4% ao ano** do patrimônio investido, há alta probabilidade de o dinheiro durar 30+ anos.

Isso significa: patrimônio necessário = **25x seus gastos anuais**.

- Gastos: R$5.000/mês = R$60.000/ano
- Patrimônio FIRE: R$60.000 × 25 = **R$1.500.000**

### Tipos de FIRE

- **Lean FIRE**: vida frugal. Gastos mínimos (~R$3.000/mês). Meta: R$900.000
- **Regular FIRE**: vida confortável. Gastos moderados (~R$7.000/mês). Meta: R$2.100.000
- **Fat FIRE**: vida com luxos. Gastos altos (~R$15.000/mês). Meta: R$4.500.000
- **Barista FIRE**: semi-aposentadoria. Patrimônio cobre metade, trabalho leve cobre o resto

### A taxa de poupança importa mais que o retorno

| Taxa de poupança | Anos até FIRE (retorno 7% a.a. real) |
|-----------------|--------------------------------------|
| 10% | 51 anos |
| 25% | 32 anos |
| 50% | 17 anos |
| 70% | 8,5 anos |

Dobrar a taxa de poupança de 25% para 50% **corta o tempo quase pela metade**.

### Adaptação ao Brasil

No Brasil, considere: inflação mais alta, instabilidade política, e sistema de saúde. Muitos adeptos do FIRE brasileiro mantêm um "colchão extra" de 10-20% acima da regra dos 4%.

### Primeiro passo

Calcule seus gastos anuais reais. Multiplique por 25. Esse é seu número. Agora calcule quanto precisa poupar por mês para chegar lá.`,
    quiz: [
      {
        pergunta: 'Segundo a regra dos 4%, quanto de patrimônio você precisa para gastos de R$5.000/mês?',
        opcoes: ['R$600.000', 'R$1.000.000', 'R$1.500.000'],
        correta: 2,
      },
      {
        pergunta: 'O que é "Barista FIRE"?',
        opcoes: [
          'Aposentadoria total com muito patrimônio',
          'Semi-aposentadoria onde o patrimônio cobre parte dos gastos e um trabalho leve cobre o resto',
          'Aposentadoria com vida extremamente frugal',
        ],
        correta: 1,
      },
      {
        pergunta: 'O que mais importa para atingir o FIRE mais rápido?',
        opcoes: [
          'Conseguir o maior retorno possível nos investimentos',
          'Aumentar a taxa de poupança (% da renda que você investe)',
          'Escolher a corretora com menor taxa',
        ],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Imposto de Renda: declaração e otimização',
    conteudo: `## Pague menos IR — legalmente

O Imposto de Renda é obrigatório, mas existem formas legais de **reduzir o quanto você paga** através de deduções e planejamento.

### Quem é obrigado a declarar (2024)?

- Rendimentos tributáveis acima de R$30.639,90 no ano
- Rendimentos isentos acima de R$200.000
- Patrimônio acima de R$800.000
- Operações em bolsa de valores
- Receita rural acima de R$153.199,50

### Deduções que reduzem seu IR

**Declaração completa** — vale se suas deduções somam mais que 20% da renda:
- **Saúde**: sem limite (consultas, planos, exames, dentista)
- **Educação**: até R$3.561,50 por pessoa/ano (escolas, faculdades)
- **Previdência privada (PGBL)**: até 12% da renda bruta
- **Dependentes**: R$2.275,08 por dependente
- **Pensão alimentícia judicial**: valor total

### DARF para renda variável

Quem vende ações com lucro acima de R$20.000/mês deve pagar DARF até o último dia útil do mês seguinte:
- **Ações (operações normais)**: 15% sobre o lucro
- **Day trade**: 20% sobre o lucro
- **FIIs**: 20% sobre ganho de capital na venda (sem isenção mensal)
- **ETFs**: 15% sobre ganho de capital (sem isenção mensal)

### Erros comuns que levam à malha fina

- Não declarar rendimentos de conta corrente ou investimentos
- Esquecer de informar bens (carro, imóvel)
- Valores inconsistentes com o informe da fonte pagadora
- Deduzir gastos não permitidos

### Prazo e multas

Prazo geralmente até o último dia útil de abril. Multa mínima de R$165,74 por atraso, podendo chegar a 20% do imposto devido.`,
    quiz: [
      {
        pergunta: 'Qual gasto tem dedução SEM limite no Imposto de Renda?',
        opcoes: ['Educação', 'Saúde', 'Previdência privada'],
        correta: 1,
      },
      {
        pergunta: 'Qual é a alíquota de IR sobre lucro em day trade com ações?',
        opcoes: ['15%', '20%', '27,5%'],
        correta: 1,
      },
      {
        pergunta: 'Até quanto da renda bruta pode ser deduzido com PGBL?',
        opcoes: ['5%', '12%', '20%'],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Câmbio e investimentos internacionais',
    conteudo: `## Diversifique além das fronteiras do Brasil

Investir no exterior protege contra o **risco-Brasil**: instabilidade política, desvalorização do real, inflação acima da meta. Em 2020, o dólar subiu 29% contra o real — quem tinha investimentos em dólar se protegeu.

### Formas de investir no exterior

**Sem sair do Brasil:**
- **BDRs**: recibos de ações estrangeiras negociados na B3 (AAPL34 = Apple, AMZO34 = Amazon, GOGL34 = Google)
- **ETFs internacionais**: IVVB11 (S&P 500), EURP11 (Europa), XINA11 (China)
- Simples, tudo em reais, compra na mesma corretora

**Com conta no exterior:**
- **Avenue, Nomad, Inter Global, C6 Global**: permitem comprar ações e ETFs diretamente nos EUA
- Acesso a milhares de ativos (não apenas os disponíveis como BDR)
- Dinheiro fica no exterior em dólar

### Spread cambial: o custo escondido

Ao converter reais para dólares, a instituição cobra um **spread** (diferença entre câmbio comercial e o que você paga). Varia de 0,5% a 3%. Compare antes de enviar dinheiro.

### Tributação

- **BDRs**: ganho de capital taxado em 15% (sem isenção de R$20.000/mês)
- **Investimentos diretos no exterior**: ganho de capital declarado em reais, alíquota de 15% para lucros até R$5 milhões
- Dividendos recebidos do exterior são tributados como rendimento tributável

### Quanto alocar?

Especialistas recomendam entre **10% a 30%** da carteira em ativos internacionais, dependendo do perfil. Comece com ETFs globais (IVVB11) por simplicidade.`,
    quiz: [
      {
        pergunta: 'O que é um BDR?',
        opcoes: [
          'Um título do governo brasileiro',
          'Um recibo de ação estrangeira negociado na B3',
          'Um fundo imobiliário internacional',
        ],
        correta: 1,
      },
      {
        pergunta: 'O que é spread cambial?',
        opcoes: [
          'A taxa de juros de investimentos no exterior',
          'A diferença entre o câmbio comercial e o preço cobrado pela instituição na conversão',
          'O imposto sobre remessas internacionais',
        ],
        correta: 1,
      },
      {
        pergunta: 'Qual porcentagem da carteira especialistas recomendam ter em investimentos internacionais?',
        opcoes: ['1% a 5%', '10% a 30%', '50% a 70%'],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Criptomoedas: o que é real e o que é especulação',
    conteudo: `## Cripto: entenda antes de investir (ou não)

Criptomoedas geram paixão e polêmica. Alguns ficaram milionários; muitos perderam tudo. Entender o básico é essencial antes de colocar qualquer real.

### O que é blockchain

Blockchain é um **livro-razão digital descentralizado**: transações são registradas em blocos encadeados, validados por milhares de computadores. Ninguém controla sozinho, ninguém falsifica.

### As duas principais

- **Bitcoin (BTC)**: criado em 2009, é o "ouro digital". Oferta limitada a 21 milhões de unidades. Reserva de valor, sem utilidade prática direta
- **Ethereum (ETH)**: plataforma para contratos inteligentes e aplicações descentralizadas (DeFi, NFTs). Mais utilidade, mais volatilidade

### Criptomoeda é investimento?

Tecnicamente, **não é investimento — é especulação**. Não gera renda (como dividendos ou juros). O valor depende exclusivamente do que outra pessoa está disposta a pagar. Volatilidade de 50-80% em poucos meses é normal.

### Se decidir investir

- **Máximo 5% da carteira** — dinheiro que você aceita perder totalmente
- Use **exchanges regulamentadas** no Brasil: Mercado Bitcoin, Binance, Foxbit
- **Custódia**: exchange (mais prático) vs wallet pessoal (mais seguro, mais complexo)
- **Não invista por FOMO** (medo de ficar de fora) — quando a mídia fala, geralmente já subiu

### Tributação no Brasil

- Vendas de cripto acima de **R$35.000/mês** geram IR sobre o lucro:
  - 15% até R$5 milhões de ganho
  - 17,5% de R$5M a R$10M
  - 22,5% acima de R$30M
- Vendas abaixo de R$35.000/mês: **isentas**
- Obrigatório declarar posse acima de R$5.000 por tipo de cripto

### Golpes comuns

Pirâmides disfarçadas de cripto (prometem rentabilidade fixa), moedas sem fundamento (shitcoins), e influenciadores pagos para promover tokens. Se parece bom demais, é golpe.`,
    quiz: [
      {
        pergunta: 'Qual é o limite mensal de vendas de criptomoedas isento de IR no Brasil?',
        opcoes: ['R$5.000', 'R$20.000', 'R$35.000'],
        correta: 2,
      },
      {
        pergunta: 'Qual porcentagem máxima da carteira especialistas recomendam para criptomoedas?',
        opcoes: ['5%', '20%', '50%'],
        correta: 0,
      },
      {
        pergunta: 'Por que criptomoeda é considerada especulação e não investimento?',
        opcoes: [
          'Porque é ilegal no Brasil',
          'Porque não gera renda (juros, dividendos) — o valor depende apenas do que outra pessoa pagará',
          'Porque só existe digitalmente',
        ],
        correta: 1,
      },
    ],
  },
  {
    titulo: 'Sucessão patrimonial: proteja o que você construiu',
    conteudo: `## Planeje em vida para evitar custos e conflitos

Ninguém gosta de pensar nisso, mas **sem planejamento sucessório**, seus herdeiros podem perder até 20% do patrimônio em impostos e custos de inventário, além de meses ou anos de burocracia.

### Inventário: judicial vs extrajudicial

**Judicial** (quando há conflito ou menores envolvidos):
- Pode levar **1-5 anos** para concluir
- Custos: honorários advocatícios (6-20% do patrimônio) + custas processuais

**Extrajudicial** (quando todos concordam e são maiores):
- Feito em **cartório**, em semanas
- Mais rápido e barato (mas ainda custa 2-5% do patrimônio em taxas e honorários)

### ITCMD: o imposto da herança

O ITCMD (Imposto sobre Transmissão Causa Mortis e Doação) é **estadual** e varia de 2% a 8% do valor dos bens. Em São Paulo, é 4%. Projetos de lei querem elevar para até 20% (alíquota progressiva).

### Ferramentas de planejamento

**Testamento:**
- Define como distribuir bens respeitando a **legítima** (50% obrigatório para herdeiros necessários)
- Custa R$500-2.000 para registrar em cartório
- Evita disputas familiares

**Holding familiar:**
- Empresa que detém os bens da família
- Transferência de cotas em vida com desconto de ITCMD
- Protege patrimônio de execuções pessoais
- Custo de constituição: R$5.000-30.000 + contabilidade mensal

**Seguro de vida:**
- Valor pago aos beneficiários **NÃO entra no inventário**
- Isento de ITCMD na maioria dos estados
- Garante liquidez imediata para pagar despesas do inventário

### Ação prática

Comece com um testamento. Se seu patrimônio supera R$1 milhão, consulte um advogado tributarista sobre holding familiar. E contrate seguro de vida se tem dependentes. O custo do planejamento é uma fração do que se perde sem ele.`,
    quiz: [
      {
        pergunta: 'Qual é a vantagem do inventário extrajudicial sobre o judicial?',
        opcoes: [
          'É gratuito',
          'É mais rápido e barato, podendo ser feito em cartório em semanas',
          'Não precisa de advogado',
        ],
        correta: 1,
      },
      {
        pergunta: 'O que é ITCMD?',
        opcoes: [
          'Imposto federal sobre investimentos',
          'Imposto estadual sobre transmissão de bens por herança ou doação',
          'Taxa do cartório para registrar testamento',
        ],
        correta: 1,
      },
      {
        pergunta: 'Por que o seguro de vida é útil no planejamento sucessório?',
        opcoes: [
          'Porque é isento de IR em todas as situações',
          'Porque o valor não entra no inventário e garante liquidez imediata para os herdeiros',
          'Porque substitui o testamento',
        ],
        correta: 1,
      },
    ],
  },
];
