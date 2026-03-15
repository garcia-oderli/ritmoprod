import { calcOp } from "../../utils/calculations";
import { fmt } from "../../utils/formatters";
import { exportAntesDepoisPDF } from "../../utils/export/exportSpecial";
import { ST } from "../UI";

const COR_ANTES = "#ff5b5b";
const COR_DEPOIS = "#3ccf73";

function PainelSelecao({ label, item, cor, C }) {
  if (!item) {
    return (
      <div style={{flex:1,border:`2px dashed ${cor}`,borderRadius:8,padding:"14px 16px",opacity:0.5}}>
        <div style={{fontSize:9,fontWeight:900,color:cor,letterSpacing:2,marginBottom:6}}>{label}</div>
        <div style={{fontSize:11,color:C.muted}}>Nenhum estudo selecionado</div>
      </div>
    );
  }
  const nOps = item.operacoes.length;
  const nObs = item.operacoes.reduce((a, o) => a + o.tempos.filter(v => v > 200).length, 0);
  return (
    <div style={{flex:1,border:`2px solid ${cor}`,borderRadius:8,padding:"14px 16px",background:`${cor}0d`}}>
      <div style={{fontSize:9,fontWeight:900,color:cor,letterSpacing:2,marginBottom:6}}>{label}</div>
      <div style={{fontSize:13,fontWeight:700,color:C.txt,marginBottom:4}}>{item.estudo.nome||"sem nome"}</div>
      <div style={{fontSize:10,color:C.muted}}>Data: {item.estudo.data||"—"}</div>
      <div style={{fontSize:10,color:C.muted}}>Operadores: {nOps}</div>
      <div style={{fontSize:10,color:C.muted}}>Observações: {nObs}</div>
    </div>
  );
}

function Badge({ label, value, positive, C }) {
  const cor = positive ? COR_DEPOIS : COR_ANTES;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",background:`${cor}15`,border:`1px solid ${cor}40`,borderRadius:8,padding:"10px 16px",minWidth:110}}>
      <div style={{fontSize:18,fontWeight:900,color:cor}}>{value}</div>
      <div style={{fontSize:9,color:C.muted,textAlign:"center",marginTop:2,letterSpacing:1}}>{label}</div>
    </div>
  );
}

export default function TabAnteDepois({
  estudo, operacoes, estudos, estudoId,
  antesDepoisRef, setAntesDepoisRef,
  antesDepoisDepoisId, setAntesDepoisDepoisId,
  C, btnR
}) {
  const depoisId = antesDepoisDepoisId || estudoId;
  const estudoDepoisItem = estudos.find(e => e.id === depoisId);
  const opsDepois = estudoDepoisItem ? estudoDepoisItem.operacoes : operacoes;
  const tolDepois = estudoDepoisItem ? (estudoDepoisItem.estudo.tolerancia || 15) : (estudo.tolerancia || 15);
  const estudoDepoisInfo = estudoDepoisItem ? estudoDepoisItem.estudo : estudo;

  const estudoRefItem = antesDepoisRef ? estudos.find(e => e.id === antesDepoisRef) : null;
  const opsRef = estudoRefItem ? estudoRefItem.operacoes : [];
  const tolRef = estudoRefItem ? (estudoRefItem.estudo.tolerancia || 15) : 15;
  const allNomes = (estudoRefItem && estudoDepoisItem) ? [...new Set([...opsDepois.map(o => o.nome), ...opsRef.map(o => o.nome)])] : [];
  const somaA = allNomes.reduce((s, nome) => { const op = opsRef.find(o => o.nome === nome); const c = op ? calcOp(op, tolRef) : null; return s + (c ? c.tpVal : 0); }, 0);
  const somaD = allNomes.reduce((s, nome) => { const op = opsDepois.find(o => o.nome === nome); const c = op ? calcOp(op, tolDepois) : null; return s + (c ? c.tpVal : 0); }, 0);
  const deltaGeral = somaA > 0 ? ((somaD - somaA) / somaA * 100) : null;

  const nOpsAntes = estudoRefItem ? estudoRefItem.operacoes.length : 0;
  const nOpsDepois = estudoDepoisItem ? estudoDepoisItem.operacoes.length : 0;
  const deltaOps = nOpsAntes > 0 ? (nOpsDepois - nOpsAntes) : null;
  const ganhoEfic = deltaGeral !== null ? -deltaGeral : null;

  return (
    <div>
      <ST C={C}>⑧ ANTES / DEPOIS — COMPARATIVO DE MELHORIA</ST>

      {/* Painel superior: seleção ANTES | DEPOIS */}
      <div style={{display:"flex",gap:12,alignItems:"stretch",marginBottom:16}}>
        <PainelSelecao label="ANTES" item={estudoRefItem} cor={COR_ANTES} C={C} />
        <div style={{display:"flex",alignItems:"center",fontSize:20,color:C.muted,fontWeight:900}}>→</div>
        <PainelSelecao label="DEPOIS" item={estudoDepoisItem} cor={COR_DEPOIS} C={C} />
      </div>

      {estudos.length < 2 ? (
        <div style={{padding:"48px 24px",textAlign:"center",border:`2px dashed ${C.brd}`,borderRadius:8,color:C.muted,fontSize:11}}>
          Você precisa ter ao menos <b>2 estudos</b> salvos para usar esta funcionalidade.<br/>
          <span style={{fontSize:10,marginTop:6,display:"block"}}>Crie outro estudo ou importe um estudo anterior via JSON.</span>
        </div>
      ) : (
        <div>
          <div style={{fontSize:10,color:C.muted,marginBottom:10}}>
            Clique <b style={{color:COR_ANTES}}>ANTES</b> ou <b style={{color:COR_DEPOIS}}>DEPOIS</b> em cada estudo para montar o comparativo.
          </div>

          {/* Lista de estudos */}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {estudos.map(e => {
              const nObs = e.operacoes.reduce((a, o) => a + o.tempos.filter(v=>v>200).length, 0);
              const nOps = e.operacoes.length;
              const isAntes = antesDepoisRef === e.id;
              const isDepois = (antesDepoisDepoisId ? antesDepoisDepoisId === e.id : estudoId === e.id);
              const borderColor = isAntes ? COR_ANTES : isDepois ? COR_DEPOIS : C.brd;
              const bgColor = isAntes ? `${COR_ANTES}12` : isDepois ? `${COR_DEPOIS}12` : C.card;
              return (
                <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,background:bgColor,border:`2px solid ${borderColor}`,borderRadius:8,padding:"10px 14px",transition:"all .15s"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.txt}}>{e.estudo.nome||"sem nome"}</div>
                    {e.estudo.produto&&<div style={{fontSize:10,color:C.muted,marginTop:1}}>📦 {e.estudo.produto}</div>}
                    <div style={{fontSize:9,color:C.muted,marginTop:1}}>{e.estudo.data} · {nOps} ops · {nObs} obs</div>
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={()=>setAntesDepoisRef(isAntes?"":e.id)}
                      style={{fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:5,border:`2px solid ${COR_ANTES}`,background:isAntes?COR_ANTES:"transparent",color:isAntes?"#fff":COR_ANTES,cursor:"pointer",transition:"all .15s"}}>ANTES</button>
                    <button onClick={()=>setAntesDepoisDepoisId(isDepois&&antesDepoisDepoisId?"":e.id)}
                      style={{fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:5,border:`2px solid ${COR_DEPOIS}`,background:isDepois?COR_DEPOIS:"transparent",color:isDepois?"#fff":COR_DEPOIS,cursor:"pointer",transition:"all .15s"}}>DEPOIS</button>
                  </div>
                </div>
              );
            })}
          </div>

          {(!estudoRefItem || !estudoDepoisItem) && (
            <div style={{padding:"32px 24px",textAlign:"center",border:`1px dashed ${C.brd}`,borderRadius:8,color:C.muted,fontSize:11}}>
              Selecione um estudo <b>ANTES</b> e um estudo <b>DEPOIS</b> acima para ver o comparativo.
            </div>
          )}

          {/* Painel de comparação automático */}
          {estudoRefItem && estudoDepoisItem && (
            <div>
              {/* Badges visuais */}
              <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",marginBottom:16}}>
                {deltaGeral !== null && (
                  <Badge label="MELHORIA DE TEMPO" value={`${deltaGeral < 0 ? "" : "+"}${deltaGeral.toFixed(1)}%`} positive={deltaGeral < 0} C={C} />
                )}
                {deltaOps !== null && (
                  <Badge label="REDUÇÃO DE OPERADORES" value={`${deltaOps <= 0 ? "" : "+"}${deltaOps} ops`} positive={deltaOps <= 0} C={C} />
                )}
                {ganhoEfic !== null && (
                  <Badge label="GANHO DE EFICIÊNCIA" value={`${ganhoEfic > 0 ? "+" : ""}${ganhoEfic.toFixed(1)}%`} positive={ganhoEfic > 0} C={C} />
                )}
              </div>

              {/* KPIs */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
                {[
                  {l:"Σ TP ANTES",v:somaA>0?fmt(somaA):"—",c:COR_ANTES},
                  {l:"Σ TP DEPOIS",v:somaD>0?fmt(somaD):"—",c:COR_DEPOIS},
                  {l:"GANHO GERAL",v:deltaGeral!==null?`${deltaGeral>0?"+":""}${deltaGeral.toFixed(1)}%`:"—",c:deltaGeral!==null&&deltaGeral<0?COR_DEPOIS:COR_ANTES},
                  {l:"OPERAÇÕES",v:allNomes.length,c:C.txt},
                ].map(k=>(
                  <div key={k.l} style={{background:C.card,border:`1px solid ${C.brd}`,borderLeft:`4px solid ${k.c}`,borderRadius:"0 8px 8px 0",padding:"12px 14px"}}>
                    <div style={{fontSize:8,color:C.muted,letterSpacing:2,marginBottom:4,textTransform:"uppercase"}}>{k.l}</div>
                    <div style={{fontSize:20,fontWeight:900,color:k.c}}>{k.v}</div>
                  </div>
                ))}
              </div>

              {/* Cabeçalho dos estudos */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <div style={{background:`${COR_ANTES}0d`,border:`1px solid ${COR_ANTES}4d`,borderRadius:6,padding:"10px 14px"}}>
                  <div style={{fontSize:8,color:COR_ANTES,letterSpacing:2,fontWeight:900,marginBottom:3}}>ANTES (REFERÊNCIA)</div>
                  <div style={{fontSize:13,fontWeight:700}}>{estudoRefItem.estudo.nome||"sem nome"}</div>
                  <div style={{fontSize:10,color:C.muted}}>{estudoRefItem.estudo.data} · Tol {tolRef}%</div>
                </div>
                <div style={{background:`${COR_DEPOIS}0d`,border:`1px solid ${COR_DEPOIS}4d`,borderRadius:6,padding:"10px 14px"}}>
                  <div style={{fontSize:8,color:COR_DEPOIS,letterSpacing:2,fontWeight:900,marginBottom:3}}>DEPOIS</div>
                  <div style={{fontSize:13,fontWeight:700}}>{estudoDepoisInfo.nome||"sem nome"}</div>
                  <div style={{fontSize:10,color:C.muted}}>{estudoDepoisInfo.data} · Tol {tolDepois}%</div>
                </div>
              </div>

              {/* Tabela comparativa */}
              <ST C={C}>TABELA COMPARATIVA POR OPERAÇÃO</ST>
              <div style={{overflowX:"auto",marginBottom:16}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead>
                    <tr style={{background:"#0f172a",color:"#94a3b8"}}>
                      {["OPERAÇÃO","TP ANTES","TP DEPOIS","Δ%","CAP/H ANTES","CAP/H DEPOIS","STATUS"].map(h=>(
                        <th key={h} style={{padding:"9px 10px",fontSize:8,letterSpacing:1.5,fontWeight:900,textAlign:h==="OPERAÇÃO"?"left":"center",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allNomes.map((nome, ri) => {
                      const opA = opsRef.find(o => o.nome === nome);
                      const opD = opsDepois.find(o => o.nome === nome);
                      const cA = opA ? calcOp(opA, tolRef) : null;
                      const cD = opD ? calcOp(opD, tolDepois) : null;
                      const delta = cA && cD ? ((cD.tpVal - cA.tpVal) / cA.tpVal * 100) : null;
                      const melhorou = delta !== null && delta < -1;
                      const piorou = delta !== null && delta > 1;
                      return (
                        <tr key={ri} style={{background:ri%2===0?C.card:C.bg}}>
                          <td style={{padding:"9px 10px",fontWeight:700}}>{nome}</td>
                          <td style={{padding:"9px 10px",textAlign:"center",color:COR_ANTES,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{cA?fmt(cA.tpVal):"—"}</td>
                          <td style={{padding:"9px 10px",textAlign:"center",color:COR_DEPOIS,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{cD?fmt(cD.tpVal):"—"}</td>
                          <td style={{padding:"9px 10px",textAlign:"center",fontWeight:900,color:delta===null?C.muted:melhorou?COR_DEPOIS:piorou?COR_ANTES:C.muted}}>{delta===null?"—":`${delta>0?"+":""}${delta.toFixed(1)}%`}</td>
                          <td style={{padding:"9px 10px",textAlign:"center",color:C.muted}}>{cA?`${cA.cap} pçs`:"—"}</td>
                          <td style={{padding:"9px 10px",textAlign:"center",color:C.muted}}>{cD?`${cD.cap} pçs`:"—"}</td>
                          <td style={{padding:"9px 10px",textAlign:"center"}}>
                            {delta===null?<span style={{color:C.muted,fontSize:10}}>sem dados</span>:melhorou?<span style={{color:COR_DEPOIS,fontWeight:900,fontSize:16}}>↑</span>:piorou?<span style={{color:COR_ANTES,fontWeight:900,fontSize:16}}>↓</span>:<span style={{color:C.muted,fontSize:10}}>= estável</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:8}}>
                <button onClick={()=>exportAntesDepoisPDF(estudoDepoisInfo, estudoRefItem.estudo, opsDepois, opsRef, tolDepois, tolRef)} style={{...btnR,background:"#7c3aed"}}>⎙ EXPORTAR PDF A4</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
