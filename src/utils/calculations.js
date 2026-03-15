import { avg, sd, cvPct } from "./math";
import { fmtM, fmt } from "./formatters";

export const calcOp = (op,tol) => {
  const t=op.tempos.filter(v=>v>200); if(!t.length) return null;
  const toMed=avg(t),tnMed=toMed*(op.fr/100),tpVal=tnMed*(1+tol/100);
  const totalParada=(op.paradas||[]).reduce((s,p)=>s+p.duracao,0);
  return {toMed,tnMed,tpVal,cvPct:cvPct(t),cap:Math.floor(3600000/tpVal),n:t.length,min:Math.min(...t),max:Math.max(...t),sd:sd(t),totalParada,nParadas:(op.paradas||[]).length};
};

export const acaoM = m => ({"Setup / Troca":"Aplicar metodologia SMED para redução de tempo de setup. Criar plano de troca padronizado.","Manutenção corretiva":"Implementar plano de manutenção preventiva (TPM). Analisar histórico de falhas para antecipar intervenções.","Falta de material":"Revisar kanban e ponto de pedido. Analisar lead time de fornecedores e criar estoque pulmão.","Problema de qualidade":"Implementar controle estatístico do processo (CEP). Revisar inspeções no início de lote (first-off).","Reunião / Treinamento":"Agendar reuniões fora do horário de produção ou em janelas planejadas de parada.","Outro":"Identificar e categorizar as causas raiz. Usar diagrama de Ishikawa para estruturar a análise."}[m]||"Analisar causa raiz com equipe multifuncional.");

export const gerarSugestoes = (operacoes,tol) => {
  const s=[];
  operacoes.forEach(op=>{
    const c=calcOp(op,tol); if(!c) return;
    if(c.cvPct>20) s.push({prio:"alta",tipo:"variacao",op:op.nome,titulo:`Alta variação em "${op.nome}"`,desc:`CV de ${c.cvPct.toFixed(1)}% indica processo instável.`,acao:"Realizar análise de causa raiz (Ishikawa). Criar ou revisar MOP. Treinar operadores no método padrão."});
    else if(c.cvPct>10) s.push({prio:"media",tipo:"variacao",op:op.nome,titulo:`Variação moderada em "${op.nome}"`,desc:`CV de ${c.cvPct.toFixed(1)}% — espaço para padronização.`,acao:"Revisar padronização do método. Verificar qualidade das ferramentas e materiais."});
    if(c.nParadas>=3) { const byM=(op.paradas||[]).reduce((a,p)=>{a[p.motivo]=(a[p.motivo]||0)+1;return a;},{}); const top=Object.entries(byM).sort((a,b)=>b[1]-a[1])[0]; s.push({prio:"alta",tipo:"parada",op:op.nome,titulo:`${c.nParadas} paradas em "${op.nome}"`,desc:`Tempo total parado: ${fmtM(c.totalParada)}.`,acao:acaoM(top?top[0]:"Outro")}); }
    else if(c.nParadas>=1) { const byM=(op.paradas||[]).reduce((a,p)=>{a[p.motivo]=(a[p.motivo]||0)+1;return a;},{}); const top=Object.entries(byM).sort((a,b)=>b[1]-a[1])[0]; s.push({prio:"media",tipo:"parada",op:op.nome,titulo:`${c.nParadas} parada(s) em "${op.nome}"`,desc:`Motivo principal: ${top?top[0]:"—"} (${fmtM(c.totalParada)} parado).`,acao:acaoM(top?top[0]:"Outro")}); }
    if(c.tpVal>30000) s.push({prio:"media",tipo:"capacidade",op:op.nome,titulo:`TP elevado em "${op.nome}"`,desc:`TP de ${fmt(c.tpVal)} → ${c.cap} pçs/h.`,acao:"Analisar atividades de valor agregado vs. não-valor. Verificar ergonomia e layout."});
    if(c.n<10) s.push({prio:"baixa",tipo:"amostra",op:op.nome,titulo:`Amostra pequena em "${op.nome}"`,desc:`Apenas ${c.n} obs coletadas. Mínimo: 10.`,acao:`Coletar mais ${10-c.n} observação(ões).`});
  });
  const tp=operacoes.reduce((s,o)=>(o.paradas||[]).reduce((a,p)=>a+p.duracao,0)+s,0);
  if(tp>600000) s.push({prio:"alta",tipo:"eficiencia",op:"GERAL",titulo:"OEE reduzido por paradas",desc:`Total de ${fmtM(tp)} em paradas registradas.`,acao:"Implementar rotina de OEE. Criar indicador diário de paradas por turno."});
  return s.sort((a,b)=>({alta:0,media:1,baixa:2}[a.prio]-{alta:0,media:1,baixa:2}[b.prio]));
};

export const balancearLinha = (operacoes, tol, taktMs) => {
  if (!taktMs || taktMs <= 0) return [];
  const ops = operacoes.map((op, i) => { const c = calcOp(op, tol); return c ? { idx: i, nome: op.nome, tp: c.tpVal } : null; }).filter(Boolean).sort((a,b) => b.tp - a.tp);
  const estacoes = [];
  ops.forEach(op => {
    const est = estacoes.find(e => e.total + op.tp <= taktMs);
    if (est) { est.ops.push(op); est.total += op.tp; }
    else estacoes.push({ ops: [op], total: op.tp });
  });
  return estacoes;
};

export const calcOEE = (estudo, operacoes, tol) => {
  const tempoDispMs = (estudo.tempoDisp || 0) * 60000;
  if (!tempoDispMs) return null;
  const totalParadaMs = operacoes.reduce((a, o) => (o.paradas || []).reduce((s, p) => s + p.duracao, 0) + a, 0);
  const tempoEfetivoMs = tempoDispMs - totalParadaMs;
  const A = tempoEfetivoMs / tempoDispMs;
  const pecasProduzidas = estudo.pecasProduzidas || 0;
  const pecasRejeitadas = estudo.pecasRejeitadas || 0;
  // Desempenho usa o TP do gargalo (maior TP da linha) — operação limitante da produção
  const tpGargalo = (() => { let m = 0; operacoes.forEach(op => { const c = calcOp(op, tol); if (c && c.tpVal > m) m = c.tpVal; }); return m; })();
  const P = pecasProduzidas > 0 && tpGargalo > 0 ? Math.min(1, (pecasProduzidas * tpGargalo) / tempoEfetivoMs) : null;
  const Q = pecasProduzidas > 0 ? (pecasProduzidas - pecasRejeitadas) / pecasProduzidas : null;
  const OEE = A && P && Q ? A * P * Q : null;
  return { A, P, Q, OEE, tempoDispMs, totalParadaMs, tempoEfetivoMs };
};
