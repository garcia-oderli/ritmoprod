import { calcOp, calcOEE } from "../../utils/calculations";
import { avg } from "../../utils/math";
import { fmt, fmtM } from "../../utils/formatters";
import { exportExcel } from "../../utils/export/exportExcel";
import { exportPDF, exportFolhaColeta } from "../../utils/export/exportPDF";
import { exportResumoExecutivo } from "../../utils/export/exportSpecial";
import { ST, Empty } from "../UI";

export default function TabRelatorio({
  estudo, operacoes, reportOp, setReportOp, C, btnR, metaOk
}) {
  const td = {padding:"10px 10px",textAlign:"center",borderBottom:`1px solid ${C.brd}`,fontSize:12};

  return (
    <div>
      {operacoes.filter(o=>o.tempos.length>0).length===0 ? <Empty C={C}>COLETE DADOS PARA GERAR O RELATÓRIO</Empty> : (
        <div>
          <div style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"14px 18px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
            <div><div style={{fontSize:17,fontWeight:900}}>{estudo.nome||"—"}</div><div style={{fontSize:10,color:C.muted,marginTop:3}}>{estudo.produto&&`${estudo.produto} · `}Analista: {estudo.analista||"—"} · {estudo.data} · Tol. {estudo.tolerancia}%</div></div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={()=>exportExcel(estudo,operacoes,estudo.tolerancia)} style={btnR}>↓ EXCEL</button><button onClick={()=>exportPDF(estudo,operacoes,estudo.tolerancia)} style={{...btnR,background:"#1e3a6e"}}>⎙ PDF</button><button onClick={()=>exportFolhaColeta(estudo,operacoes)} style={{...btnR,background:"#166534"}}>📋 FOLHA</button><button onClick={()=>exportResumoExecutivo(estudo,operacoes,estudo.tolerancia)} style={{...btnR,background:"#7c3aed"}}>📄 RESUMO EXEC.</button></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:20}}>
            {[{l:"OPERAÇÕES",v:operacoes.length},{l:"TOTAL OBS",v:operacoes.reduce((a,o)=>a+o.tempos.length,0)},{l:"COMPLETAS",v:`${operacoes.filter(metaOk).length}/${operacoes.length}`},{l:"PARADAS",v:operacoes.reduce((a,o)=>a+(o.paradas||[]).length,0),w:true},{l:"T.PARADO",v:fmtM(operacoes.reduce((a,o)=>(o.paradas||[]).reduce((s,p)=>s+p.duracao,0)+a,0)),w:true}].map(c=>(
              <div key={c.l} style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:6,padding:"13px 15px"}}><div style={{fontSize:8,color:C.muted,letterSpacing:3,marginBottom:5}}>{c.l}</div><div style={{fontSize:20,fontWeight:900,color:c.w?C.ylw:C.red}}>{c.v}</div></div>
            ))}
          </div>
          {(()=>{const oee=calcOEE(estudo,operacoes,estudo.tolerancia);return oee&&(<div style={{marginBottom:20}}><ST C={C}>OEE — EFICIÊNCIA GLOBAL DO EQUIPAMENTO</ST><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>{[{l:"DISPONIBILIDADE (A)",v:`${(oee.A*100).toFixed(1)}%`,c:oee.A>0.9?C.grn:oee.A>0.75?C.ylw:C.red,desc:"(Tempo disp. − Paradas) / Tempo disp."},{l:"DESEMPENHO (P)",v:oee.P!=null?`${(oee.P*100).toFixed(1)}%`:"—",c:oee.P!=null?(oee.P>0.9?C.grn:oee.P>0.75?C.ylw:C.red):C.muted,desc:"Peças × TP ideal / Tempo efetivo"},{l:"QUALIDADE (Q)",v:oee.Q!=null?`${(oee.Q*100).toFixed(1)}%`:"—",c:oee.Q!=null?(oee.Q>0.99?C.grn:oee.Q>0.95?C.ylw:C.red):C.muted,desc:"Peças boas / Total produzido"},{l:"OEE",v:oee.OEE!=null?`${(oee.OEE*100).toFixed(1)}%`:"—",c:oee.OEE!=null?(oee.OEE>0.85?C.grn:oee.OEE>0.65?C.ylw:C.red):C.muted,desc:"A × P × Q (meta: ≥ 85%)"}].map(k=><div key={k.l} style={{background:C.card,border:`1px solid ${C.brd}`,borderLeft:`4px solid ${k.c}`,borderRadius:"0 6px 6px 0",padding:"12px 14px"}}><div style={{fontSize:8,color:C.muted,letterSpacing:1,marginBottom:4}}>{k.l}</div><div style={{fontSize:24,fontWeight:900,color:k.c,marginBottom:4}}>{k.v}</div><div style={{fontSize:8,color:C.muted}}>{k.desc}</div></div>)}</div></div>);})()}
          <ST C={C}>TABELA CONSOLIDADA <span style={{fontSize:8,fontWeight:400,color:C.muted}}>· clique para detalhar</span></ST>
          <div style={{overflowX:"auto",marginBottom:20}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead><tr style={{background:"#0f172a",color:C.muted}}>{["OP","OPERAÇÃO","N","FR%","TO MÍN","TO MÉD","TO MÁX","CV%","TN MÉD","TP","CAP/H","PARADAS"].map(h=><th key={h} style={{padding:"9px 8px",fontSize:8,letterSpacing:2,fontWeight:900,textAlign:h==="OPERAÇÃO"?"left":"center",whiteSpace:"nowrap",background:["TP","CAP/H"].includes(h)?C.rdark:undefined}}>{h}</th>)}</tr></thead>
              <tbody>{operacoes.map((op,i)=>{const c=calcOp(op,estudo.tolerancia);if(!c)return null;const sel=reportOp===i;return(
                <tr key={i} style={{background:sel?"rgba(59,130,246,0.08)":i%2===0?C.card:C.bg,cursor:"pointer"}} onClick={()=>setReportOp(sel?null:i)}>
                  <td style={{...td,color:C.red,fontWeight:900}}>OP{i+1}</td><td style={{...td,textAlign:"left",fontWeight:700}}>{op.nome}</td>
                  <td style={{...td,color:metaOk(op)?C.grn:C.ylw,fontWeight:700}}>{c.n}</td><td style={td}>{op.fr}%</td>
                  <td style={{...td,fontVariantNumeric:"tabular-nums"}}>{fmt(c.min)}</td><td style={{...td,fontVariantNumeric:"tabular-nums",fontWeight:700}}>{fmt(c.toMed)}</td><td style={{...td,fontVariantNumeric:"tabular-nums"}}>{fmt(c.max)}</td>
                  <td style={{...td,color:c.cvPct>20?C.red:c.cvPct>10?C.ylw:C.grn,fontWeight:700}}>{c.cvPct.toFixed(1)}%</td>
                  <td style={{...td,background:"rgba(59,130,246,0.08)",fontVariantNumeric:"tabular-nums"}}>{fmt(c.tnMed)}</td>
                  <td style={{...td,background:C.rlight,fontWeight:900,color:C.red,fontVariantNumeric:"tabular-nums"}}>{fmt(c.tpVal)}</td>
                  <td style={{...td,background:C.rlight,fontWeight:900,color:C.rdark}}>{c.cap} pçs</td>
                  <td style={{...td,color:c.nParadas>0?C.ylw:C.muted,fontWeight:c.nParadas>0?700:400}}>{c.nParadas>0?`⏸${c.nParadas}`:"-"}</td>
                </tr>
              );})}</tbody>
            </table>
          </div>
          {reportOp!==null&&(()=>{const op=operacoes[reportOp];const c=calcOp(op,estudo.tolerancia);if(!c)return null;const rawT=op.tempos.filter(v=>v>200);const m=avg(rawT);return(
            <div style={{background:C.card,border:`2px solid ${C.red}`,borderRadius:8,padding:"16px 18px",marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div><span style={{color:C.red,fontWeight:900,marginRight:8}}>OP{reportOp+1}</span><span style={{fontSize:15,fontWeight:900}}>{op.nome}</span></div><button onClick={()=>setReportOp(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}>×</button></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(96px,1fr))",gap:8,marginBottom:14}}>{[{l:"TO MÍN",v:fmt(c.min)},{l:"TO MÉD",v:fmt(c.toMed)},{l:"TO MÁX",v:fmt(c.max)},{l:"DESVIO",v:fmt(c.sd)},{l:"CV%",v:c.cvPct.toFixed(1)+"%",w:c.cvPct>20},{l:"FR%",v:op.fr+"%"},{l:"TN MÉD",v:fmt(c.tnMed)},{l:"TP",v:fmt(c.tpVal),r:true},{l:"CAP/H",v:c.cap+" pçs",r:true}].map(x=><div key={x.l} style={{background:C.bg,borderRadius:4,padding:"8px 10px"}}><div style={{fontSize:8,color:C.muted,letterSpacing:2,marginBottom:3}}>{x.l}</div><div style={{fontSize:13,fontWeight:900,color:x.w?C.ylw:x.r?C.red:C.txt}}>{x.v}</div></div>)}</div>
              <div style={{fontSize:9,color:C.muted,letterSpacing:2,marginBottom:6}}>OBSERVAÇÕES</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:14}}>{rawT.map((t,ti)=>{const out=Math.abs(t-m)/m>0.3;return <div key={ti} title={out?"Possível outlier":""} style={{background:out?"rgba(239,68,68,0.12)":C.bg,border:`1px solid ${out?C.red:C.brd}`,borderRadius:3,padding:"3px 8px",fontSize:10,fontVariantNumeric:"tabular-nums",color:out?C.red:C.txt,fontWeight:out?700:400}}><span style={{color:C.muted,fontSize:8,marginRight:3}}>#{ti+1}</span>{fmt(t)}{out&&<span style={{marginLeft:3}}>⚠</span>}</div>;})}</div>
              {(op.paradas||[]).length>0&&<><div style={{fontSize:9,color:C.muted,letterSpacing:2,marginBottom:6}}>PARADAS</div><div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14}}>{op.paradas.map((p,pi)=><div key={pi} style={{display:"flex",gap:10,alignItems:"center",background:"rgba(245,158,11,0.08)",border:`1px solid rgba(245,158,11,0.25)`,borderRadius:4,padding:"7px 10px",fontSize:10,flexWrap:"wrap"}}><span style={{color:C.ylw,fontWeight:900}}>⏸</span><span style={{fontWeight:700}}>{p.motivo}</span><span style={{color:C.muted}}>|</span><span>{fmtM(p.duracao)}</span>{p.obs&&<span style={{color:C.muted,fontStyle:"italic"}}>"{p.obs}"</span>}<span style={{color:C.muted,fontSize:9,marginLeft:"auto"}}>{p.inicio}</span></div>)}</div></>}
              <div style={{fontSize:9,color:C.muted,letterSpacing:2,marginBottom:6}}>GRÁFICO DE TEMPOS COLETADOS</div>
              {(()=>{
                const W=500,H=80,pad=8;
                const mx=Math.max(...rawT)*1.1, mn=Math.min(...rawT)*0.9;
                const sx=i=>(i/(rawT.length-1||1))*(W-pad*2)+pad;
                const sy=v=>H-pad-((v-mn)/(mx-mn||1))*(H-pad*2);
                const pts=rawT.map((t,i)=>`${sx(i)},${sy(t)}`).join(" ");
                const area=`M${pad},${H-pad} `+rawT.map((t,i)=>`L${sx(i)},${sy(t)}`).join(" ")+` L${W-pad},${H-pad} Z`;
                const avgY=sy(m);
                return(
                  <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{marginBottom:4,borderRadius:4,background:C.bg}}>
                    <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.red} stopOpacity="0.3"/><stop offset="100%" stopColor={C.red} stopOpacity="0"/></linearGradient></defs>
                    <path d={area} fill="url(#gr)"/>
                    <line x1={pad} y1={avgY} x2={W-pad} y2={avgY} stroke={C.txt} strokeWidth="1" strokeDasharray="4,4" opacity="0.4"/>
                    <polyline points={pts} fill="none" stroke={C.red} strokeWidth="2" strokeLinejoin="round"/>
                    {rawT.map((t,i)=>{const out=Math.abs(t-m)/m>0.3;return <circle key={i} cx={sx(i)} cy={sy(t)} r="3" fill={out?"#ef4444":C.grn} stroke={C.card} strokeWidth="1"><title>{`#${i+1}: ${fmt(t)}`}</title></circle>;})}
                  </svg>
                );
              })()}
              <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:C.muted,marginBottom:8}}><span>Obs #1</span><span style={{color:C.txt}}>— média</span><span>Obs #{rawT.length}</span></div>
              <div style={{fontSize:9,color:C.muted,letterSpacing:2,marginBottom:6}}>HISTOGRAMA</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:2,height:50,marginBottom:2}}>{rawT.map((t,ti)=>{const mx=Math.max(...rawT),h=Math.max(4,(t/mx)*50),diff=Math.abs(t-m)/m;return <div key={ti} title={`#${ti+1}:${fmt(t)}`} style={{flex:1,height:h,background:diff>0.3?C.red:diff>0.15?C.ylw:C.grn,borderRadius:"2px 2px 0 0",minWidth:5}}/>;})}</div>
              <div style={{height:2,background:C.txt,borderRadius:1}}/>
            </div>
          );})()}
          <div style={{padding:"10px 14px",background:C.card,border:`1px solid ${C.brd}`,borderRadius:6,fontSize:9,color:C.muted,display:"flex",gap:16,flexWrap:"wrap",letterSpacing:1}}><strong style={{color:C.txt}}>CV%</strong><span style={{color:C.grn}}>●≤10% BOA</span><span style={{color:C.ylw}}>●10–20% ATENÇÃO</span><span style={{color:C.red}}>●&gt;20% REVISAR</span></div>
          {(()=>{
            const todasParadas=operacoes.flatMap(o=>o.paradas||[]);
            if(!todasParadas.length) return <div style={{marginTop:16,background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"16px 18px",fontSize:11,color:C.muted,textAlign:"center"}}>Nenhuma parada registrada — registre paradas na aba CAPTURA para ver o gráfico de distribuição.</div>;
            const byM=todasParadas.reduce((a,p)=>{a[p.motivo]=(a[p.motivo]||0)+p.duracao;return a;},{});
            const entries=Object.entries(byM).sort((a,b)=>b[1]-a[1]);
            const total=entries.reduce((s,[,v])=>s+v,0);
            const cores=["#3b82f6","#f59e0b","#22c55e","#ef4444","#8b5cf6","#06b6d4"];
            let cumAngle=0;
            const slices=entries.map(([nome,dur],i)=>{
              const pct=dur/total; const angle=pct*360;
              const startAngle=cumAngle; cumAngle+=angle;
              const s=startAngle*Math.PI/180, e=(startAngle+angle)*Math.PI/180;
              const r=80, cx=100, cy=100;
              const x1=cx+r*Math.sin(s), y1=cy-r*Math.cos(s);
              const x2=cx+r*Math.sin(e), y2=cy-r*Math.cos(e);
              const large=angle>180?1:0;
              return {nome,dur,pct,path:`M${cx},${cy} L${x1},${y1} A${r},${r},0,${large},1,${x2},${y2} Z`,cor:cores[i%cores.length]};
            });
            return(
              <div style={{marginTop:16,background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"16px 18px"}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:12}}>PARADAS POR MOTIVO</div>
                <div style={{display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}>
                  <svg width="200" height="200" viewBox="0 0 200 200">
                    {slices.map((s,i)=><path key={i} d={s.path} fill={s.cor} stroke={C.card} strokeWidth="2"/>)}
                  </svg>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
                    {slices.map((s,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:12,height:12,borderRadius:"50%",background:s.cor,flexShrink:0}}/>
                        <div style={{flex:1,fontSize:11,fontWeight:600}}>{s.nome}</div>
                        <div style={{fontSize:11,color:C.muted}}>{fmtM(s.dur)}</div>
                        <div style={{fontSize:11,fontWeight:700,color:s.cor,minWidth:36,textAlign:"right"}}>{(s.pct*100).toFixed(0)}%</div>
                      </div>
                    ))}
                    <div style={{borderTop:`1px solid ${C.brd}`,paddingTop:8,fontSize:11,color:C.muted,display:"flex",justifyContent:"space-between"}}><span>TOTAL</span><span style={{fontWeight:700,color:C.txt}}>{fmtM(total)}</span></div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
