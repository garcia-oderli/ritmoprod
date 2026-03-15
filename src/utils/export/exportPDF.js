import { calcOp, gerarSugestoes } from "../calculations";
import { fmt, fmtM, fmtDT, fmtD } from "../formatters";
import { logoDataUrl } from "./exportUtils";

export const exportFolhaColeta = (estudo,operacoes) => {
  const n=Math.min(estudo.metasObs||10,10);
  const header=`<tr style="background:#1a1a2e;color:#fff">${["OP","OPERAÇÃO","FR%",...Array(n).keys()].map((h,i)=>i<3?`<th style="padding:7px 10px;font-size:9px;letter-spacing:1px;text-align:${i===1?"left":"center"}">${i===0?"OP":i===1?"OPERAÇÃO":"FR%"}</th>`:`<th style="padding:7px 5px;font-size:8px;text-align:center">#${h+1}</th>`).join("")}</tr>`;
  const rows=operacoes.map((op,i)=>{
    const cells=Array(n).fill(`<td style="height:30px;border:1px solid #ddd;min-width:52px"></td>`).join("");
    return `<tr style="background:${i%2===0?"#fff":"#f8fafc"}"><td style="padding:6px 8px;border:1px solid #ddd;font-weight:700;color:#c0392b;text-align:center">OP${i+1}</td><td style="padding:6px 8px;border:1px solid #ddd;font-weight:600">${op.nome}</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${op.fr}%</td>${cells}</tr>`;
  }).join("");
  const html=`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Folha de Coleta — ${estudo.nome||"Estudo"}</title><style>@page{size:A4 landscape;margin:12mm 14mm}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;margin:0}table{width:100%;border-collapse:collapse}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:10px">
    <div style="display:flex;align-items:center;gap:12px"><img src="${logoDataUrl}" alt="RitmoProd" style="height:44px;border-radius:4px"/><div><div style="font-size:16px;font-weight:900">${estudo.nome||"Estudo de Tempos"}</div>${estudo.produto?`<div style="font-size:10px;color:#888">Produto: ${estudo.produto}</div>`:""}</div></div>
    <div style="font-size:10px;color:#555;text-align:right">Analista: <b>${estudo.analista||"_______________"}</b><br>Data: <b>${estudo.data}</b><br>Tolerância: <b>${estudo.tolerancia}%</b></div>
  </div>
  <table><thead>${header}</thead><tbody>${rows}</tbody></table>
  <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:10px">
    <div style="border:1px solid #ddd;border-radius:4px;padding:8px"><div style="font-weight:700;margin-bottom:4px;letter-spacing:1px;font-size:9px">PARADAS</div><table style="width:100%"><thead><tr style="background:#f1f5f9"><th style="padding:4px;text-align:left;font-size:9px">OPERAÇÃO</th><th style="padding:4px;font-size:9px">MOTIVO</th><th style="padding:4px;font-size:9px">DURAÇÃO</th><th style="padding:4px;font-size:9px">OBS</th></tr></thead><tbody>${Array(4).fill(`<tr><td style="height:24px;border-top:1px solid #eee"></td><td style="border-top:1px solid #eee"></td><td style="border-top:1px solid #eee"></td><td style="border-top:1px solid #eee"></td></tr>`).join("")}</tbody></table></div>
    <div style="border:1px solid #ddd;border-radius:4px;padding:8px"><div style="font-weight:700;margin-bottom:4px;letter-spacing:1px;font-size:9px">OBSERVAÇÕES GERAIS</div>${Array(5).fill(`<div style="border-bottom:1px solid #eee;height:22px;margin-bottom:2px"></div>`).join("")}</div>
  </div>
  <div style="margin-top:10px;font-size:8px;color:#bbb;display:flex;justify-content:space-between">
    <span>Desenvolvido por <strong>Oderli Sergio Garcia</strong> &amp; Claude (Anthropic)</span>
    <span>RitmoProd IE · Folha de Coleta · Meta: ${n} observações por operação</span>
  </div>
  </body></html>`;
  const toolbar=`<div style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#1a1a2e;padding:8px 16px;display:flex;gap:10px;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,.4)" class="no-print">
  <span style="color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;margin-right:8px">⧗ RitmoProd</span>
  <button onclick="window.print()" style="background:#c0392b;color:#fff;border:none;padding:7px 18px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer">🖨 Imprimir</button>
  <button onclick="window.print()" style="background:#1a7a4a;color:#fff;border:none;padding:7px 18px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer" title="No diálogo de impressão, selecione 'Salvar como PDF'">💾 Salvar PDF</button>
  <span style="color:#aaa;font-size:10px;margin-left:4px">← no diálogo, escolha "Salvar como PDF"</span>
  <button onclick="window.close()" style="margin-left:auto;background:#334;color:#aaa;border:1px solid #445;padding:6px 14px;border-radius:4px;font-size:11px;cursor:pointer">✕ Fechar</button>
</div>
<div style="height:48px" class="no-print"></div>`;
  const htmlFinal = html.replace('<body>', '<body>' + toolbar).replace('@media print{', '@media print{ .no-print{display:none!important}');
  const w=window.open("","_blank"); w.document.write(htmlFinal); w.document.close();
};

export const exportPDF = (estudo,operacoes,tol) => {
  const sugs=gerarSugestoes(operacoes,tol);
  const pc={alta:"#c0392b",media:"#d4860b",baixa:"#1a7a4a"};
  const cvCor=v=>v>20?"#c0392b":v>10?"#d4860b":"#1a7a4a";
  const totalObs=operacoes.reduce((a,o)=>a+o.tempos.filter(v=>v>200).length,0);
  const totalParadas=operacoes.reduce((a,o)=>a+(o.paradas||[]).length,0);
  const totalParadaMs=operacoes.reduce((a,o)=>(o.paradas||[]).reduce((s,p)=>s+p.duracao,0)+a,0);

  const tab=operacoes.map((op,idx)=>{
    const c=calcOp(op,tol); if(!c)return"";
    const even=idx%2===0;
    return `<tr style="background:${even?"#fff":"#f7f8fa"}">
      <td style="text-align:center;font-weight:700;color:#c0392b;white-space:nowrap">OP${idx+1}</td>
      <td style="text-align:left;font-weight:600;max-width:160px">${op.nome}</td>
      <td style="text-align:center;font-weight:700;color:${c.n>=(estudo.metasObs||10)?"#1a7a4a":"#d4860b"}">${c.n}</td>
      <td style="text-align:center">${op.fr}%</td>
      <td style="text-align:center;font-variant-numeric:tabular-nums">${fmt(c.min)}</td>
      <td style="text-align:center;font-variant-numeric:tabular-nums;font-weight:600">${fmt(c.toMed)}</td>
      <td style="text-align:center;font-variant-numeric:tabular-nums">${fmt(c.max)}</td>
      <td style="text-align:center;font-weight:700;color:${cvCor(c.cvPct)}">${c.cvPct.toFixed(1)}%</td>
      <td style="text-align:center;font-variant-numeric:tabular-nums;background:#eef2ff">${fmt(c.tnMed)}</td>
      <td style="text-align:center;font-variant-numeric:tabular-nums;font-weight:800;color:#c0392b;background:#fff0ee">${fmt(c.tpVal)}</td>
      <td style="text-align:center;font-weight:800;color:#922b21;background:#fff0ee">${c.cap} pçs/h</td>
      <td style="text-align:center;color:${c.nParadas>0?"#d4860b":"#aaa"};font-weight:${c.nParadas>0?700:400}">${c.nParadas>0?`${c.nParadas} (${fmtM(c.totalParada)})`:"—"}</td>
    </tr>`;
  }).join("");

  const par=operacoes.flatMap((op,oi)=>(op.paradas||[]).map((p,pi)=>`
    <tr style="background:${pi%2===0?"#fff":"#f7f8fa"}">
      <td style="text-align:left;font-weight:600"><span style="color:#c0392b;margin-right:6px">OP${oi+1}</span>${op.nome}</td>
      <td style="text-align:center"><span style="background:#fff3cd;color:#856404;padding:2px 8px;border-radius:3px;font-size:9px;font-weight:700">${p.motivo}</span></td>
      <td style="text-align:center;font-weight:700;color:#c0392b">${fmtM(p.duracao)}</td>
      <td style="text-align:left;color:#555;font-style:italic">${p.obs||"—"}</td>
      <td style="text-align:center;color:#888;white-space:nowrap">${p.inicio}</td>
    </tr>`)).join("");

  const sugCols=sugs.reduce((acc,s,i)=>{
    const col=i%2; if(!acc[col])acc[col]=[]; acc[col].push(s); return acc;
  },[[],[]]);
  const sugColHtml=col=>col.map(s=>`
    <div style="border-left:3px solid ${pc[s.prio]};padding:8px 12px;margin-bottom:8px;background:#fafafa;border-radius:0 4px 4px 0;page-break-inside:avoid">
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;flex-wrap:wrap">
        <span style="background:${pc[s.prio]};color:#fff;padding:1px 7px;border-radius:2px;font-size:8px;font-weight:700;letter-spacing:1px">${s.prio.toUpperCase()}</span>
        <span style="font-size:9px;color:#888;background:#eee;padding:1px 6px;border-radius:2px">${s.op}</span>
        <strong style="font-size:11px">${s.titulo}</strong>
      </div>
      <p style="margin:2px 0;font-size:10px;color:#555;line-height:1.5">${s.desc}</p>
      <p style="margin:4px 0 0;font-size:10px;color:#1a7a4a;background:#f0fdf4;padding:4px 8px;border-radius:3px"><b>✦</b> ${s.acao}</p>
    </div>`).join("");

  const html=`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>RitmoProd — ${estudo.nome||"Estudo"}</title>
<style>
  @page { size: A4 landscape; margin: 12mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; color: #1a1a2e; font-size: 11px; background: #fff; }
  h2 { font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #555; border-bottom: 2px solid #c0392b; padding-bottom: 5px; margin: 16px 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 4px; }
  thead tr { background: #1a1a2e; color: #fff; }
  th { padding: 7px 8px; font-size: 8px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; text-align: center; }
  td { padding: 6px 8px; border-bottom: 1px solid #e8eaf0; font-size: 10px; vertical-align: middle; }
  .legend { display:flex; gap:16px; font-size:8px; color:#888; margin-top:4px; }
  .legend span { display:flex; align-items:center; gap:4px; }
  .dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-break { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- CABEÇALHO -->
<div style="display:flex;justify-content:space-between;align-items:stretch;margin-bottom:14px;gap:12px">
  <div style="display:flex;align-items:center;gap:14px">
    <img src="${logoDataUrl}" alt="RitmoProd" style="height:60px;border-radius:6px"/>
    <div>
      <div style="font-size:18px;font-weight:900;color:#1a1a2e;line-height:1.1">${estudo.nome||"Estudo de Tempos"}</div>
      ${estudo.produto?`<div style="font-size:11px;color:#555;margin-top:3px">Produto: <b>${estudo.produto}</b></div>`:""}
      <div style="font-size:10px;color:#888;margin-top:4px">ESTUDO DE TEMPOS E MOVIMENTOS · ENGENHARIA INDUSTRIAL</div>
    </div>
  </div>
  <div style="display:flex;gap:10px;align-items:center">
    <div style="background:#f7f8fa;border:1px solid #e0e3eb;border-radius:6px;padding:10px 14px;text-align:center;min-width:90px">
      <div style="font-size:8px;color:#888;letter-spacing:1px;margin-bottom:4px">ANALISTA</div>
      <div style="font-size:12px;font-weight:700">${estudo.analista||"—"}</div>
    </div>
    <div style="background:#f7f8fa;border:1px solid #e0e3eb;border-radius:6px;padding:10px 14px;text-align:center;min-width:80px">
      <div style="font-size:8px;color:#888;letter-spacing:1px;margin-bottom:4px">DATA</div>
      <div style="font-size:12px;font-weight:700">${estudo.data}</div>
    </div>
    <div style="background:#f7f8fa;border:1px solid #e0e3eb;border-radius:6px;padding:10px 14px;text-align:center;min-width:80px">
      <div style="font-size:8px;color:#888;letter-spacing:1px;margin-bottom:4px">TOLERÂNCIA</div>
      <div style="font-size:20px;font-weight:900;color:#c0392b">${tol}%</div>
    </div>
    <div style="background:#f7f8fa;border:1px solid #e0e3eb;border-radius:6px;padding:10px 14px;text-align:center;min-width:80px">
      <div style="font-size:8px;color:#888;letter-spacing:1px;margin-bottom:4px">META OBS</div>
      <div style="font-size:20px;font-weight:900;color:#1a1a2e">${estudo.metasObs}</div>
    </div>
  </div>
</div>

<!-- KPIs -->
<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px">
  ${[
    {l:"OPERAÇÕES",v:operacoes.length,c:"#c0392b"},
    {l:"OBSERVAÇÕES",v:totalObs,c:"#1a1a2e"},
    {l:"COMPLETAS",v:`${operacoes.filter(o=>o.tempos.filter(v=>v>200).length>=(estudo.metasObs||10)).length}/${operacoes.length}`,c:"#1a7a4a"},
    {l:"PARADAS",v:totalParadas,c:totalParadas>0?"#d4860b":"#1a7a4a"},
    {l:"T. PARADO",v:fmtM(totalParadaMs)||"—",c:totalParadaMs>0?"#d4860b":"#1a7a4a"},
  ].map(k=>`<div style="background:#f7f8fa;border:1px solid #e0e3eb;border-left:3px solid ${k.c};border-radius:0 6px 6px 0;padding:10px 14px"><div style="font-size:8px;color:#888;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px">${k.l}</div><div style="font-size:20px;font-weight:900;color:${k.c}">${k.v}</div></div>`).join("")}
</div>

<!-- TABELA TEMPOS PADRÃO -->
<div class="no-break">
<h2>TEMPOS PADRÃO</h2>
<table>
  <thead>
    <tr>
      <th style="width:36px">OP</th>
      <th style="text-align:left;min-width:120px">OPERAÇÃO</th>
      <th>N</th><th>FR%</th>
      <th>TO MÍN</th><th>TO MÉD</th><th>TO MÁX</th>
      <th>CV%</th>
      <th style="background:#3a3fa8">TN MÉD</th>
      <th style="background:#922b21">TP</th>
      <th style="background:#922b21">CAP/H</th>
      <th>PARADAS</th>
    </tr>
  </thead>
  <tbody>${tab}</tbody>
</table>
<div class="legend">
  <span><span class="dot" style="background:#1a7a4a"></span> CV% ≤ 10% — Processo estável</span>
  <span><span class="dot" style="background:#d4860b"></span> CV% 10–20% — Atenção</span>
  <span><span class="dot" style="background:#c0392b"></span> CV% &gt; 20% — Revisar processo</span>
  <span style="margin-left:auto">TN = TO × FR/100 &nbsp;·&nbsp; TP = TN × (1 + ${tol}%) &nbsp;·&nbsp; Cap/h = 3600 ÷ TP(s)</span>
</div>
</div>

${par?`
<div class="no-break" style="margin-top:14px">
<h2>REGISTRO DE PARADAS</h2>
<table>
  <thead>
    <tr>
      <th style="text-align:left;min-width:180px">OPERAÇÃO</th>
      <th>MOTIVO</th><th>DURAÇÃO</th>
      <th style="text-align:left">OBSERVAÇÃO</th>
      <th>HORÁRIO</th>
    </tr>
  </thead>
  <tbody>${par}</tbody>
</table>
</div>`:""}

${sugs.length>0?`
<div style="margin-top:14px">
<h2>SUGESTÕES DE MELHORIA (${sugs.length})</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
  <div>${sugColHtml(sugCols[0])}</div>
  <div>${sugColHtml(sugCols[1])}</div>
</div>
</div>`:""}

<!-- RODAPÉ -->
<div style="margin-top:16px;padding-top:8px;border-top:1px solid #e0e3eb;display:flex;justify-content:space-between;font-size:8px;color:#aaa">
  <span>⧗ RitmoProd IE &nbsp;·&nbsp; Estudo de Tempos e Movimentos</span>
  <span>Desenvolvido por <strong>Oderli Sergio Garcia</strong> &amp; Claude (Anthropic)</span>
  <span>Gerado em ${fmtDT()}</span>
</div>

</body>
</html>`;
  const toolbar=`<div style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#1a1a2e;padding:8px 16px;display:flex;gap:10px;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,.4)" class="no-print">
  <span style="color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;margin-right:8px">⧗ RitmoProd</span>
  <button onclick="window.print()" style="background:#c0392b;color:#fff;border:none;padding:7px 18px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer">🖨 Imprimir</button>
  <button onclick="window.print()" style="background:#1a7a4a;color:#fff;border:none;padding:7px 18px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer" title="No diálogo de impressão, selecione 'Salvar como PDF'">💾 Salvar PDF</button>
  <span style="color:#aaa;font-size:10px;margin-left:4px">← no diálogo, escolha "Salvar como PDF"</span>
  <button onclick="window.close()" style="margin-left:auto;background:#334;color:#aaa;border:1px solid #445;padding:6px 14px;border-radius:4px;font-size:11px;cursor:pointer">✕ Fechar</button>
</div>
<div style="height:48px" class="no-print"></div>`;
  const htmlFinal = html.replace('<body>', '<body>' + toolbar).replace('@media print {', '@media print { .no-print{display:none!important}');
  const w=window.open("","_blank"); w.document.write(htmlFinal); w.document.close();
};
