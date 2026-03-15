import { calcOp } from "../../utils/calculations";
import { fmt, fmtM } from "../../utils/formatters";
import { MOTIVOS } from "../../constants/theme";
import { ST } from "../UI";

export default function TabCaptura({
  operacoes, setOperacoes, estudo, opAtiva, capturing, pausado, elapsed, lastTap,
  pausaElapsed, pausaMotivo, setPausaMotivo, pausaObs, setPausaObs,
  modoSeq, setModoSeq, seqAguardando, C, lbl, inp, btnR,
  iniciarCaptura, pararCaptura, iniciarProxima, cancelarSeq, iniciarSequencial,
  handleTap, iniciarPausa, finalizarPausa, delTempo, delParada,
  marcarRodada2, desmarcarRodada2, metaOk
}) {
  const opAtual = opAtiva !== null ? operacoes[opAtiva] : null;
  const tempoAtual = elapsed - lastTap;

  return (
    <div>
      {operacoes.length === 0 ? <div style={{padding:"64px 24px",textAlign:"center",color:C.muted,fontSize:12,letterSpacing:1,border:`1px dashed ${C.brd}`,borderRadius:12,background:C.bg}}>CADASTRE OPERAÇÕES NA CONFIG</div>
      : capturing && opAtual ? (
        <div>
          <div style={{textAlign:"center",marginBottom:12}}>
            <div style={{fontSize:9,color:C.muted,letterSpacing:4}}>{pausado?"LINHA PAUSADA":"COLETANDO"}</div>
            <div style={{fontSize:18,fontWeight:900,marginTop:4,color:pausado?C.ylw:C.txt}}>OP{opAtiva+1} — {opAtual.nome}</div>
            <div style={{fontSize:9,letterSpacing:3,marginTop:4,color:C.red}}>{opAtual.tempos.length}/{estudo.metasObs} OBS · {(opAtual.paradas||[]).length} PARADA(S)</div>
          </div>
          <div style={{height:7,background:C.brd,borderRadius:4,marginBottom:16,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${Math.min(100,(opAtual.tempos.length/estudo.metasObs)*100)}%`,background:metaOk(opAtual)?C.grn:C.red,borderRadius:4,transition:"width 0.3s"}}/>
          </div>
          {pausado ? (
            <div style={{background:"rgba(245,158,11,0.08)",border:`2px solid ${C.ylw}`,borderRadius:8,padding:"18px",marginBottom:12}}>
              <div style={{textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:9,color:C.ylw,letterSpacing:4,marginBottom:4}}>⏸ LINHA PARADA</div>
                <div style={{fontSize:44,fontWeight:900,color:C.ylw,fontVariantNumeric:"tabular-nums"}}>{fmtM(pausaElapsed)}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <div><label style={lbl}>MOTIVO DA PARADA</label><select value={pausaMotivo} onChange={e=>setPausaMotivo(e.target.value)} style={{...inp,cursor:"pointer"}}>{MOTIVOS.map(m=><option key={m}>{m}</option>)}</select></div>
                <div><label style={lbl}>OBSERVAÇÃO (opcional)</label><input value={pausaObs} onChange={e=>setPausaObs(e.target.value)} placeholder="Detalhar…" style={inp}/></div>
              </div>
              <button onClick={finalizarPausa} style={{...btnR,width:"100%",padding:"14px",fontSize:11,background:C.grn,letterSpacing:3}}>▶ RETOMAR PRODUÇÃO</button>
            </div>
          ) : (
            <div>
              <div style={{textAlign:"center",marginBottom:14,padding:"20px",background:C.card,border:`1px solid ${C.brd}`,borderRadius:8}}>
                <div style={{fontSize:9,color:C.muted,letterSpacing:4,marginBottom:6}}>TEMPO ATUAL</div>
                <div style={{fontSize:60,fontWeight:900,letterSpacing:2,color:C.txt,fontVariantNumeric:"tabular-nums",lineHeight:1}}>{(tempoAtual/1000).toFixed(2)}s</div>
                <div style={{fontSize:9,color:C.muted,marginTop:6,letterSpacing:2}}>ACUMULADO {(elapsed/1000).toFixed(1)}s · FR {opAtual.fr}%</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
                {(opAtual.rodada2Inicio!=null)&&<div style={{textAlign:"center",padding:"4px 0",fontSize:9,fontWeight:900,letterSpacing:3,color:opAtual.tempos.length>=opAtual.rodada2Inicio?C.ylw:C.grn}}>● {opAtual.tempos.length>=opAtual.rodada2Inicio?"RODADA 2":"RODADA 1"}</div>}
                <button onClick={handleTap} style={{padding:"32px 0",background:C.red,border:"none",borderRadius:8,color:"#fff",fontSize:15,fontWeight:900,letterSpacing:4,fontFamily:"inherit",cursor:"pointer",textTransform:"uppercase",boxShadow:`0 8px 24px ${C.red}44`,userSelect:"none"}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
                  ● REG #{opAtual.tempos.length+1}
                </button>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={iniciarPausa} style={{flex:1,padding:"12px",background:"rgba(245,158,11,0.15)",border:`1px solid ${C.ylw}`,borderRadius:8,color:C.ylw,fontSize:11,fontWeight:700,fontFamily:"inherit",cursor:"pointer",letterSpacing:1,userSelect:"none"}}>⏸ PAUSAR (P)</button>
                  <button onClick={pararCaptura} style={{padding:"14px 22px",background:"rgba(220,38,38,0.15)",border:`2px solid #dc2626`,borderRadius:8,color:"#dc2626",fontSize:12,fontWeight:700,letterSpacing:2,fontFamily:"inherit",cursor:"pointer"}}>■ FIM</button>
                </div>
                <div style={{fontSize:9,color:C.muted,textAlign:"center",letterSpacing:1}}>ESPAÇO = registrar · P = pausar/retomar · ESC = parar</div>
              </div>
            </div>
          )}
          {opAtual.tempos.length > 0 && (()=>{
            const r2i = opAtual.rodada2Inicio;
            const items = opAtual.tempos.map((t,i)=>{
              const isR2Start = r2i!=null && i===r2i;
              const rodada = r2i!=null?(i<r2i?1:2):null;
              return [isR2Start, rodada, t, i];
            });
            return (
              <div style={{marginBottom:10}}>
                {r2i!=null&&<div style={{fontSize:9,color:C.grn,letterSpacing:2,fontWeight:700,marginBottom:4}}>RODADA 1 ({r2i} obs)</div>}
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {items.map(([isR2Start,rodada,t,i])=>[
                    isR2Start&&<div key={`sep-${i}`} style={{width:"100%",display:"flex",alignItems:"center",gap:8,margin:"4px 0"}}><div style={{flex:1,height:1,background:C.ylw,opacity:0.4}}/><span style={{fontSize:9,color:C.ylw,fontWeight:900,letterSpacing:2,whiteSpace:"nowrap"}}>⚑ RODADA 2 ({opAtual.tempos.length-r2i} obs)</span><div style={{flex:1,height:1,background:C.ylw,opacity:0.4}}/></div>,
                    <div key={i} style={{background:C.bg,border:`1px solid ${rodada===2?C.ylw:C.brd}`,borderRadius:3,padding:"4px 9px",fontSize:10,fontVariantNumeric:"tabular-nums",display:"flex",alignItems:"center",gap:5}}>
                      {rodada&&<span style={{fontSize:7,fontWeight:900,color:rodada===2?C.ylw:C.grn}}>R{rodada}</span>}
                      <span style={{color:C.muted,fontSize:8}}>#{i+1}</span>
                      <span style={{fontWeight:700}}>{fmt(t)}</span>
                      <button onClick={()=>delTempo(opAtiva,i)} style={{background:"none",border:"none",color:C.brd,cursor:"pointer",fontSize:10,padding:0}}>×</button>
                    </div>
                  ])}
                </div>
                {r2i!=null&&<button onClick={()=>desmarcarRodada2(opAtiva)} style={{marginTop:6,background:"none",border:"none",color:C.muted,fontSize:9,cursor:"pointer",padding:0,textDecoration:"underline"}}>remover marcação de rodada</button>}
              </div>
            );
          })()}
          {(opAtual.paradas||[]).length>0&&<div style={{background:"rgba(245,158,11,0.08)",border:`1px solid rgba(245,158,11,0.25)`,borderRadius:6,padding:"10px 14px",marginBottom:10}}><div style={{fontSize:9,color:C.ylw,letterSpacing:2,marginBottom:6,fontWeight:900}}>PARADAS REGISTRADAS</div><div style={{display:"flex",flexDirection:"column",gap:4}}>{opAtual.paradas.map((p,pi)=><div key={pi} style={{display:"flex",alignItems:"center",gap:8,fontSize:10,flexWrap:"wrap"}}><span style={{color:C.ylw,fontWeight:900}}>⏸</span><span style={{fontWeight:700}}>{p.motivo}</span><span style={{color:C.muted}}>—</span><span>{fmtM(p.duracao)}</span>{p.obs&&<span style={{color:C.muted,fontStyle:"italic"}}>"{p.obs}"</span>}<button onClick={()=>delParada(opAtiva,pi)} style={{background:"none",border:"none",color:C.brd,cursor:"pointer",fontSize:10,padding:0,marginLeft:"auto"}}>×</button></div>)}</div></div>}
          {metaOk(opAtual)&&!pausado&&<div style={{background:"rgba(34,197,94,0.08)",border:"1px solid #a9dfbf",borderRadius:6,padding:"10px",fontSize:11,color:C.grn,fontWeight:700,marginBottom:10,textAlign:"center",letterSpacing:2}}>✓ META ATINGIDA — PODE FINALIZAR</div>}
        </div>
      ) : (seqAguardando && opAtiva !== null) ? (
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:10,color:C.grn,letterSpacing:4,marginBottom:8,fontWeight:700}}>✓ OPERAÇÃO CONCLUÍDA</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:20}}>OP{opAtiva+1} — {operacoes[opAtiva]?.nome}</div>
          <div style={{background:C.card,border:`2px solid ${C.grn}`,borderRadius:12,padding:"28px 24px",marginBottom:20}}>
            <div style={{fontSize:10,color:C.muted,letterSpacing:3,marginBottom:8}}>PRÓXIMA OPERAÇÃO</div>
            <div style={{fontSize:22,fontWeight:900,marginBottom:4,color:C.txt}}>OP{opAtiva+2} — {operacoes[opAtiva+1]?.nome}</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:20}}>FR {operacoes[opAtiva+1]?.fr}% · {operacoes[opAtiva+1]?.tempos.length} obs coletadas</div>
            <button onClick={iniciarProxima} style={{...btnR,padding:"18px 40px",fontSize:14,letterSpacing:3,boxShadow:`0 8px 24px ${C.grn}44`,background:C.grn}}>▶ INICIAR</button>
          </div>
          <button onClick={cancelarSeq} style={{background:"none",border:`1px solid ${C.brd}`,borderRadius:6,color:C.muted,cursor:"pointer",fontSize:10,padding:"8px 16px",fontFamily:"inherit"}}>■ ENCERRAR SEQUENCIAL</button>
        </div>
      ) : (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <ST C={C}>SELECIONE A OPERAÇÃO</ST>
            {operacoes.length>1&&<button onClick={iniciarSequencial} style={{...btnR,background:C.grn,padding:"8px 16px",fontSize:10}}>▶▶ MODO SEQUENCIAL</button>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {operacoes.map((op,i)=>{const c=calcOp(op,estudo.tolerancia),done=metaOk(op);return(
              <div key={i} style={{background:C.card,border:`1px solid ${done?"rgba(34,197,94,0.3)":C.brd}`,borderLeft:`5px solid ${done?C.grn:C.red}`,borderRadius:6,padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,color:done?C.grn:C.red,fontWeight:900,minWidth:36}}>OP{i+1}</span>
                  <span style={{flex:1,fontSize:14,fontWeight:900,minWidth:80}}>{op.nome}</span>
                  <span style={{fontSize:10,color:C.muted}}>FR {op.fr}%</span>
                  {(op.paradas||[]).length>0&&<span style={{fontSize:10,color:C.ylw,fontWeight:700}}>⏸ {op.paradas.length}</span>}
                  <span style={{fontSize:11,fontWeight:700,color:done?C.grn:C.muted}}>{done?"✓ ":""}{op.tempos.length}/{estudo.metasObs}</span>
                  {op.tempos.length>0&&(op.rodada2Inicio==null
                    ? <button onClick={()=>marcarRodada2(i)} title="Marcar início da Rodada 2" style={{padding:"8px 10px",background:"rgba(34,197,94,0.12)",border:`1px solid ${C.grn}`,borderRadius:6,color:C.grn,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>⚑ R2</button>
                    : <button onClick={()=>desmarcarRodada2(i)} title={`Rodada 2 a partir do obs #${op.rodada2Inicio+1} — clique para remover`} style={{padding:"8px 10px",background:"rgba(245,158,11,0.12)",border:`1px solid ${C.ylw}`,borderRadius:6,color:C.ylw,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>⚑ R2 ✕</button>
                  )}
                  {op.tempos.length>0&&<button onClick={()=>{if(window.confirm(`Apagar todos os ${op.tempos.length} tempos e paradas de "${op.nome}"?`))setOperacoes(ops=>ops.map((o,j)=>j!==i?o:{...o,tempos:[],paradas:[],rodada2Inicio:null}));}} style={{padding:"8px 10px",background:"none",border:`1px solid ${C.brd}`,borderRadius:6,color:C.muted,fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>↺</button>}
                  <button onClick={()=>iniciarCaptura(i)} style={{...btnR,background:done?C.grn:C.red,padding:"8px 14px",fontSize:10}}>{op.tempos.length>0?"▶ CONTINUAR":"▶ INICIAR"}</button>
                </div>
                <div style={{height:5,background:C.brd,borderRadius:3,overflow:"hidden",marginBottom:4}}><div style={{height:"100%",width:`${Math.min(100,(op.tempos.length/estudo.metasObs)*100)}%`,background:done?C.grn:C.red,borderRadius:3,transition:"width 0.3s"}}/></div>
                {!done&&<div style={{fontSize:9,color:C.muted,marginBottom:c?8:0}}>Faltam <b style={{color:C.ylw}}>{Math.max(0,estudo.metasObs-op.tempos.length)}</b> observações para atingir a meta</div>}
                {c&&<div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:10}}>{[{l:"TO MÉD",v:fmt(c.toMed)},{l:"TN",v:fmt(c.tnMed)},{l:"TP",v:fmt(c.tpVal),r:true},{l:"CAP/H",v:c.cap+" pçs",r:true},{l:"CV%",v:c.cvPct.toFixed(1)+"%",w:c.cvPct>20}].map(x=><span key={x.l}><span style={{color:C.muted,marginRight:3}}>{x.l}</span><strong style={{color:x.w?C.ylw:x.r?C.red:C.txt}}>{x.v}</strong></span>)}{c.nParadas>0&&<span><span style={{color:C.muted,marginRight:3}}>PARADAS</span><strong style={{color:C.ylw}}>{c.nParadas}({fmtM(c.totalParada)})</strong></span>}</div>}
              </div>
            );})}
          </div>
        </div>
      )}
    </div>
  );
}
