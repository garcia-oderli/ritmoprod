import { avg, sd, cvPct, linReg } from "../../utils/math";
import { fmt } from "../../utils/formatters";
import { exportPadroesExcel, exportPadroesPDF } from "../../utils/export/exportPadroes";
import { ST, Empty } from "../UI";

export default function TabPadroes({ estudo, operacoes, C, btnR }) {
  return (
    <div>
      {operacoes.filter(o=>o.tempos.filter(v=>v>200).length>=3).length===0
        ? <Empty C={C}>COLETE AO MENOS 3 OBSERVAÇÕES POR OPERAÇÃO</Empty>
        : (
          <div>
            {(()=>{
              const comRodada = operacoes.filter(op=>{
                const r2i = op.rodada2Inicio;
                if(r2i==null||r2i<1) return false;
                const r1 = op.tempos.filter(v=>v>200).slice(0,r2i);
                const r2 = op.tempos.filter(v=>v>200).slice(r2i);
                return r1.length>=1 && r2.length>=1;
              });
              if(!comRodada.length) return null;
              return (
                <div style={{marginBottom:20}}>
                  <ST C={C}>COMPARATIVO DE RODADAS</ST>
                  {comRodada.map((op,ci)=>{
                    const oi = operacoes.indexOf(op);
                    const r2i = op.rodada2Inicio;
                    const allT = op.tempos.filter(v=>v>200);
                    const r1 = allT.slice(0,r2i);
                    const r2 = allT.slice(r2i);
                    const m1=avg(r1), m2=avg(r2);
                    const tol=estudo.tolerancia;
                    const tp1=m1*(op.fr/100)*(1+tol/100);
                    const tp2=m2*(op.fr/100)*(1+tol/100);
                    const deltaPct=((m2-m1)/m1)*100;
                    const ganho=deltaPct<0;
                    const cor=Math.abs(deltaPct)<2?C.muted:ganho?C.grn:C.red;
                    const label=Math.abs(deltaPct)<2?"= ESTÁVEL":ganho?`▼ GANHO ${Math.abs(deltaPct).toFixed(1)}%`:`▲ PERDA ${deltaPct.toFixed(1)}%`;
                    return(
                      <div key={ci} style={{background:C.card,border:`1px solid ${C.brd}`,borderLeft:`5px solid ${cor}`,borderRadius:6,padding:"14px 18px",marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                          <div>
                            <span style={{color:C.red,fontWeight:900,marginRight:8,fontSize:10}}>OP{oi+1}</span>
                            <span style={{fontSize:14,fontWeight:900}}>{op.nome}</span>
                          </div>
                          <span style={{background:ganho?"rgba(34,197,94,0.1)":Math.abs(deltaPct)<2?"transparent":"rgba(220,38,38,0.1)",color:cor,border:`1px solid ${cor}`,borderRadius:3,padding:"3px 12px",fontSize:10,fontWeight:900,letterSpacing:1}}>{label}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                          {[
                            {titulo:"RODADA 1",n:r1.length,med:m1,tp:tp1,cv:cvPct(r1),cor:C.grn},
                            {titulo:"RODADA 2",n:r2.length,med:m2,tp:tp2,cv:cvPct(r2),cor:C.ylw},
                          ].map(rd=>(
                            <div key={rd.titulo} style={{background:C.bg,borderRadius:6,padding:"10px 14px",border:`1px solid ${rd.cor}44`}}>
                              <div style={{fontSize:9,fontWeight:900,color:rd.cor,letterSpacing:2,marginBottom:8}}>{rd.titulo} · {rd.n} obs</div>
                              {[{l:"TO MÉD",v:fmt(rd.med)},{l:"TP",v:fmt(rd.tp)},{l:"CV%",v:rd.cv.toFixed(1)+"%"}].map(x=>(
                                <div key={x.l} style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3}}>
                                  <span style={{color:C.muted}}>{x.l}</span>
                                  <strong style={{color:C.txt}}>{x.v}</strong>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                          {[
                            {l:"Δ TO MÉD",v:(deltaPct>0?"+":"")+deltaPct.toFixed(1)+"%",c:cor},
                            {l:"Δ TP",v:(tp2>tp1?"+":"")+fmt(tp2-tp1),c:cor},
                            {l:"GANHO CAP/H",v:(()=>{const c1=Math.floor(3600000/tp1),c2=Math.floor(3600000/tp2);return(c2-c1>0?"+":"")+(c2-c1)+" pçs";})(),c:cor},
                          ].map(x=>(
                            <div key={x.l} style={{background:C.bg,borderRadius:4,padding:"8px 10px",textAlign:"center"}}>
                              <div style={{fontSize:8,color:C.muted,letterSpacing:1,marginBottom:3}}>{x.l}</div>
                              <div style={{fontSize:14,fontWeight:900,color:x.c}}>{x.v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <ST C={C}>ANÁLISE DE PADRÃO DE PROCESSO</ST>
            <div style={{fontSize:10,color:C.muted,marginBottom:16,letterSpacing:1,lineHeight:1.7}}>
              Detecta tendências temporais, pontos fora de controle (±3σ) e comportamento de fadiga ou aprendizado ao longo das coletas.
            </div>
            {operacoes.map((op,oi)=>{
              const rawT=op.tempos.filter(v=>v>200);
              if(rawT.length<3) return null;
              const m=avg(rawT),dp=sd(rawT);
              const ucl=m+3*dp,lcl=Math.max(0,m-3*dp);
              const fora=rawT.filter(v=>v>ucl||v<lcl).length;
              const lr=linReg(rawT);
              const metade=Math.floor(rawT.length/2);
              const pri=metade>0?avg(rawT.slice(0,metade)):m;
              const seg=metade>0?avg(rawT.slice(metade)):m;
              const fadiga=((seg-pri)/pri)*100;
              const estavel=lr.dir==="estavel"&&fora===0&&cvPct(rawT)<=15;
              const borda=estavel?C.grn:fora>0||lr.dir==="crescente"?C.red:C.ylw;
              const dirLabel=lr.dir==="crescente"?"↑ CRESCENTE":lr.dir==="decrescente"?"↓ DECRESCENTE":"→ ESTÁVEL";
              const dirCor=lr.dir==="crescente"?C.red:lr.dir==="decrescente"?C.grn:C.ylw;
              return (
                <div key={oi} style={{background:C.card,border:`1px solid ${C.brd}`,borderLeft:`5px solid ${borda}`,borderRadius:6,padding:"14px 18px",marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                    <div>
                      <span style={{color:C.red,fontWeight:900,marginRight:8,fontSize:10}}>OP{oi+1}</span>
                      <span style={{fontSize:14,fontWeight:900}}>{op.nome}</span>
                      <span style={{fontSize:9,color:C.muted,marginLeft:8}}>{rawT.length} obs</span>
                    </div>
                    <span style={{background:estavel?"rgba(34,197,94,0.08)":fora>0?C.rlight:"rgba(245,158,11,0.08)",color:estavel?C.grn:fora>0?C.red:C.ylw,border:`1px solid ${borda}`,borderRadius:3,padding:"3px 10px",fontSize:8,fontWeight:900,letterSpacing:2}}>
                      {estavel?"✓ ESTÁVEL":fora>0?"⚠ FORA DE CONTROLE":"△ ATENÇÃO"}
                    </span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(105px,1fr))",gap:8,marginBottom:12}}>
                    {[
                      {l:"TENDÊNCIA",v:dirLabel,c:dirCor},
                      {l:"INCLINAÇÃO",v:lr.pct.toFixed(1)+"%/obs",c:lr.pct<2?C.grn:lr.pct<5?C.ylw:C.red},
                      {l:"R² TENDÊNCIA",v:lr.r2.toFixed(3),c:lr.r2>0.5?C.red:C.muted},
                      {l:"FORA CTRL",v:`${fora}/${rawT.length}`,c:fora===0?C.grn:C.red},
                      {l:"Δ 1ª→2ª METADE",v:(fadiga>0?"+":"")+fadiga.toFixed(1)+"%",c:fadiga>5?C.red:fadiga<-5?C.grn:C.ylw},
                      {l:"UCL (+3σ)",v:fmt(ucl),c:C.muted},
                      {l:"LCL (−3σ)",v:fmt(lcl),c:C.muted},
                    ].map(x=>(
                      <div key={x.l} style={{background:C.bg,borderRadius:4,padding:"8px 10px"}}>
                        <div style={{fontSize:8,color:C.muted,letterSpacing:2,marginBottom:3}}>{x.l}</div>
                        <div style={{fontSize:12,fontWeight:900,color:x.c}}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:9,color:C.muted,letterSpacing:2,marginBottom:5}}>CARTA DE CONTROLE (±3σ)</div>
                  {(()=>{
                    const W=500,H=90,pad=10;
                    const r2i=op.rodada2Inicio;
                    const hasR2=r2i!=null&&r2i>0&&rawT.slice(r2i).length>0;
                    const r1T=hasR2?rawT.slice(0,r2i):rawT;
                    const r2T=hasR2?rawT.slice(r2i):[];
                    const allV=[...rawT,ucl,lcl>0?lcl:m];
                    const hi=Math.max(...allV)*1.05,lo=Math.max(0,Math.min(...allV)*0.95);
                    const sy=v=>H-pad-((v-lo)/(hi-lo||1))*(H-pad*2);
                    const sxFor=(i,len)=>(i/(len-1||1))*(W-pad*2)+pad;
                    const m1=hasR2?avg(r1T):null;
                    const m2=hasR2?avg(r2T):null;
                    return(
                      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{borderRadius:4,background:C.bg,marginBottom:4}}>
                        <line x1={pad} y1={sy(ucl)} x2={W-pad} y2={sy(ucl)} stroke="#ef4444" strokeWidth="1" strokeDasharray="5,3"/>
                        <line x1={pad} y1={sy(m)}   x2={W-pad} y2={sy(m)}   stroke={C.txt}   strokeWidth="1" strokeDasharray="3,3" opacity="0.5"/>
                        {lcl>0&&<line x1={pad} y1={sy(lcl)} x2={W-pad} y2={sy(lcl)} stroke="#3b82f6" strokeWidth="1" strokeDasharray="5,3"/>}
                        {hasR2?(<>
                          {r1T.length>1&&<polyline points={r1T.map((t,i)=>`${sxFor(i,r1T.length)},${sy(t)}`).join(" ")} fill="none" stroke={C.grn} strokeWidth="1.5" strokeLinejoin="round" opacity="0.8"/>}
                          {r1T.map((t,ti)=>{const out=t>ucl||t<lcl;return <circle key={`r1${ti}`} cx={sxFor(ti,r1T.length)} cy={sy(t)} r={out?5:3} fill={out?"#ef4444":C.grn} stroke={C.card} strokeWidth="1.5"><title>{`R1 #${ti+1}: ${fmt(t)}`}</title></circle>;})}
                          {m1&&<line x1={pad} y1={sy(m1)} x2={W-pad} y2={sy(m1)} stroke={C.grn} strokeWidth="1" strokeDasharray="2,4" opacity="0.6"/>}
                          {r2T.length>1&&<polyline points={r2T.map((t,i)=>`${sxFor(i,r2T.length)},${sy(t)}`).join(" ")} fill="none" stroke={C.ylw} strokeWidth="1.5" strokeLinejoin="round" opacity="0.8"/>}
                          {r2T.map((t,ti)=>{const out=t>ucl||t<lcl;return <circle key={`r2${ti}`} cx={sxFor(ti,r2T.length)} cy={sy(t)} r={out?5:3} fill={out?"#ef4444":C.ylw} stroke={C.card} strokeWidth="1.5"><title>{`R2 #${ti+1}: ${fmt(t)}`}</title></circle>;})}
                          {m2&&<line x1={pad} y1={sy(m2)} x2={W-pad} y2={sy(m2)} stroke={C.ylw} strokeWidth="1" strokeDasharray="2,4" opacity="0.6"/>}
                        </>):(<>
                          <polyline points={r1T.map((t,i)=>`${sxFor(i,r1T.length)},${sy(t)}`).join(" ")} fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinejoin="round" opacity="0.6"/>
                          {rawT.map((t,ti)=>{const out=t>ucl||t<lcl;return <circle key={ti} cx={sxFor(ti,rawT.length)} cy={sy(t)} r={out?5:3} fill={out?"#ef4444":t>m?C.ylw:C.grn} stroke={C.card} strokeWidth="1.5"><title>{`#${ti+1}: ${fmt(t)}`}</title></circle>;})}
                        </>)}
                      </svg>
                    );
                  })()}
                  <div style={{display:"flex",gap:14,fontSize:8,color:C.muted,marginTop:5,letterSpacing:1,flexWrap:"wrap"}}>
                    <span><span style={{color:C.red}}>—</span> UCL {fmt(ucl)}</span>
                    <span><span style={{color:C.txt}}>—</span> Média {fmt(m)}</span>
                    {lcl>0&&<span><span style={{color:"#2980b9"}}>—</span> LCL {fmt(lcl)}</span>}
                    {op.rodada2Inicio!=null&&op.tempos.slice(op.rodada2Inicio).length>0&&<>
                      <span><span style={{color:C.grn}}>●</span> R1 ({op.rodada2Inicio} obs)</span>
                      <span><span style={{color:C.ylw}}>●</span> R2 ({rawT.slice(op.rodada2Inicio).length} obs)</span>
                    </>}
                    <span style={{marginLeft:"auto",color:fora>0?C.red:C.grn,fontWeight:700}}>{fora>0?`${fora} PONTO(S) FORA`:"TODOS EM CONTROLE"}</span>
                  </div>
                </div>
              );
            })}
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginBottom:12,flexWrap:"wrap"}}>
              <button onClick={()=>exportPadroesExcel(estudo,operacoes,estudo.tolerancia)} style={btnR}>↓ EXCEL</button>
              <button onClick={()=>exportPadroesPDF(estudo,operacoes,estudo.tolerancia)} style={{...btnR,background:"#1e3a6e"}}>⎙ PDF</button>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:6,padding:"14px 18px"}}>
              <ST C={C}>RESUMO GERAL</ST>
              {(()=>{
                const valid=operacoes.filter(o=>o.tempos.filter(v=>v>200).length>=3);
                const cr=valid.filter(o=>linReg(o.tempos.filter(v=>v>200)).dir==="crescente").length;
                const dc=valid.filter(o=>linReg(o.tempos.filter(v=>v>200)).dir==="decrescente").length;
                const fc=valid.filter(o=>{const t=o.tempos.filter(v=>v>200),m2=avg(t),d=sd(t);return t.some(v=>v>m2+3*d||v<Math.max(0,m2-3*d));}).length;
                return (
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
                    {[
                      {l:"ESTÁVEIS",v:valid.length-cr-dc,c:C.grn},
                      {l:"CRESCENTES",v:cr,c:cr>0?C.red:C.muted,h:"Possível fadiga"},
                      {l:"DECRESCENTES",v:dc,c:dc>0?C.grn:C.muted,h:"Aprendizado"},
                      {l:"FORA CONTROLE",v:fc,c:fc>0?C.red:C.grn},
                    ].map(k=>(
                      <div key={k.l} style={{background:C.bg,borderRadius:4,padding:"10px 12px"}}>
                        <div style={{fontSize:8,color:C.muted,letterSpacing:2,marginBottom:4}}>{k.l}</div>
                        <div style={{fontSize:22,fontWeight:900,color:k.c}}>{k.v}</div>
                        {k.h&&<div style={{fontSize:8,color:C.muted,marginTop:2}}>{k.h}</div>}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )
      }
    </div>
  );
}
