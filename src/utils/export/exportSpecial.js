import { calcOp, gerarSugestoes } from "../calculations";
import { fmt, fmtM, fmtDT, fmtD } from "../formatters";
import { logoDataUrl } from "./exportUtils";

export const exportInstrucoes = () => {
  const secoes = [
    { num:"①", titulo:"CONFIG — Configurar o Estudo", cor:"#c0392b", itens:[
      ["Nome do estudo","Identifique o estudo (ex: Linha de Embalagem A). Será usado no cabeçalho dos relatórios e no nome dos arquivos exportados."],
      ["Produto","Produto ou referência sendo analisada (ex: Motor XZ-200)."],
      ["Analista","Nome de quem está realizando o estudo. Aparece em todos os relatórios impressos."],
      ["Data","Preenchida automaticamente com a data atual. Pode ser alterada manualmente."],
      ["Tolerância %","Fator de fadiga e necessidades pessoais aplicado ao Tempo Normal para gerar o Tempo Padrão. Fórmula: TP = TN × (1 + Tol/100). Valores típicos: 10–15%."],
      ["Meta de observações","Número mínimo de cronometragens por operação para validade estatística. Fórmula de Nievel: n = (Z × CV% / e%)². Para 95% de confiança e ±5% de erro: n ≈ (1,96 × CV / 5)². Recomendado: ≥ 10."],
      ["Calculadora Takt Time","Ferramenta integrada na CONFIG: informe a Quantidade a Produzir (peças/dia) e o Tempo Disponível (s/dia). O sistema calcula automaticamente o Takt Time = Tempo Disponível ÷ Quantidade. Clique em APLICAR para salvar no estudo. Os valores digitados ficam salvos e não se apagam ao trocar de aba."],
      ["Takt Time (s)","Ritmo exigido pelo cliente. Pode ser preenchido diretamente ou via calculadora. Usado no Yamazumi, no balanceamento de linha e no dimensionamento de operadores."],
      ["Tempo Disponível (min/turno)","Tempo total do turno menos paradas programadas. Usado no cálculo do OEE. Ex: turno de 8h com 30min de intervalo = 450 min."],
      ["Peças Produzidas / Rejeitadas","Usadas para calcular o OEE (Desempenho e Qualidade) na aba RELATÓRIO."],
      ["Operações","Cadastre cada operação do processo com nome e FR% (Fator de Ritmo). FR% = 100% = operador em ritmo normal. FR% < 100% = abaixo do normal. FR% > 100% = acima. Pressione Enter ou clique em ADD para adicionar."],
    ]},
    { num:"②", titulo:"CAPTURA — Cronometrar os Tempos", cor:"#7c3aed", itens:[
      ["Lista de operações","Exibe todas as operações cadastradas com barra de progresso, contagem de obs e TP calculado em tempo real."],
      ["▶ INICIAR / ▶ CONTINUAR","Inicia a cronometragem da operação. Se já houver tempos coletados, o botão muda para CONTINUAR — os novos tempos são somados aos anteriores."],
      ["↺ Apagar captura","Botão com ícone ↺ ao lado de cada operação com dados. Ao clicar, pede confirmação e apaga todos os tempos, paradas e marcação de rodada da operação, permitindo recomeçar do zero."],
      ["⚑ R2 — Marcar Rodada 2","Botão verde na lista de operações. Clique após coletar a Rodada 1 para marcar que as próximas observações pertencem à Rodada 2. Permite comparar dois blocos de coleta (ex: antes e depois de uma melhoria, turno da manhã vs tarde)."],
      ["⚑ R2 ✕ — Remover Rodada","Botão amarelo: remove a marcação de Rodada 2, unificando todos os tempos novamente em uma única série."],
      ["Botão REG (grande azul)","Durante a captura ativa: registra o tempo decorrido desde o último clique como uma nova observação. Atalho: ESPAÇO."],
      ["⏸ PAUSAR","Interrompe a contagem e abre o formulário de parada. Selecione o motivo (Puxar Pilha, Abastecer Isomantas, Troca de Plástico, Falta de Material, Setup, Falta de Peças, Outro) e adicione observação opcional. Atalho: P."],
      ["■ FIM","Encerra a captura da operação e retorna à lista. O botão é vermelho e destacado para facilitar o uso no celular. Atalho: ESC."],
      ["Modo Sequencial","Percorre todas as operações automaticamente em ordem. Ao finalizar uma, exibe a próxima com o botão INICIAR. Ideal para cronometragem em linha de produção contínua."],
      ["Indicador R1/R2","Durante a captura ativa com rodada marcada, o indicador no topo mostra em qual rodada está: verde = Rodada 1, amarelo = Rodada 2."],
      ["Lista de tempos coletados","Exibe cada tempo registrado com seu número e valor. Quando há R2 marcada, os tempos de cada rodada aparecem com badge R1 (verde) ou R2 (amarelo) e um separador visual entre as rodadas. Clique no ✕ para excluir um tempo individual."],
      ["Paradas registradas","Exibidas abaixo dos tempos coletados com motivo, duração e observação. Clique no ✕ para excluir uma parada individual."],
    ]},
    { num:"③", titulo:"RELATÓRIO — Analisar os Resultados", cor:"#0369a1", itens:[
      ["TO (Tempo Observado)","Média aritmética dos tempos cronometrados válidos (>200ms). Tempos abaixo de 200ms são ignorados automaticamente como erros de toque."],
      ["TN (Tempo Normal)","TO × FR/100. Normaliza o tempo para um operador em ritmo padrão (100%). Exemplo: TO=10s com FR=110% → TN=11s."],
      ["TP (Tempo Padrão)","TN × (1 + Tolerância/100). É o tempo oficial usado para planejamento, capacidade e dimensionamento. Exemplo: TN=11s com Tol=15% → TP=12,65s."],
      ["CV% (Coef. de Variação)","Desvio Padrão ÷ Média × 100. Mede a estabilidade do processo. ≤10%: processo estável (verde) · 10–20%: atenção (amarelo) · >20%: processo instável, revisar método (vermelho)."],
      ["CAP/H (Capacidade/hora)","3.600 ÷ TP(s). Quantidade de peças produzidas por hora. Exemplo: TP=12s → CAP/H = 300 peças/hora."],
      ["OEE","Disponibilidade × Desempenho × Qualidade. Eficiência Global do Equipamento. Requer Tempo Disponível, Peças Produzidas e Peças Rejeitadas configurados na aba CONFIG. Meta: ≥ 85%."],
      ["Tabela consolidada","Resumo de todas as operações com TO Mín, TO Méd, TO Máx, DP, CV%, TN, TP, CAP/H e total de paradas. Clique em uma linha para ver detalhes."],
      ["Gráfico de tempos","Gráfico de barras por operação mostrando todos os tempos coletados individualmente. Pontos acima de 30% da média são exibidos em vermelho (outliers)."],
      ["Paradas — gráfico de distribuição","Gráfico de barras horizontais mostrando o tempo total parado por motivo. Exibido quando há ao menos uma parada registrada."],
      ["Exportar PDF","Gera relatório completo em folha A4 landscape com cabeçalho, tabela consolidada, paradas e sugestões. Abre em nova aba para imprimir ou salvar como PDF."],
      ["Exportar Excel","Gera planilha .xlsx com abas: Consolidado, Tempos Coletados, Paradas e Sugestões."],
    ]},
    { num:"④", titulo:"SUGESTÕES — Melhorias Automáticas", cor:"#d97706", itens:[
      ["Alta prioridade (vermelho)","CV% > 20% (processo instável) ou ≥ 3 paradas registradas na operação. Requer ação imediata."],
      ["Média prioridade (amarelo)","CV% entre 10–20%, 1–2 paradas registradas, TP elevado (>30s), ou total de paradas no estudo > 10 minutos."],
      ["Baixa prioridade (verde)","Amostra insuficiente: menos de 10 observações coletadas. Necessário coletar mais dados."],
      ["Ações sugeridas","Para cada alerta o sistema indica a ação recomendada: SMED (redução de setup), TPM (manutenção produtiva), CEP (controle estatístico), Kanban (abastecimento), treinamento de operadores, análise de Ishikawa, etc."],
      ["OEE geral","Se o total de paradas reduzir significativamente o tempo disponível, o sistema gera alerta de eficiência global com sugestão de implementar rotina diária de OEE."],
    ]},
    { num:"⑤", titulo:"PADRÕES — Análise Estatística Avançada", cor:"#16a34a", itens:[
      ["Carta de Controle (±3σ)","Gráfico com cada observação plotada em sequência. Linhas de referência: UCL (Limite Superior = Média + 3σ) em vermelho, Média em cinza, LCL (Limite Inferior = Média − 3σ) em azul. Pontos fora dos limites aparecem em vermelho."],
      ["Sobreposição R1/R2","Quando há Rodada 2 marcada, o gráfico exibe as duas rodadas sobrepostas: R1 em verde e R2 em amarelo, com linha tracejada de média para cada uma. Permite ver visualmente se houve melhora ou piora entre as coletas."],
      ["Comparativo de Rodadas","Bloco acima dos gráficos (quando há R2): exibe lado a lado o TO Méd, TP e CV% de cada rodada, o delta percentual (▼ GANHO ou ▲ PERDA), a diferença de TP e o ganho/perda em capacidade (pçs/h)."],
      ["Tendência (Regressão Linear)","Detecta se os tempos estão crescendo (↑ fadiga), decrescendo (↓ aprendizado) ou estáveis (→). O R² indica o quanto a tendência explica a variação — valores > 0,5 indicam tendência significativa."],
      ["Inclinação","Variação percentual de tempo por observação. < 2%: estável · 2–5%: atenção · > 5%: tendência forte."],
      ["Fora de Controle","Contagem de pontos além de ±3σ. Processo sob controle: 0 pontos fora. ≥ 1 ponto: investigar causa especial."],
      ["Δ 1ª→2ª Metade","Compara a média da primeira metade com a segunda metade das observações. Valor positivo = fadiga. Valor negativo = aprendizado/aquecimento."],
      ["Resumo Geral","Cards com totais: quantas operações estão estáveis, crescentes, decrescentes e fora de controle."],
      ["Exportar PDF / Excel","Gera relatório A4 landscape com tabela completa de análise estatística e Excel com aba Padrões e aba Tempos Coletados."],
    ]},
    { num:"⑥", titulo:"YAMAZUMI — Balanceamento de Linha", cor:"#0891b2", itens:[
      ["Gráfico de barras","Exibe o Tempo Padrão de cada operação em barras horizontais ordenadas por OP. O comprimento da barra é proporcional ao TP."],
      ["Linha Takt Time","Linha vertical amarela no gráfico indicando o ritmo exigido. Barras que ultrapassam a linha = gargalos (exibidas em vermelho)."],
      ["Capacidade — Esperado vs Real","Compara a capacidade esperada (definida pelo Takt Time) com a real (limitada pelo gargalo). Mostra atingimento % e déficit ou superávit em pçs/h."],
      ["Balanceamento automático","Agrupa as operações em estações de trabalho respeitando o Takt Time (algoritmo First Fit Decreasing). Exibe ocupação % de cada estação e quais operações compõem cada estação."],
      ["Eficiência da linha","(Soma de todos os TPs) ÷ (N° estações × Takt Time) × 100. Meta: > 85%. Valor baixo indica oportunidade de redistribuir operações."],
      ["Exportar PDF / Excel","Gera relatório A4 landscape com gráfico Yamazumi em HTML, tabela de TPs e tabela de balanceamento. Excel com aba Yamazumi e aba Balanceamento (quando Takt Time definido)."],
    ]},
    { num:"⑦", titulo:"OPERADORES — Dimensionamento", cor:"#7c3aed", itens:[
      ["Fórmula","N° operadores = Σ TP ÷ Takt Time. Soma todos os Tempos Padrão das operações e divide pelo Takt Time. O resultado é arredondado para cima (não há meio operador)."],
      ["Eficiência com esse número","(Resultado exato ÷ Arredondado) × 100. Indica o quanto os operadores estarão ocupados. Ex: precisa de 3,2 → arredonda para 4 → eficiência = 80%."],
      ["Contribuição por operação","Mostra quanto tempo de operador cada operação consome em relação ao Takt Time. Barra proporcional."],
      ["Comparador","Informe quantos operadores você tem hoje. O sistema calcula se há excesso ou falta, e a eficiência real com esse número."],
      ["Exportar PDF","Relatório A4 portrait com fórmula, cards de resultado, tabela por operação e análise de excesso/falta."],
    ]},
    { num:"⊕", titulo:"Dicas Gerais e Backup", cor:"#64748b", itens:[
      ["FR% (Fator de Ritmo)","Avalie o ritmo do operador no momento da coleta. 85% = muito lento · 95% = levemente abaixo · 100% = normal · 110% = acima do normal. Seja honesto: o FR errado distorce todo o estudo."],
      ["Número mínimo de obs.","Use a fórmula de Nievel: n = (Z × CV% / e%)². Para 95% de confiança e ±5% de erro: n ≈ (1,96 × CV / 5)². Com CV% = 15%: n ≈ 35 obs. Com CV% = 5%: n ≈ 4 obs."],
      ["Backup JSON","Na tela inicial, use ↓ EXPORTAR JSON para salvar todos os estudos em arquivo. Use ↑ IMPORTAR JSON para restaurar. Faça backup antes de trocar de computador ou navegador."],
      ["Auto-save no pendrive","O app detecta automaticamente se foi vinculado a um pendrive (botão VINCULAR PENDRIVE). Quando vinculado, salva automaticamente após cada alteração no arquivo ritmoprod-dados.json do pendrive."],
      ["Folha de coleta","Na aba RELATÓRIO, botão 📋 FOLHA: imprime folha A4 landscape em branco para registrar tempos manualmente no chão de fábrica. Inclui grade de células e seção de paradas."],
      ["Modo escuro/claro","Botão ☀/🌙 no cabeçalho. A preferência é salva por sessão."],
      ["Comparar estudos","Na tela inicial, botão ⇄ COMPARAR: selecione 2 estudos para ver uma tabela comparativa lado a lado com TO, TP, CV% e CAP/H de cada operação."],
      ["Dados salvos localmente","O RitmoProd salva os dados no localStorage do navegador da máquina onde é aberto. Os dados não ficam no pendrive automaticamente — use o backup JSON ou vincule o pendrive para persistência."],
    ]},
  ];

  const secoesHtml = secoes.map(sec => `
    <div style="border-left:4px solid ${sec.cor};background:#fafafa;border-radius:0 6px 6px 0;padding:14px 18px;margin-bottom:14px;page-break-inside:avoid">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <span style="background:${sec.cor};color:#fff;font-weight:900;font-size:13px;padding:2px 10px;border-radius:3px">${sec.num}</span>
        <span style="font-size:14px;font-weight:800;color:#1a1a2e">${sec.titulo}</span>
      </div>
      ${sec.itens.map(([label,desc])=>`
        <div style="display:flex;gap:12px;align-items:flex-start;font-size:11px;margin-bottom:7px">
          <span style="color:${sec.cor};font-weight:700;white-space:nowrap;min-width:170px;flex-shrink:0">${label}</span>
          <span style="color:#555;line-height:1.6">${desc}</span>
        </div>`).join("")}
    </div>`).join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>RitmoProd — Manual de Uso</title>
<style>
  @page { size: A4 portrait; margin: 14mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; color: #1a1a2e; font-size: 11px; background: #fff; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } }
</style>
</head>
<body>

<div class="no-print" style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#1a1a2e;padding:8px 16px;display:flex;gap:10px;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,.4)">
  <span style="color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;margin-right:8px">⧗ RitmoProd</span>
  <button onclick="window.print()" style="background:#c0392b;color:#fff;border:none;padding:7px 18px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer">🖨 Imprimir</button>
  <button onclick="window.print()" style="background:#1a7a4a;color:#fff;border:none;padding:7px 18px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer">💾 Salvar PDF</button>
  <span style="color:#aaa;font-size:10px;margin-left:4px">← no diálogo, escolha "Salvar como PDF"</span>
  <button onclick="window.close()" style="margin-left:auto;background:#334;color:#aaa;border:1px solid #445;padding:6px 14px;border-radius:4px;font-size:11px;cursor:pointer">✕ Fechar</button>
</div>
<div class="no-print" style="height:48px"></div>

<!-- CABEÇALHO -->
<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #c0392b">
  <img src="${logoDataUrl}" alt="RitmoProd" style="height:56px;border-radius:6px"/>
  <div>
    <div style="font-size:20px;font-weight:900;color:#1a1a2e">Manual de Uso — RitmoProd</div>
    <div style="font-size:10px;color:#888;margin-top:3px;letter-spacing:1px">ESTUDO DE TEMPOS E MOVIMENTOS · ENGENHARIA INDUSTRIAL</div>
  </div>
</div>

${secoesHtml}

<!-- FÓRMULAS -->
<div style="margin-top:16px;background:#f0f4ff;border:1px solid #c7d2fe;border-radius:6px;padding:14px 18px;page-break-inside:avoid">
  <div style="font-size:10px;font-weight:800;letter-spacing:2px;color:#3730a3;margin-bottom:10px">FÓRMULAS PRINCIPAIS</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
    ${[
      ["TN (Tempo Normal)","TO × FR / 100"],
      ["TP (Tempo Padrão)","TN × (1 + Tolerância / 100)"],
      ["Capacidade/hora","3.600 ÷ TP(s)"],
      ["CV% (Coef. Variação)","(Desvio Padrão / Média) × 100"],
      ["OEE","Disponibilidade × Desempenho × Qualidade"],
      ["N° mín. obs. (Nievel)","(1,96 × CV% / 5)²  para 95% confiança, ±5% erro"],
    ].map(([l,f])=>`<div style="background:#fff;border-radius:4px;padding:7px 10px;border:1px solid #e0e7ff"><span style="color:#64748b;display:block;font-size:9px;margin-bottom:2px">${l}</span><strong style="color:#3730a3;font-family:'Courier New',monospace">${f}</strong></div>`).join("")}
  </div>
</div>

<!-- RODAPÉ -->
<div style="margin-top:20px;padding-top:8px;border-top:1px solid #e0e3eb;display:flex;justify-content:space-between;font-size:8px;color:#aaa">
  <span>Desenvolvido por <strong>Oderli Sergio Garcia</strong> &amp; Claude (Anthropic)</span>
  <span>RitmoProd IE · Manual de Uso · ${new Date().toLocaleDateString("pt-BR")}</span>
</div>

</body>
</html>`;

  const w = window.open("","_blank"); w.document.write(html); w.document.close();
};

export const exportResumoExecutivo = (estudo, operacoes, tol) => {
  const sugs = gerarSugestoes(operacoes, tol);
  const sugsAlta = sugs.filter(s => s.prio === "alta").slice(0, 3);
  const totalObs = operacoes.reduce((a, o) => a + o.tempos.filter(v => v > 200).length, 0);
  const totalParadas = operacoes.reduce((a, o) => a + (o.paradas || []).length, 0);
  const completas = operacoes.filter(o => o.tempos.filter(v => v > 200).length >= (estudo.metasObs || 10)).length;
  const opsCalc = operacoes.map((op, i) => { const c = calcOp(op, tol); return c ? { i, nome: op.nome, tp: c.tpVal, cap: c.cap, cv: c.cvPct, n: c.n } : null; }).filter(Boolean);
  const gargalo = opsCalc.length > 0 ? opsCalc.reduce((g, o) => o.tp > g.tp ? o : g, opsCalc[0]) : null;
  const menorTP = opsCalc.length > 0 ? opsCalc.reduce((m, o) => o.tp < m.tp ? o : m, opsCalc[0]) : null;

  const kpis = [
    { l: "N° OPERAÇÕES",   v: operacoes.length,            c: "#1d4ed8" },
    { l: "N° OBSERVAÇÕES", v: totalObs,                    c: "#1d4ed8" },
    { l: "COMPLETAS",      v: `${completas}/${operacoes.length}`, c: completas === operacoes.length ? "#16a34a" : "#d97706" },
    { l: "TOTAL PARADAS",  v: totalParadas,                c: totalParadas > 0 ? "#d97706" : "#16a34a" },
    { l: "MAIOR TP (GARGALO)", v: gargalo ? `${(gargalo.tp/1000).toFixed(2)}s` : "—", c: "#c0392b" },
    { l: "MENOR TP",       v: menorTP ? `${(menorTP.tp/1000).toFixed(2)}s` : "—", c: "#16a34a" },
  ];

  const tabelaRows = opsCalc.map((op, idx) => {
    const cvOk = op.cv <= 10, cvWarn = op.cv <= 20;
    const cvCor = cvOk ? "#16a34a" : cvWarn ? "#d97706" : "#c0392b";
    const ok = op.n >= (estudo.metasObs || 10);
    return `<tr style="background:${idx%2===0?"#fff":"#f7f8fa"}">
      <td style="text-align:center;font-weight:700;color:#c0392b">OP${op.i+1}</td>
      <td style="text-align:left;font-weight:600">${op.nome}</td>
      <td style="text-align:center;color:${ok?"#16a34a":"#d97706"};font-weight:700">${op.n}</td>
      <td style="text-align:center;font-weight:700;color:${cvCor}">${op.cv.toFixed(1)}%</td>
      <td style="text-align:center;font-weight:800;color:#c0392b">${(op.tp/1000).toFixed(2)}s</td>
      <td style="text-align:center;font-weight:700">${op.cap} pçs/h</td>
      <td style="text-align:center"><span style="background:${ok?"#dcfce7":"#fef9c3"};color:${ok?"#16a34a":"#d97706"};border-radius:3px;padding:2px 6px;font-size:8px;font-weight:900">${ok?"✓ OK":"⚠"}</span></td>
    </tr>`;
  }).join("");

  const sugRows = sugsAlta.map(s => `
    <div style="border-left:3px solid #c0392b;padding:8px 12px;margin-bottom:8px;background:#fafafa;border-radius:0 4px 4px 0">
      <div style="font-weight:700;font-size:10px;margin-bottom:3px">${s.titulo}</div>
      <div style="font-size:9px;color:#555;margin-bottom:4px">${s.desc}</div>
      <div style="font-size:9px;color:#1a7a4a;background:#f0fdf4;padding:3px 7px;border-radius:3px"><b>Ação:</b> ${s.acao}</div>
    </div>`).join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Resumo Executivo — ${estudo.nome || "Estudo"}</title>
<style>
  @page { size: A4 portrait; margin: 12mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; color: #1a1a2e; font-size: 11px; background: #fff; }
  h2 { font-size: 9px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #555; border-bottom: 2px solid #c0392b; padding-bottom: 5px; margin: 16px 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead tr { background: #1a1a2e; color: #fff; }
  th { padding: 7px 8px; font-size: 8px; font-weight: 700; letter-spacing: 1px; text-align: center; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } }
</style>
</head>
<body>
<div class="no-print" style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#1a1a2e;padding:8px 16px;display:flex;gap:10px;align-items:center">
  <span style="color:#fff;font-size:11px;font-weight:700;margin-right:8px">⧗ RitmoProd</span>
  <button onclick="window.print()" style="background:#c0392b;color:#fff;border:none;padding:7px 18px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer">🖨 Imprimir / Salvar PDF</button>
  <button onclick="window.close()" style="margin-left:auto;background:#334;color:#aaa;border:1px solid #445;padding:6px 14px;border-radius:4px;font-size:11px;cursor:pointer">✕ Fechar</button>
</div>
<div class="no-print" style="height:48px"></div>

<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #c0392b">
  <img src="${logoDataUrl}" alt="RitmoProd" style="height:50px;border-radius:6px"/>
  <div style="flex:1">
    <div style="font-size:17px;font-weight:900">Resumo Executivo</div>
    <div style="font-size:12px;color:#555;margin-top:2px">${estudo.nome || "—"}</div>
    <div style="font-size:9px;color:#888;margin-top:2px">ESTUDO DE TEMPOS E MOVIMENTOS · ENGENHARIA INDUSTRIAL</div>
  </div>
  <div style="font-size:10px;color:#555;text-align:right;line-height:1.8">
    <div><strong>Analista:</strong> ${estudo.analista || "—"}</div>
    <div><strong>Data:</strong> ${estudo.data}</div>
    <div><strong>Tolerância:</strong> ${tol}%</div>
  </div>
</div>

<h2>KPIs DO ESTUDO</h2>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">
  ${kpis.map(k => `<div style="background:#f7f8fa;border:1px solid #e0e3eb;border-left:3px solid ${k.c};border-radius:0 6px 6px 0;padding:10px 14px">
    <div style="font-size:7px;color:#888;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px">${k.l}</div>
    <div style="font-size:20px;font-weight:900;color:${k.c}">${k.v}</div>
  </div>`).join("")}
</div>

<h2>TABELA RESUMIDA</h2>
<table>
  <thead><tr>
    <th>OP</th><th style="text-align:left">OPERAÇÃO</th><th>N</th><th>CV%</th><th>TP</th><th>CAP/H</th><th>STATUS</th>
  </tr></thead>
  <tbody>${tabelaRows}</tbody>
</table>
<div style="margin-top:4px;font-size:8px;color:#888">TP = Tempo Padrão · CV% ≤10% bom · 10–20% atenção · >20% instável</div>

${sugsAlta.length > 0 ? `<h2>SUGESTÕES DE ALTA PRIORIDADE (TOP ${sugsAlta.length})</h2>${sugRows}` : ""}

<div style="margin-top:16px;padding-top:8px;border-top:1px solid #e0e3eb;display:flex;justify-content:space-between;font-size:8px;color:#aaa">
  <span>Desenvolvido por <strong>Oderli Sergio Garcia</strong> &amp; Claude (Anthropic)</span>
  <span>RitmoProd IE · Resumo Executivo · Gerado em ${new Date().toLocaleString("pt-BR")}</span>
</div>
</body></html>`;
  const w = window.open("", "_blank"); w.document.write(html); w.document.close();
};

export const exportAntesDepoisPDF = (estudoAtual, estudoRef, operacoesAtual, operacoesRef, tolAtual, tolRef) => {
  const allNomes = [...new Set([...operacoesAtual.map(o => o.nome), ...operacoesRef.map(o => o.nome)])];
  const rows = allNomes.map((nome, idx) => {
    const opA = operacoesRef.find(o => o.nome === nome);
    const opD = operacoesAtual.find(o => o.nome === nome);
    const cA = opA ? calcOp(opA, tolRef) : null;
    const cD = opD ? calcOp(opD, tolAtual) : null;
    const delta = cA && cD ? ((cD.tpVal - cA.tpVal) / cA.tpVal * 100) : null;
    const melhorou = delta !== null && delta < 0;
    const piorou = delta !== null && delta > 0;
    return `<tr style="background:${idx%2===0?"#fff":"#f7f8fa"}">
      <td style="text-align:center;font-weight:700;color:#c0392b">${idx+1}</td>
      <td style="text-align:left;font-weight:600">${nome}</td>
      <td style="text-align:center;font-family:monospace">${cA ? `${(cA.tpVal/1000).toFixed(2)}s` : "—"}</td>
      <td style="text-align:center;font-family:monospace">${cD ? `${(cD.tpVal/1000).toFixed(2)}s` : "—"}</td>
      <td style="text-align:center;font-weight:900;color:${delta===null?"#888":melhorou?"#16a34a":"#c0392b"}">${delta===null?"—":`${delta>0?"+":""}${delta.toFixed(1)}%`}</td>
      <td style="text-align:center">${cA ? `${cA.cap} pçs/h` : "—"}</td>
      <td style="text-align:center">${cD ? `${cD.cap} pçs/h` : "—"}</td>
      <td style="text-align:center;font-size:14px">${delta===null?"—":melhorou?"↑":"↓"}</td>
    </tr>`;
  }).join("");

  const somaA = allNomes.reduce((s, nome) => { const op = operacoesRef.find(o => o.nome === nome); const c = op ? calcOp(op, tolRef) : null; return s + (c ? c.tpVal : 0); }, 0);
  const somaD = allNomes.reduce((s, nome) => { const op = operacoesAtual.find(o => o.nome === nome); const c = op ? calcOp(op, tolAtual) : null; return s + (c ? c.tpVal : 0); }, 0);
  const deltaGeral = somaA > 0 ? ((somaD - somaA) / somaA * 100) : null;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Comparativo Antes/Depois — ${estudoAtual.nome || "Estudo"}</title>
<style>
  @page { size: A4 portrait; margin: 12mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; color: #1a1a2e; font-size: 11px; background: #fff; }
  h2 { font-size: 9px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #555; border-bottom: 2px solid #c0392b; padding-bottom: 5px; margin: 16px 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead tr { background: #1a1a2e; color: #fff; }
  th { padding: 7px 8px; font-size: 8px; font-weight: 700; letter-spacing: 1px; text-align: center; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } }
</style>
</head>
<body>
<div class="no-print" style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#1a1a2e;padding:8px 16px;display:flex;gap:10px;align-items:center">
  <span style="color:#fff;font-size:11px;font-weight:700;margin-right:8px">⧗ RitmoProd</span>
  <button onclick="window.print()" style="background:#c0392b;color:#fff;border:none;padding:7px 18px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer">🖨 Imprimir / Salvar PDF</button>
  <button onclick="window.close()" style="margin-left:auto;background:#334;color:#aaa;border:1px solid #445;padding:6px 14px;border-radius:4px;font-size:11px;cursor:pointer">✕ Fechar</button>
</div>
<div class="no-print" style="height:48px"></div>

<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #c0392b">
  <img src="${logoDataUrl}" alt="RitmoProd" style="height:50px;border-radius:6px"/>
  <div style="flex:1">
    <div style="font-size:17px;font-weight:900">Comparativo Antes / Depois</div>
    <div style="font-size:11px;color:#555;margin-top:2px">${estudoAtual.nome || "—"}</div>
    ${estudoAtual.produto ? `<div style="font-size:10px;color:#888;margin-top:1px">Produto: ${estudoAtual.produto}</div>` : ""}
  </div>
  <div style="font-size:9px;color:#555;text-align:right;line-height:1.8">
    <div><strong>Analista:</strong> ${estudoAtual.analista || "—"}</div>
    <div><strong>Data:</strong> ${estudoAtual.data}</div>
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #16a34a;border-radius:0 6px 6px 0;padding:10px 14px">
    <div style="font-size:8px;color:#888;letter-spacing:1px;margin-bottom:3px">ANTES (Referência)</div>
    <div style="font-size:13px;font-weight:900;color:#16a34a">${estudoRef.nome || "—"}</div>
    <div style="font-size:9px;color:#555">Produto: ${estudoRef.produto || "Não informado"}</div>
    <div style="font-size:9px;color:#555">Data: ${estudoRef.data || "—"}</div>
  </div>
  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-left:4px solid #2563eb;border-radius:0 6px 6px 0;padding:10px 14px">
    <div style="font-size:8px;color:#888;letter-spacing:1px;margin-bottom:3px">DEPOIS (Atual)</div>
    <div style="font-size:13px;font-weight:900;color:#2563eb">${estudoAtual.nome || "—"}</div>
    <div style="font-size:9px;color:#555">Produto: ${estudoAtual.produto || "Não informado"}</div>
    <div style="font-size:9px;color:#555">Data: ${estudoAtual.data || "—"}</div>
  </div>
</div>

<h2>COMPARATIVO POR OPERAÇÃO</h2>
<table>
  <thead><tr>
    <th>#</th><th style="text-align:left">OPERAÇÃO</th>
    <th>TP ANTES</th><th>TP DEPOIS</th><th>Δ%</th>
    <th>CAP/H ANTES</th><th>CAP/H DEPOIS</th><th>STATUS</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>

<h2>KPIs DE RESUMO</h2>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">
  ${[
    { l: "Σ TP ANTES",  v: somaA > 0 ? `${(somaA/1000).toFixed(2)}s` : "—", c: "#16a34a" },
    { l: "Σ TP DEPOIS", v: somaD > 0 ? `${(somaD/1000).toFixed(2)}s` : "—", c: "#2563eb" },
    { l: "GANHO GERAL", v: deltaGeral !== null ? `${deltaGeral > 0 ? "+" : ""}${deltaGeral.toFixed(1)}%` : "—", c: deltaGeral !== null && deltaGeral < 0 ? "#16a34a" : "#c0392b" },
  ].map(k => `<div style="background:#f7f8fa;border:1px solid #e0e3eb;border-left:3px solid ${k.c};border-radius:0 6px 6px 0;padding:10px 14px">
    <div style="font-size:7px;color:#888;letter-spacing:1px;margin-bottom:4px">${k.l}</div>
    <div style="font-size:20px;font-weight:900;color:${k.c}">${k.v}</div>
  </div>`).join("")}
</div>

<div style="margin-top:16px;padding-top:8px;border-top:1px solid #e0e3eb;display:flex;justify-content:space-between;font-size:8px;color:#aaa">
  <span>Desenvolvido por <strong>Oderli Sergio Garcia</strong> &amp; Claude (Anthropic)</span>
  <span>RitmoProd IE · Antes/Depois · Gerado em ${new Date().toLocaleString("pt-BR")}</span>
</div>
</body></html>`;
  const w = window.open("", "_blank"); w.document.write(html); w.document.close();
};
