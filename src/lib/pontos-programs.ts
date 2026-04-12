export interface PontosProgram {
  id: string;
  nome: string;
  loja: string;
  taxa: number; // points per R$1 spent
  valorPorPonto: number; // R$ value per point
  tipo: 'cashback' | 'milhas';
  site?: string;
}

export const pontosPrograms: PontosProgram[] = [
  // MAGAZINE LUIZA
  { id: "dots_magalu", nome: "Dotz", loja: "Magazine Luiza", taxa: 0.25, valorPorPonto: 0.0154, tipo: "cashback", site: "https://www.dotz.com.br/loja/magazine-luiza" },
  { id: "azul_magalu", nome: "Azul Fidelidade", loja: "Magazine Luiza", taxa: 14, valorPorPonto: 0.02, tipo: "milhas", site: "https://shopping.azulfidelidade.com.br/" },
  { id: "livelo_magalu", nome: "Livelo", loja: "Magazine Luiza", taxa: 2, valorPorPonto: 0.02, tipo: "milhas", site: "https://www.livelo.com.br/ganhe-pontos/magalu" },
  // AMAZON
  { id: "prime_amazon", nome: "Amazon Prime Rewards", loja: "Amazon", taxa: 1, valorPorPonto: 0.01, tipo: "cashback", site: "https://www.amazon.com.br/" },
  { id: "esfera_amazon", nome: "Esfera", loja: "Amazon", taxa: 1, valorPorPonto: 0.025, tipo: "milhas", site: "https://www.esfera.com.vc/amazon" },
  { id: "livelo_amazon", nome: "Livelo", loja: "Amazon", taxa: 1, valorPorPonto: 0.02, tipo: "milhas", site: "https://www.livelo.com.br/ganhe-pontos/amazon" },
  // SHOPEE
  { id: "coins_shopee", nome: "Shopee Coins", loja: "Shopee", taxa: 1, valorPorPonto: 0.01, tipo: "cashback", site: "https://shopee.com.br/" },
  { id: "livelo_shopee", nome: "Livelo", loja: "Shopee", taxa: 1, valorPorPonto: 0.02, tipo: "milhas", site: "https://www.livelo.com.br/ganhe-pontos/shopee" },
  { id: "esfera_shopee", nome: "Esfera", loja: "Shopee", taxa: 0.5, valorPorPonto: 0.025, tipo: "milhas", site: "https://www.esfera.com.vc/shopee" },
  // NUBANK
  { id: "esfera_nubank", nome: "Esfera", loja: "Nubank", taxa: 1.25, valorPorPonto: 0.025, tipo: "milhas", site: "https://www.esfera.com.vc/" },
  { id: "cashback_nubank", nome: "Cashback Nubank", loja: "Nubank", taxa: 0.0125, valorPorPonto: 1, tipo: "cashback" },
  { id: "ultravioleta_nubank", nome: "Nubank Ultravioleta", loja: "Nubank", taxa: 2.2, valorPorPonto: 0.025, tipo: "milhas" },
  // BRADESCO
  { id: "livelo_bradesco", nome: "Livelo", loja: "Bradesco", taxa: 1, valorPorPonto: 0.02, tipo: "milhas", site: "https://www.livelo.com.br/" },
  { id: "livelo_premium_bradesco", nome: "Livelo Premium", loja: "Bradesco", taxa: 2, valorPorPonto: 0.02, tipo: "milhas", site: "https://www.livelo.com.br/" },
  { id: "cashback_bradesco", nome: "Cashback Bradesco", loja: "Bradesco", taxa: 0.01, valorPorPonto: 1, tipo: "cashback" },
  // ITAU
  { id: "pontos_itau", nome: "Pontos Itau", loja: "Itau", taxa: 1, valorPorPonto: 0.01, tipo: "cashback" },
  { id: "esfera_itau", nome: "Esfera", loja: "Itau", taxa: 1.25, valorPorPonto: 0.025, tipo: "milhas", site: "https://www.esfera.com.vc/" },
  { id: "livelo_itau", nome: "Livelo", loja: "Itau", taxa: 1, valorPorPonto: 0.02, tipo: "milhas", site: "https://www.livelo.com.br/" },
  // SANTANDER
  { id: "esfera_santander", nome: "Esfera", loja: "Santander", taxa: 1, valorPorPonto: 0.025, tipo: "milhas", site: "https://www.esfera.com.vc/" },
  { id: "esfera_premium_santander", nome: "Esfera Premium", loja: "Santander", taxa: 1.5, valorPorPonto: 0.025, tipo: "milhas", site: "https://www.esfera.com.vc/" },
  { id: "cashback_santander", nome: "Cashback Santander", loja: "Santander", taxa: 0.01, valorPorPonto: 1, tipo: "cashback" },
  // CAIXA
  { id: "pontos_caixa", nome: "Pontos Caixa", loja: "Caixa", taxa: 1, valorPorPonto: 0.01, tipo: "cashback" },
  { id: "livelo_caixa", nome: "Livelo", loja: "Caixa", taxa: 1, valorPorPonto: 0.02, tipo: "milhas", site: "https://www.livelo.com.br/" },
  { id: "esfera_caixa", nome: "Esfera", loja: "Caixa", taxa: 1.25, valorPorPonto: 0.025, tipo: "milhas", site: "https://www.esfera.com.vc/" },
];

export interface PontosCalculation extends PontosProgram {
  pontosGanhos: number;
  valorPontos: number;
  precoFinal: number;
  economia: number;
}

export function calcularMelhorOpcao(preco: number, programas: PontosProgram[] = pontosPrograms): PontosCalculation[] {
  return programas.map(p => {
    const pontosGanhos = Math.floor(preco * p.taxa);
    const valorPontos = pontosGanhos * p.valorPorPonto;
    const precoFinal = preco - valorPontos;
    return { ...p, pontosGanhos, valorPontos, precoFinal, economia: valorPontos };
  }).sort((a, b) => a.precoFinal - b.precoFinal);
}
