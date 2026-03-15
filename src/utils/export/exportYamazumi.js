import * as XLSX from "xlsx";
import { calcOp, balancearLinha } from "../calculations";
import { fmt, fmtM, fmtD, fmtDT } from "../formatters";
import { logoDataUrl } from "./exportUtils";

export const exportYamazumiPDF = (estudo, operacoes, tol) => {
  const taktMs = (estudo.taktTime||0)*1000;
  const opsComTP = operacoes.map((op,i)=>{const c=calcOp(op,tol);return c?{i,nome:op.nome,tp:c.tpVal,cap:c.cap}:null;}).filter(Boolean);
  if (!opsComTP.length) return alert("Colete dados para gerar o relatório Yamazumi.");
  const maxTP = Math.max(...opsComTP.map(o=>o.tp), taktMs||0, 1);
  const estacoes = balancearLinha(operacoes, tol, taktMs);
  const eficiencia = estacoes.length>0&&taktMs>0 ? (opsComTP.reduce((a,o)=>a+o.tp,0)/(estacoes.length*taktMs)*100) : null;
  const gargalo = opsComTP.length>0 ? opsComTP.reduce((g,o)=>o.tp>g.tp?o:g,opsComTP[0]) : null;
  const capReal = gargalo ? gargalo.cap : null;
  const capEsperada = taktMs>0 ? Math.floor(3600000/taktMs) : null;
  const atingimento = capReal&&capEsperada ? (capReal/capEsperada*100) : null;
  const cores = ["#3b82f6","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#6366f1"];
  const barras = opsComTP.map((op,idx)=>{
    const pct = (op.tp/maxTP)*100;
    const over = taktMs>0 && op.tp>taktMs;
    const cor = over ? "#dc2626" : cores[idx%cores.length];
    const taktLine = taktMs>0 ? `<div style="position:absolute;top:0;bottom:0;left:${(taktMs/maxTP)*100}%;width:2px;background:#f59e0b;z-index:2"></div>` : "";
    return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:7px">
      <div style="font-size:9px;color:#888;width:30px;text-align:right;flex-shrink:0">OP${op.i+1}</div>
      <div style="font-size:10px;font-weight:600;width:160px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${op.nome}</div>
      <div style="flex:1;background:#f1f5f9;border-radius:4px;height:26px;position:relative;overflow:visible">
        <div style="height:100%;width:${pct}%;background:${cor};border-radius:4px;display:flex;align-items:center;padding-left:8px;box-sizing:border-box;position:relative">
          <span style="font-size:9px;color:#fff;font-weight:700;white-space:nowrap">${fmt(op.tp)}</span>
        </div>
        ${taktLine}
      </div>
      <div style="font-size:9px;color:${over?"#c0392b":"#1a7a4a"};font-weight:700;width:60px;text-align:right;flex-shrink:0">${op.cap} pçs/h</div>
    </div>`;
  }).join("");
  const linhaRows = opsComTP.map((op,idx)=>{
    const over = taktMs>0&&op.tp>taktMs;
    return `<tr style="background:${idx%2===0?"#fff":"#f7f8fa"}">
      <td style="text-align:center;font-weight:700;color:#c0392b">OP${op.i+1}</td>
      <td style="text-align:left;font-weight:600">${op.nome}</td>
      <td style="text-align:center;font-weight:700;color:${over?"#c0392b":"#1a1a2e"}">${fmt(op.tp)}</td>
      <td style="text-align:center">${op.cap} pçs/h</td>
      <td style="text-align:center;color:${over?"#c0392b":"#1a7a4a"};font-weight:700">${over?"⚠ GARGALO":"✓ OK"}</td>
      ${taktMs?`<td style="text-align:center;color:${over?"#c0392b":"#1a7a4a"}">${over?`+${fmt(op.tp-taktMs)} acima`:fmt(taktMs-op.tp)+" folga"}</td>`:""}
    </tr>`;
  }).join("");
  const estRows = estacoes.map((est,ei)=>{
    const ocup = (est.total/taktMs)*100;
    return `<tr style="background:${ei%2===0?"#fff":"#f7f8fa"}">
      <td style="text-align:center;font-weight:900;color:${cores[ei%cores.length]}">EST. ${ei+1}</td>
      <td style="text-align:left">${est.ops.map(o=>`OP${o.idx+1} ${o.nome}`).join(" + ")}</td>
      <td style="text-align:center;font-weight:700">${fmt(est.total)}</td>
      <td style="text-align:center;font-weight:700;color:${ocup>100?"#c0392b":ocup>85?"#1a7a4a":"#d4860b"}">${ocup.toFixed(0)}%</td>
    </tr>`;
  }).join("");
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Yamazumi — ${estudo.nome||"Estudo"}</title>
  <style>@page{size:A4 landscape;margin:12mm 14mm}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;margin:0;font-size:10px}table{width:100%;border-collapse:collapse}th,td{padding:6px 8px;border:1px solid #e0e3eb}th{background:#1a1a2e;color:#fff;font-size:8px;letter-spacing:1px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none!important}}</style>
  </head><body>
  <div class="no-print" style="position:fixed;top:0;left:0;right:0;background:#1a1a2e;padding:8px 16px;display:flex;gap:10px;align-items:center;z-index:9999">
    <span style="color:#fff;font-size:11px;font-weight:700;margin-right:8px">⧗ RitmoProd</span>
    <button onclick="window.print()" style="background:#c0392b;color:#fff;border:none;padding:7px 18px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer">🖨 Imprimir / PDF</button>
    <button onclick="window.close()" style="margin-left:auto;background:#334;color:#aaa;border:1px solid #445;padding:6px 14px;border-radius:4px;font-size:11px;cursor:pointer">✕ Fechar</button>
  </div>
  <div style="height:52px" class="no-print"></div>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #c0392b">
    <div style="display:flex;align-items:center;gap:12px"><img src="${logoDataUrl}" alt="RitmoProd" style="height:44px;border-radius:4px"/><div><div style="font-size:16px;font-weight:900">${estudo.nome||"Estudo de Tempos"}</div><div style="font-size:9px;color:#888">Gráfico Yamazumi — Balanceamento de Linha${estudo.produto?" · "+estudo.produto:""}</div></div></div>
    <div style="font-size:9px;color:#555;text-align:right">Analista: <b>${estudo.analista||"—"}</b><br>Data: <b>${estudo.data}</b>${taktMs?`<br>Takt Time: <b>${fmt(taktMs)}</b>`:""}${capEsperada?`<br>Cap. esperada: <b>${capEsperada} pçs/h</b>`:""}</div>
  </div>
  <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#1a1a2e;margin-bottom:10px;text-transform:uppercase">Gráfico Yamazumi — TP por Operação</div>
  <div style="background:#f7f8fa;border:1px solid #e0e3eb;border-radius:6px;padding:14px;margin-bottom:16px">
    ${barras}
    ${taktMs?`<div style="display:flex;align-items:center;gap:8px;margin-top:6px;font-size:9px;color:#d4860b"><div style="width:16px;height:2px;background:#f59e0b"></div> Takt Time: ${fmt(taktMs)}</div>`:""}
  </div>
  <div style="display:grid;grid-template-columns:${taktMs?"1fr 1fr":"1fr"};gap:14px;margin-bottom:16px">
    <div>
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase">Tabela de Tempos Padrão</div>
      <table><thead><tr><th>OP</th><th style="text-align:left">OPERAÇÃO</th><th>TP</th><th>CAP/H</th><th>STATUS</th>${taktMs?"<th>vs TAKT</th>":""}</tr></thead><tbody>${linhaRows}</tbody></table>
    </div>
    ${taktMs&&estacoes.length>0?`<div>
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase">Balanceamento de Linha</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px">
        ${[{l:"ESTAÇÕES NECESSÁRIAS",v:estacoes.length,c:"#c0392b"},{l:"EFICIÊNCIA",v:eficiencia!=null?eficiencia.toFixed(1)+"%":"—",c:eficiencia!=null?(eficiencia>85?"#1a7a4a":eficiencia>70?"#d4860b":"#c0392b"):"#888"},{l:"ATINGIMENTO",v:atingimento!=null?atingimento.toFixed(1)+"%":"—",c:atingimento!=null?(atingimento>=100?"#1a7a4a":atingimento>=85?"#d4860b":"#c0392b"):"#888"},{l:"CAP. REAL (GARGALO)",v:capReal?capReal+" pçs/h":"—",c:"#c0392b"}].map(k=>`<div style="background:#f7f8fa;border:1px solid #e0e3eb;border-left:3px solid ${k.c};border-radius:0 4px 4px 0;padding:8px 10px"><div style="font-size:7px;color:#888;letter-spacing:1px;margin-bottom:3px">${k.l}</div><div style="font-size:16px;font-weight:900;color:${k.c}">${k.v}</div></div>`).join("")}
      </div>
      <table><thead><tr><th>ESTAÇÃO</th><th style="text-align:left">OPERAÇÕES</th><th>TOTAL TP</th><th>OCUPAÇÃO</th></tr></thead><tbody>${estRows}</tbody></table>
    </div>`:""}
  </div>
  <div style="margin-top:10px;padding-top:8px;border-top:1px solid #e0e3eb;display:flex;justify-content:space-between;font-size:8px;color:#aaa">
    <span>Desenvolvido por <strong>Oderli Sergio Garcia</strong> &amp; Claude (Anthropic)</span>
    <span>RitmoProd IE · Yamazumi · ${new Date().toLocaleDateString("pt-BR")}</span>
  </div>
  </body></html>`;
  const w = window.open("","_blank"); w.document.write(html); w.document.close();
};

export const exportYamazumiExcel = (estudo, operacoes, tol) => {
  const taktMs = (estudo.taktTime||0)*1000;
  const opsComTP = operacoes.map((op,i)=>{const c=calcOp(op,tol);return c?{i,nome:op.nome,tp:c.tpVal,cap:c.cap}:null;}).filter(Boolean);
  if (!opsComTP.length) return alert("Colete dados para exportar o Yamazumi.");
  const wb = XLSX.utils.book_new();
  const s1 = [
    ["RitmoProd — YAMAZUMI"],
    [`Estudo: ${estudo.nome}`,`Produto: ${estudo.produto||"—"}`,`Analista: ${estudo.analista||"—"}`,`Data: ${estudo.data}`,`Tolerância: ${tol}%`,taktMs?`Takt Time: ${(taktMs/1000).toFixed(2)}s`:""],
    [],
    ["OP","OPERAÇÃO","TP (s)","CAP/H","STATUS",taktMs?"vs TAKT":""].filter(Boolean)
  ];
  opsComTP.forEach(op=>{
    const over = taktMs>0&&op.tp>taktMs;
    const row = [`OP${op.i+1}`,op.nome,+(op.tp/1000).toFixed(3),op.cap,over?"⚠ GARGALO":"✓ OK"];
    if (taktMs) row.push(over?`+${((op.tp-taktMs)/1000).toFixed(3)}s acima`:`${((taktMs-op.tp)/1000).toFixed(3)}s folga`);
    s1.push(row);
  });
  const ws1 = XLSX.utils.aoa_to_sheet(s1);
  ws1["!cols"] = [{wch:6},{wch:28},{wch:10},{wch:10},{wch:14},{wch:16}];
  XLSX.utils.book_append_sheet(wb, ws1, "Yamazumi");
  if (taktMs && balancearLinha(operacoes,tol,taktMs).length>0) {
    const estacoes = balancearLinha(operacoes,tol,taktMs);
    const s2 = [["ESTAÇÃO","OPERAÇÕES","TOTAL TP (s)","OCUPAÇÃO %"]];
    estacoes.forEach((est,ei)=>{
      s2.push([`Estação ${ei+1}`,est.ops.map(o=>`OP${o.idx+1} ${o.nome}`).join(" + "),+(est.total/1000).toFixed(3),+((est.total/taktMs)*100).toFixed(1)]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(s2);
    ws2["!cols"] = [{wch:10},{wch:50},{wch:12},{wch:12}];
    XLSX.utils.book_append_sheet(wb, ws2, "Balanceamento");
  }
  XLSX.writeFile(wb, `ritmoprod-yamazumi-${(estudo.nome||"estudo").replace(/\s/g,"-")}-${fmtD().replace(/\//g,"-")}.xlsx`);
};
