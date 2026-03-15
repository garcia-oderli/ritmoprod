import { calcOp, balancearLinha } from "../../utils/calculations";
import { fmt } from "../../utils/formatters";
import { exportYamazumiExcel, exportYamazumiPDF } from "../../utils/export/exportYamazumi";
import { ST, Empty } from "../UI";

export default function TabYamazumi({ estudo, operacoes, C, btnR }) {
  const taktMs = (estudo.taktTime || 0) * 1000;
  const opsComTP = operacoes.map((op, i) => { const c = calcOp(op, estudo.tolerancia); return c ? { i, nome: op.nome, tp: c.tpVal, cap: c.cap } : null; }).filter(Boolean);
  const maxTP = Math.max(...opsComTP.map(o => o.tp), taktMs || 0, 1);
  const estacoes = balancearLinha(operacoes, estudo.tolerancia, taktMs);
  const eficiencia = estacoes.length > 0 && taktMs > 0 ? ((opsComTP.reduce((a, o) => a + o.tp, 0)) / (estacoes.length * taktMs) * 100) : null;
  const cores = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"];
  const gargalo = opsComTP.length > 0 ? opsComTP.reduce((g, o) => o.tp > g.tp ? o : g, opsComTP[0]) : null;
  const capReal = gargalo ? gargalo.cap : null;
  const capEsperada = taktMs > 0 ? Math.floor(3600000 / taktMs) : null;
  const atingimento = capReal && capEsperada ? ((capReal / capEsperada) * 100) : null;

  if (opsComTP.length === 0) return <Empty C={C}>COLETE DADOS E DEFINA OPERAÇÕES PARA GERAR O GRÁFICO</Empty>;

  return (
    <div>
      <ST C={C}>GRÁFICO YAMAZUMI — TEMPO PADRÃO POR OPERAÇÃO</ST>
      {!taktMs && <div style={{background:"rgba(245,158,11,0.1)",border:`1px solid ${C.ylw}`,borderRadius:6,padding:"8px 14px",marginBottom:14,fontSize:11,color:C.ylw}}>⚠ Defina o <b>Takt Time</b> na aba CONFIG para ver a linha de ritmo e o balanceamento.</div>}
      <div style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"16px",marginBottom:16}}>
        {opsComTP.map((op, idx) => {
          const pct = (op.tp / maxTP) * 100;
          const taktPct = taktMs > 0 ? (op.tp / taktMs * 100) : null;
          const over = taktMs > 0 && op.tp > taktMs;
          const near = taktMs > 0 && taktPct !== null && taktPct >= 80 && !over;
          const barCor = over ? "#dc2626" : near ? "#f59e0b" : "#22c55e";
          const tooltipTxt = `OP${op.i+1}: ${op.nome}\nTP: ${fmt(op.tp)}\nCAP/H: ${op.cap} pçs/h${taktPct !== null ? `\n% do Takt: ${taktPct.toFixed(0)}%` : ""}`;
          return (
            <div key={op.i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{fontSize:10,color:C.muted,width:24,textAlign:"right",flexShrink:0}}>OP{op.i+1}</div>
              <div style={{fontSize:10,fontWeight:600,width:140,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={op.nome}>{op.nome}</div>
              <div style={{flex:1,background:C.bg,borderRadius:4,height:28,position:"relative",overflow:"visible"}} title={tooltipTxt}>
                <div style={{height:"100%",width:`${pct}%`,background:barCor,borderRadius:4,display:"flex",alignItems:"center",paddingLeft:8,transition:"width 0.4s",position:"relative"}}>
                  <span style={{fontSize:9,color:"#fff",fontWeight:700,whiteSpace:"nowrap"}}>{fmt(op.tp)}</span>
                  {taktPct !== null && <span style={{fontSize:8,color:"rgba(255,255,255,0.85)",fontWeight:700,whiteSpace:"nowrap",marginLeft:6}}>{taktPct.toFixed(0)}%</span>}
                </div>
                {taktMs > 0 && (
                  <div style={{position:"absolute",top:-3,bottom:-3,left:`${(taktMs/maxTP)*100}%`,width:3,background:"#f59e0b",zIndex:2,borderRadius:2,boxShadow:"0 0 4px #f59e0b88"}}>
                    <span style={{position:"absolute",top:-16,left:2,fontSize:7,color:"#f59e0b",fontWeight:900,whiteSpace:"nowrap",letterSpacing:0}}>TAKT</span>
                  </div>
                )}
              </div>
              <div style={{fontSize:9,color:over?C.red:near?C.ylw:C.grn,fontWeight:700,width:60,textAlign:"right",flexShrink:0}}>{op.cap} pçs/h</div>
            </div>
          );
        })}
        {taktMs > 0 && (
          <div style={{display:"flex",alignItems:"center",gap:14,marginTop:10,fontSize:9,flexWrap:"wrap"}}>
            <span style={{display:"flex",alignItems:"center",gap:4,color:"#22c55e"}}><div style={{width:10,height:10,background:"#22c55e",borderRadius:2}}/> &lt;80% takt — OK</span>
            <span style={{display:"flex",alignItems:"center",gap:4,color:"#f59e0b"}}><div style={{width:10,height:10,background:"#f59e0b",borderRadius:2}}/> 80–100% — Atenção</span>
            <span style={{display:"flex",alignItems:"center",gap:4,color:"#dc2626"}}><div style={{width:10,height:10,background:"#dc2626",borderRadius:2}}/> &gt;100% — Gargalo</span>
            <span style={{display:"flex",alignItems:"center",gap:4,color:C.ylw,marginLeft:"auto"}}><div style={{width:14,height:3,background:"#f59e0b",borderRadius:1}}/> Takt Time: {fmt(taktMs)}</span>
          </div>
        )}
      </div>

      {/* ESPERADO vs REAL */}
      {gargalo && (
        <div style={{marginBottom:16}}>
          <ST C={C}>CAPACIDADE — ESPERADO vs REAL</ST>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:10}}>
            {[
              {l:"ESPERADO (TAKT)",v:capEsperada!=null?`${capEsperada} pçs/h`:"— (sem takt)",sub:capEsperada!=null?`Takt: ${fmt(taktMs)}`:"Defina o Takt Time",c:C.ylw},
              {l:"REAL (GARGALO)",v:capReal!=null?`${capReal} pçs/h`:"—",sub:`Gargalo: OP${gargalo.i+1} · ${gargalo.nome}`,c:atingimento!=null?(atingimento>=100?C.grn:atingimento>=85?C.ylw:C.red):C.muted},
              {l:"ATINGIMENTO",v:atingimento!=null?`${atingimento.toFixed(1)}%`:"—",sub:atingimento!=null?(atingimento>=100?"✓ Linha atende o takt":atingimento>=85?"⚠ Próximo do limite":"✕ Linha abaixo do takt"):"—",c:atingimento!=null?(atingimento>=100?C.grn:atingimento>=85?C.ylw:C.red):C.muted},
              {l:"DÉFICIT / SUPERÁVIT",v:capEsperada&&capReal?`${capReal-capEsperada>0?"+":""}${capReal-capEsperada} pçs/h`:"—",sub:capEsperada&&capReal?(capReal>=capEsperada?"Capacidade suficiente":`Faltam ${capEsperada-capReal} pçs/h`):"—",c:capEsperada&&capReal?(capReal>=capEsperada?C.grn:C.red):C.muted},
            ].map(k=>(
              <div key={k.l} style={{background:C.card,border:`1px solid ${C.brd}`,borderLeft:`4px solid ${k.c}`,borderRadius:"0 6px 6px 0",padding:"12px 14px"}}>
                <div style={{fontSize:8,color:C.muted,letterSpacing:1,marginBottom:4}}>{k.l}</div>
                <div style={{fontSize:18,fontWeight:900,color:k.c,marginBottom:3}}>{k.v}</div>
                <div style={{fontSize:9,color:C.muted}}>{k.sub}</div>
              </div>
            ))}
          </div>
          {atingimento != null && (
            <div style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:6,padding:"12px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.muted,marginBottom:6}}>
                <span>Capacidade real vs esperada</span>
                <span style={{fontWeight:700,color:atingimento>=100?C.grn:atingimento>=85?C.ylw:C.red}}>{atingimento.toFixed(1)}%</span>
              </div>
              <div style={{height:10,background:C.bg,borderRadius:5,overflow:"hidden",position:"relative"}}>
                <div style={{height:"100%",width:`${Math.min(100,atingimento)}%`,background:atingimento>=100?C.grn:atingimento>=85?C.ylw:C.red,borderRadius:5,transition:"width 0.4s"}}/>
                <div style={{position:"absolute",top:0,bottom:0,left:"85%",width:1,background:C.muted,opacity:0.5}}/>
                <div style={{position:"absolute",top:0,bottom:0,left:"100%",width:1,background:C.ylw,opacity:0.8}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:C.muted,marginTop:4}}>
                <span>0</span><span style={{marginLeft:"83%"}}>85%</span><span>100%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {taktMs > 0 && estacoes.length > 0 && (<>
        <ST C={C}>BALANCEAMENTO DE LINHA</ST>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:16}}>
          {[
            {l:"ESTAÇÕES NECESSÁRIAS",v:estacoes.length,c:C.red},
            {l:"EFICIÊNCIA DO BALANCEAMENTO",v:eficiencia!=null?`${eficiencia.toFixed(1)}%`:"—",c:eficiencia!=null?(eficiencia>85?C.grn:eficiencia>70?C.ylw:C.red):C.muted},
            {l:"TAKT TIME",v:fmt(taktMs),c:C.ylw},
            {l:"PEÇAS/H (TAKT)",v:`${Math.floor(3600000/taktMs)}`,c:C.txt},
          ].map(k=><div key={k.l} style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:6,padding:"12px 14px"}}><div style={{fontSize:8,color:C.muted,letterSpacing:1,marginBottom:4}}>{k.l}</div><div style={{fontSize:20,fontWeight:900,color:k.c}}>{k.v}</div></div>)}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {estacoes.map((est, ei) => {
            const ocup = (est.total / taktMs) * 100;
            return (
              <div key={ei} style={{background:C.card,border:`1px solid ${C.brd}`,borderLeft:`4px solid ${cores[ei%cores.length]}`,borderRadius:"0 8px 8px 0",padding:"12px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontWeight:900,color:cores[ei%cores.length]}}>ESTAÇÃO {ei+1}</span>
                  <span style={{fontSize:10,color:ocup>100?C.red:ocup>85?C.grn:C.ylw,fontWeight:700}}>{ocup.toFixed(0)}% ocupação · {fmt(est.total)}</span>
                </div>
                <div style={{height:8,background:C.bg,borderRadius:4,marginBottom:8,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.min(100,ocup)}%`,background:ocup>100?"#dc2626":ocup>85?C.grn:C.ylw,borderRadius:4}}/>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {est.ops.map(op=><span key={op.idx} style={{background:C.bg,border:`1px solid ${C.brd}`,borderRadius:3,padding:"3px 10px",fontSize:10}}><span style={{color:C.muted,marginRight:4}}>OP{op.idx+1}</span>{op.nome} <span style={{color:C.red,fontWeight:700}}>{fmt(op.tp)}</span></span>)}
                </div>
              </div>
            );
          })}
        </div>
      </>)}

      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16,flexWrap:"wrap"}}>
        <button onClick={()=>exportYamazumiExcel(estudo,operacoes,estudo.tolerancia)} style={btnR}>↓ EXCEL</button>
        <button onClick={()=>exportYamazumiPDF(estudo,operacoes,estudo.tolerancia)} style={{...btnR,background:"#1e3a6e"}}>⎙ PDF</button>
      </div>
    </div>
  );
}
