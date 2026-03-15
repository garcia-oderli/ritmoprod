import * as XLSX from "xlsx";
import { avg, sd, cvPct, linReg } from "../math";
import { fmt, fmtD, fmtDT } from "../formatters";
import { logoDataUrl } from "./exportUtils";

export const exportPadroesPDF = (estudo, operacoes, tol) => {
  const validas = operacoes.filter(o => o.tempos.filter(v=>v>200).length >= 3);
  if (!validas.length) return alert("Colete ao menos 3 observações por operação.");
  const rows = operacoes.map((op, oi) => {
    const rawT = op.tempos.filter(v=>v>200);
    if (rawT.length < 3) return "";
    const m = avg(rawT), dp = sd(rawT);
    const ucl = m + 3*dp, lcl = Math.max(0, m - 3*dp);
    const fora = rawT.filter(v=>v>ucl||v<lcl).length;
    const lr = linReg(rawT);
    const metade = Math.floor(rawT.length/2);
    const pri = metade>0 ? avg(rawT.slice(0,metade)) : m;
    const seg = metade>0 ? avg(rawT.slice(metade)) : m;
    const fadiga = ((seg-pri)/pri)*100;
    const estavel = lr.dir==="estavel" && fora===0 && cvPct(rawT)<=15;
    const statusCor = estavel ? "#1a7a4a" : fora>0 || lr.dir==="crescente" ? "#c0392b" : "#d4860b";
    const statusTxt = estavel ? "✓ ESTÁVEL" : fora>0 ? "⚠ FORA CTRL" : "△ ATENÇÃO";
    const dirLabel = lr.dir==="crescente"?"↑ CRESCENTE":lr.dir==="decrescente"?"↓ DECRESCENTE":"→ ESTÁVEL";
    const bg = oi%2===0 ? "#fff" : "#f7f8fa";
    return `<tr style="background:${bg}">
      <td style="text-align:center;font-weight:700;color:#c0392b">OP${oi+1}</td>
      <td style="text-align:left;font-weight:600">${op.nome}</td>
      <td style="text-align:center">${rawT.length}</td>
      <td style="text-align:center">${fmt(m)}</td>
      <td style="text-align:center">${fmt(dp)}</td>
      <td style="text-align:center;font-weight:700;color:${cvPct(rawT)>20?"#c0392b":cvPct(rawT)>10?"#d4860b":"#1a7a4a"}">${cvPct(rawT).toFixed(1)}%</td>
      <td style="text-align:center">${fmt(ucl)}</td>
      <td style="text-align:center">${fmt(lcl)}</td>
      <td style="text-align:center;font-weight:700;color:${fora===0?"#1a7a4a":"#c0392b"}">${fora}</td>
      <td style="text-align:center;color:${lr.dir==="crescente"?"#c0392b":lr.dir==="decrescente"?"#1a7a4a":"#d4860b"}">${dirLabel}</td>
      <td style="text-align:center">${lr.r2.toFixed(3)}</td>
      <td style="text-align:center;color:${fadiga>5?"#c0392b":fadiga<-5?"#1a7a4a":"#d4860b"}">${(fadiga>0?"+":"")+fadiga.toFixed(1)}%</td>
      <td style="text-align:center"><span style="background:${statusCor}22;color:${statusCor};border:1px solid ${statusCor};border-radius:3px;padding:2px 7px;font-size:8px;font-weight:700">${statusTxt}</span></td>
    </tr>`;
  }).join("");
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Padrões — ${estudo.nome||"Estudo"}</title>
  <style>@page{size:A4 landscape;margin:12mm 14mm}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;margin:0;font-size:10px}table{width:100%;border-collapse:collapse}th,td{padding:6px 8px;border:1px solid #e0e3eb}th{background:#1a1a2e;color:#fff;font-size:8px;letter-spacing:1px;text-transform:uppercase}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none!important}}</style>
  </head><body>
  <div class="no-print" style="position:fixed;top:0;left:0;right:0;background:#1a1a2e;padding:8px 16px;display:flex;gap:10px;align-items:center;z-index:9999">
    <span style="color:#fff;font-size:11px;font-weight:700;margin-right:8px">⧗ RitmoProd</span>
    <button onclick="window.print()" style="background:#c0392b;color:#fff;border:none;padding:7px 18px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer">🖨 Imprimir / PDF</button>
    <button onclick="window.close()" style="margin-left:auto;background:#334;color:#aaa;border:1px solid #445;padding:6px 14px;border-radius:4px;font-size:11px;cursor:pointer">✕ Fechar</button>
  </div>
  <div style="height:52px" class="no-print"></div>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #c0392b">
    <div style="display:flex;align-items:center;gap:12px"><img src="${logoDataUrl}" alt="RitmoProd" style="height:44px;border-radius:4px"/><div><div style="font-size:16px;font-weight:900">${estudo.nome||"Estudo de Tempos"}</div><div style="font-size:9px;color:#888">Análise de Padrão de Processo${estudo.produto?" · "+estudo.produto:""}</div></div></div>
    <div style="font-size:9px;color:#555;text-align:right">Analista: <b>${estudo.analista||"—"}</b><br>Data: <b>${estudo.data}</b><br>Tolerância: <b>${tol}%</b></div>
  </div>
  <table><thead><tr>
    <th>OP</th><th style="text-align:left">OPERAÇÃO</th><th>N OBS</th><th>TO MÉD</th><th>DP</th><th>CV%</th><th>UCL (+3σ)</th><th>LCL (−3σ)</th><th>FORA CTRL</th><th>TENDÊNCIA</th><th>R²</th><th>Δ 1ª→2ª MET.</th><th>STATUS</th>
  </tr></thead><tbody>${rows}</tbody></table>
  <div style="margin-top:16px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
    ${(()=>{const valid=operacoes.filter(o=>o.tempos.filter(v=>v>200).length>=3);const cr=valid.filter(o=>linReg(o.tempos.filter(v=>v>200)).dir==="crescente").length;const dc=valid.filter(o=>linReg(o.tempos.filter(v=>v>200)).dir==="decrescente").length;const fc=valid.filter(o=>{const t=o.tempos.filter(v=>v>200),m2=avg(t),d=sd(t);return t.some(v=>v>m2+3*d||v<Math.max(0,m2-3*d));}).length;return[{l:"ESTÁVEIS",v:valid.length-cr-dc,c:"#1a7a4a"},{l:"CRESCENTES (FADIGA)",v:cr,c:cr>0?"#c0392b":"#aaa"},{l:"DECRESCENTES (APREND.)",v:dc,c:dc>0?"#1a7a4a":"#aaa"},{l:"FORA DE CONTROLE",v:fc,c:fc>0?"#c0392b":"#1a7a4a"}].map(k=>`<div style="background:#f7f8fa;border:1px solid #e0e3eb;border-left:4px solid ${k.c};border-radius:0 6px 6px 0;padding:10px 14px"><div style="font-size:8px;color:#888;letter-spacing:1px;margin-bottom:4px">${k.l}</div><div style="font-size:22px;font-weight:900;color:${k.c}">${k.v}</div></div>`).join("");})()}
  </div>
  <div style="margin-top:14px;padding-top:8px;border-top:1px solid #e0e3eb;display:flex;justify-content:space-between;font-size:8px;color:#aaa">
    <span>Desenvolvido por <strong>Oderli Sergio Garcia</strong> &amp; Claude (Anthropic)</span>
    <span>RitmoProd IE · Análise de Padrões · ${new Date().toLocaleDateString("pt-BR")}</span>
  </div>
  </body></html>`;
  const w = window.open("","_blank"); w.document.write(html); w.document.close();
};

export const exportPadroesExcel = (estudo, operacoes, tol) => {
  const wb = XLSX.utils.book_new();
  const s1 = [
    ["RitmoProd — ANÁLISE DE PADRÕES"],
    [`Estudo: ${estudo.nome}`, `Produto: ${estudo.produto||"—"}`, `Analista: ${estudo.analista||"—"}`, `Data: ${estudo.data}`, `Tolerância: ${tol}%`],
    [],
    ["OP","OPERAÇÃO","N OBS","TO MÉD (s)","DP (s)","CV%","UCL (+3σ)","LCL (−3σ)","FORA CTRL","TENDÊNCIA","R²","Δ 1ª→2ª MET. (%)","STATUS"]
  ];
  operacoes.forEach((op, oi) => {
    const rawT = op.tempos.filter(v=>v>200);
    if (rawT.length < 3) return;
    const m = avg(rawT), dp = sd(rawT);
    const ucl = m + 3*dp, lcl = Math.max(0, m - 3*dp);
    const fora = rawT.filter(v=>v>ucl||v<lcl).length;
    const lr = linReg(rawT);
    const metade = Math.floor(rawT.length/2);
    const fadiga = metade>0 ? (((avg(rawT.slice(metade))-avg(rawT.slice(0,metade)))/avg(rawT.slice(0,metade)))*100) : 0;
    const estavel = lr.dir==="estavel" && fora===0 && cvPct(rawT)<=15;
    const dirLabel = lr.dir==="crescente"?"↑ CRESCENTE":lr.dir==="decrescente"?"↓ DECRESCENTE":"→ ESTÁVEL";
    const status = estavel?"✓ ESTÁVEL":fora>0?"⚠ FORA CONTROLE":"△ ATENÇÃO";
    s1.push([`OP${oi+1}`, op.nome, rawT.length, +(m/1000).toFixed(3), +(dp/1000).toFixed(3), +cvPct(rawT).toFixed(1), +(ucl/1000).toFixed(3), +(lcl/1000).toFixed(3), fora, dirLabel, +lr.r2.toFixed(3), +fadiga.toFixed(1), status]);
  });
  const ws1 = XLSX.utils.aoa_to_sheet(s1);
  ws1["!cols"] = [{wch:6},{wch:28},{wch:7},{wch:10},{wch:8},{wch:6},{wch:10},{wch:10},{wch:10},{wch:16},{wch:7},{wch:14},{wch:16}];
  XLSX.utils.book_append_sheet(wb, ws1, "Padrões");
  const s2 = [["OP","OPERAÇÃO","OBS#","TO (s)"]];
  operacoes.forEach((op, oi) => op.tempos.filter(v=>v>200).forEach((t,ti) => s2.push([`OP${oi+1}`, op.nome, ti+1, +(t/1000).toFixed(3)])));
  const ws2 = XLSX.utils.aoa_to_sheet(s2);
  XLSX.utils.book_append_sheet(wb, ws2, "Tempos Coletados");
  XLSX.writeFile(wb, `ritmoprod-padroes-${(estudo.nome||"estudo").replace(/\s/g,"-")}-${fmtD().replace(/\//g,"-")}.xlsx`);
};
