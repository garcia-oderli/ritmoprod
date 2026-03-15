import { calcOp } from "../calculations";
import { fmt, fmtD } from "../formatters";
import { logoDataUrl } from "./exportUtils";

export const exportDimensionamento = (estudo, operacoes, tol, opsAtuais) => {
  const taktMs = (estudo.taktTime || 0) * 1000;
  if (!taktMs) return alert("Defina o Takt Time na aba CONFIG antes de imprimir.");
  const opsComTP = operacoes.map((op, i) => { const c = calcOp(op, tol); return c ? { i, nome: op.nome, tp: c.tpVal, fr: op.fr, toMed: c.toMed, tnMed: c.tnMed } : null; }).filter(Boolean);
  if (!opsComTP.length) return alert("Nenhuma operação com dados suficientes para o relatório.");

  const somaTP = opsComTP.reduce((s, o) => s + o.tp, 0);
  const opsIdealExato = somaTP / taktMs;
  const opsIdeal = Math.ceil(opsIdealExato);
  const efIdeal = (opsIdealExato / opsIdeal) * 100;
  const opsAtual = parseInt(opsAtuais) || 0;
  const diff = opsAtual > 0 ? opsAtual - opsIdeal : null;
  const status = diff == null ? null : diff === 0 ? "ok" : diff > 0 ? "excesso" : "falta";
  const statusCor = status === "ok" ? "#16a34a" : status === "excesso" ? "#d97706" : "#dc2626";
  const statusTexto = status === "ok" ? "✓ Dimensionamento correto"
    : status === "excesso" ? `▲ Excesso de ${diff} operador${diff > 1 ? "es" : ""}`
    : status === "falta"  ? `▼ Faltam ${Math.abs(diff)} operador${Math.abs(diff) > 1 ? "es" : ""}`
    : "—";
  const efAtual = opsAtual > 0 ? (opsIdealExato / opsAtual) * 100 : null;

  const linhasOps = opsComTP.map((op, idx) => {
    const contrib = op.tp / taktMs;
    const pctBarra = Math.min(100, (op.tp / somaTP) * 100);
    const acima = op.tp > taktMs;
    return `<tr style="background:${idx % 2 === 0 ? "#fff" : "#f7f8fa"}">
      <td style="text-align:center;font-weight:700;color:#c0392b">OP${op.i + 1}</td>
      <td>${op.nome}</td>
      <td style="text-align:center">${op.fr}%</td>
      <td style="text-align:center;font-family:monospace">${fmt(op.toMed)}</td>
      <td style="text-align:center;font-family:monospace">${fmt(op.tnMed)}</td>
      <td style="text-align:center;font-family:monospace;font-weight:800;color:${acima ? "#dc2626" : "#1a1a2e"}">${fmt(op.tp)}</td>
      <td style="text-align:center">
        <div style="background:#e5e7eb;border-radius:3px;height:8px;width:100%;position:relative">
          <div style="background:${acima ? "#dc2626" : "#2563eb"};width:${pctBarra}%;height:100%;border-radius:3px"></div>
        </div>
      </td>
      <td style="text-align:center;font-weight:700;color:${acima ? "#dc2626" : "#555"}">${contrib.toFixed(3)}</td>
    </tr>`;
  }).join("");

  const cardStyle = (cor) => `border:1px solid #e5e7eb;border-left:4px solid ${cor};border-radius:0 6px 6px 0;padding:12px 16px;background:#fff`;
  const diagBox = opsAtual > 0 ? `
    <div style="margin-top:16px;border:2px solid ${statusCor};border-radius:8px;padding:16px 20px;background:${statusCor}0d">
      <div style="font-size:16px;font-weight:900;color:${statusCor};margin-bottom:6px">${statusTexto}</div>
      <div style="font-size:11px;color:#555;line-height:1.7">
        Operadores hoje: <strong>${opsAtual}</strong> &nbsp;|&nbsp; Necessários: <strong>${opsIdeal}</strong> &nbsp;|&nbsp; Eficiência atual: <strong style="color:${statusCor}">${efAtual?.toFixed(1)}%</strong><br>
        ${status === "falta"  ? `A linha está sobrecarregada. Com ${opsAtual} operadores não é possível atender a demanda dentro do takt time. Recrute ou realoque ${Math.abs(diff)} operador${Math.abs(diff) > 1 ? "es" : ""}.`
          : status === "excesso" ? `Há operadores ociosos. Com ${opsAtual} operadores a eficiência cai para ${efAtual?.toFixed(1)}%. Considere realocar ${diff} operador${diff > 1 ? "es" : ""} para outras atividades ou reduzir o takt time.`
          : `Linha dimensionada corretamente. Eficiência de ${efIdeal.toFixed(1)}% com ${opsIdeal} operador${opsIdeal > 1 ? "es" : ""}.`}
      </div>
    </div>` : "";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Dimensionamento de Operadores — ${estudo.nome || "Estudo"}</title>
<style>
  @page { size: A4 portrait; margin: 12mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; color: #1a1a2e; font-size: 11px; background: #fff; }
  h2 { font-size: 9px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #555; border-bottom: 2px solid #c0392b; padding-bottom: 5px; margin: 18px 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead tr { background: #1a1a2e; color: #fff; }
  th { padding: 7px 8px; font-size: 8px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; text-align: center; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: middle; }
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

<!-- CABEÇALHO -->
<div style="display:flex;align-items:center;gap:16px;margin-bottom:18px;padding-bottom:12px;border-bottom:2px solid #c0392b">
  <img src="${logoDataUrl}" alt="RitmoProd" style="height:52px;border-radius:6px"/>
  <div style="flex:1">
    <div style="font-size:18px;font-weight:900">Dimensionamento de Operadores</div>
    <div style="font-size:10px;color:#888;margin-top:2px;letter-spacing:1px">ENGENHARIA INDUSTRIAL · BALANCEAMENTO DE MÃO DE OBRA</div>
  </div>
  <div style="text-align:right;font-size:10px;color:#555;line-height:1.8">
    <div><strong>Estudo:</strong> ${estudo.nome || "—"}</div>
    <div><strong>Produto:</strong> ${estudo.produto || "—"}</div>
    <div><strong>Analista:</strong> ${estudo.analista || "—"}</div>
    <div><strong>Data:</strong> ${estudo.data || new Date().toLocaleDateString("pt-BR")}</div>
  </div>
</div>

<!-- FÓRMULA E RESULTADO -->
<h2>Cálculo do Número de Operadores</h2>
<div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:6px;padding:12px 16px;margin-bottom:14px;font-size:11px;line-height:2">
  <strong>Fórmula:</strong> N° operadores = Σ Tempo Padrão ÷ Takt Time<br>
  <span style="font-family:monospace">${(somaTP / 1000).toFixed(3)} s &nbsp;÷&nbsp; ${(taktMs / 1000).toFixed(3)} s &nbsp;= &nbsp;<strong>${opsIdealExato.toFixed(3)}</strong> &nbsp;→ arredonda para cima = </span>
  <strong style="font-size:18px;color:#1a1a2e">${opsIdeal} operador${opsIdeal > 1 ? "es" : ""}</strong>
</div>

<!-- CARDS -->
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px">
  <div style="${cardStyle("#16a34a")}">
    <div style="font-size:8px;color:#888;letter-spacing:1px;margin-bottom:4px">OPERADORES NECESSÁRIOS</div>
    <div style="font-size:28px;font-weight:900;color:#16a34a;line-height:1">${opsIdeal}</div>
    <div style="font-size:9px;color:#888;margin-top:4px">Exato: ${opsIdealExato.toFixed(3)}</div>
  </div>
  <div style="${cardStyle(efIdeal >= 90 ? "#16a34a" : efIdeal >= 75 ? "#d97706" : "#dc2626")}">
    <div style="font-size:8px;color:#888;letter-spacing:1px;margin-bottom:4px">EFICIÊNCIA (Nº IDEAL)</div>
    <div style="font-size:28px;font-weight:900;color:${efIdeal >= 90 ? "#16a34a" : efIdeal >= 75 ? "#d97706" : "#dc2626"};line-height:1">${efIdeal.toFixed(1)}%</div>
    <div style="font-size:9px;color:#888;margin-top:4px">${efIdeal >= 90 ? "Ótimo" : efIdeal >= 75 ? "Bom" : "Atenção"}</div>
  </div>
  <div style="${cardStyle("#1d4ed8")}">
    <div style="font-size:8px;color:#888;letter-spacing:1px;margin-bottom:4px">Σ TEMPO PADRÃO</div>
    <div style="font-size:22px;font-weight:900;color:#1d4ed8;line-height:1">${fmt(somaTP)}</div>
    <div style="font-size:9px;color:#888;margin-top:4px">${opsComTP.length} operação(ões)</div>
  </div>
  <div style="${cardStyle("#d97706")}">
    <div style="font-size:8px;color:#888;letter-spacing:1px;margin-bottom:4px">TAKT TIME</div>
    <div style="font-size:22px;font-weight:900;color:#d97706;line-height:1">${fmt(taktMs)}</div>
    <div style="font-size:9px;color:#888;margin-top:4px">ritmo exigido</div>
  </div>
</div>

<!-- DIAGNÓSTICO -->
${diagBox}

<!-- TABELA DE OPERAÇÕES -->
<h2>Detalhamento por Operação</h2>
<table>
  <thead>
    <tr>
      <th>OP</th><th style="text-align:left">OPERAÇÃO</th><th>FR%</th>
      <th>TO MÉD</th><th>TN MÉD</th><th>TP</th>
      <th style="width:100px">% DO Σ TP</th>
      <th>CONTRIB (ops)</th>
    </tr>
  </thead>
  <tbody>${linhasOps}</tbody>
  <tfoot>
    <tr style="background:#1a1a2e;color:#fff;font-weight:700">
      <td colspan="5" style="text-align:right;font-size:9px;letter-spacing:1px">TOTAL Σ TP</td>
      <td style="text-align:center;font-family:monospace">${fmt(somaTP)}</td>
      <td></td>
      <td style="text-align:center">${opsIdealExato.toFixed(3)}</td>
    </tr>
  </tfoot>
</table>
<div style="margin-top:4px;font-size:8px;color:#888">
  TO = Tempo Observado · TN = Tempo Normal (TO × FR/100) · TP = Tempo Padrão (TN × ${100 + tol}%) · Contrib = TP ÷ Takt Time
</div>

<!-- RODAPÉ -->
<div style="margin-top:24px;padding-top:8px;border-top:1px solid #e0e3eb;display:flex;justify-content:space-between;font-size:8px;color:#aaa">
  <span>Desenvolvido por <strong>Oderli Sergio Garcia</strong> &amp; Claude (Anthropic)</span>
  <span>RitmoProd IE · Dimensionamento de Operadores · ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}</span>
</div>

</body></html>`;

  const w = window.open("", "_blank"); w.document.write(html); w.document.close();
};
