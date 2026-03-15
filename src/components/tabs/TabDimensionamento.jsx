import { calcOp } from "../../utils/calculations";
import { fmt } from "../../utils/formatters";
import { exportDimensionamento } from "../../utils/export/exportDimensionamento";
import { ST, Empty } from "../UI";

export default function TabDimensionamento({
  estudo, operacoes, opsAtuais, setOpsAtuais, C, lbl, inp, btnR
}) {
  const taktMs = (estudo.taktTime || 0) * 1000;
  const opsComTP = operacoes.map((op, i) => { const c = calcOp(op, estudo.tolerancia); return c ? { i, nome: op.nome, tp: c.tpVal } : null; }).filter(Boolean);

  if (!taktMs) return <Empty C={C}>DEFINA O TAKT TIME NA ABA CONFIG PARA USAR ESTA FERRAMENTA</Empty>;
  if (!opsComTP.length) return <Empty C={C}>COLETE DADOS DAS OPERAÇÕES PARA CALCULAR O DIMENSIONAMENTO</Empty>;

  const somaTP = opsComTP.reduce((s, o) => s + o.tp, 0);
  const opsIdealExato = somaTP / taktMs;
  const opsIdeal = Math.ceil(opsIdealExato);
  const efIdeal = (opsIdealExato / opsIdeal) * 100;
  const opsAtual = parseInt(opsAtuais) || 0;
  const diff = opsAtual > 0 ? opsAtual - opsIdeal : null;
  const status = diff == null ? null : diff === 0 ? "ok" : diff > 0 ? "excesso" : "falta";
  const statusCor = status === "ok" ? C.grn : status === "excesso" ? C.ylw : C.red;

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:8}}>
        <ST C={C} style={{margin:0}}>QUANTOS OPERADORES PRECISO?</ST>
        <button
          onClick={()=>exportDimensionamento(estudo,operacoes,estudo.tolerancia,opsAtuais)}
          style={{...btnR,fontSize:11,padding:"6px 16px"}}
        >🖨 IMPRIMIR / PDF</button>
      </div>

      {/* Fórmula */}
      <div style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:10,padding:"20px",marginBottom:16}}>
        <div style={{fontSize:12,color:C.muted,marginBottom:16,lineHeight:1.8}}>
          <strong style={{color:C.txt,fontSize:13}}>Fórmula: N° operadores = Σ TP ÷ Takt Time</strong><br/>
          <span style={{fontFamily:"monospace",fontSize:11}}>
            {(somaTP/1000).toFixed(2)} s ÷ {(taktMs/1000).toFixed(2)} s = <strong style={{color:C.txt}}>{opsIdealExato.toFixed(3)}</strong> → arredonda para cima = <strong style={{color:C.grn,fontSize:16}}>{opsIdeal}</strong>
          </span>
        </div>

        {/* Cards principais */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:20}}>
          {[
            {l:"OPERADORES NECESSÁRIOS",v:opsIdeal,sub:`Exato: ${opsIdealExato.toFixed(2)}`,c:C.grn,big:true},
            {l:"EFICIÊNCIA COM ESSE Nº",v:`${efIdeal.toFixed(1)}%`,sub:efIdeal>=95?"Ótimo":efIdeal>=80?"Bom":efIdeal>=65?"Aceitável":"Baixa",c:efIdeal>=80?C.grn:efIdeal>=65?C.ylw:C.red},
            {l:"Σ TEMPO PADRÃO (todas ops)",v:fmt(somaTP),sub:`${opsComTP.length} operação(ões)`,c:C.txt},
            {l:"TAKT TIME CONFIGURADO",v:fmt(taktMs),sub:"ritmo exigido",c:C.ylw},
          ].map(k=>(
            <div key={k.l} style={{background:C.bg,border:`1px solid ${C.brd}`,borderLeft:`4px solid ${k.c}`,borderRadius:"0 8px 8px 0",padding:"14px 16px"}}>
              <div style={{fontSize:8,color:C.muted,letterSpacing:1,marginBottom:6}}>{k.l}</div>
              <div style={{fontSize:k.big?32:20,fontWeight:900,color:k.c,lineHeight:1}}>{k.v}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:4}}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Detalhamento por operação */}
        <div style={{borderTop:`1px solid ${C.brd}`,paddingTop:14,marginBottom:16}}>
          <div style={{fontSize:9,color:C.muted,letterSpacing:1,marginBottom:10}}>CONTRIBUIÇÃO DE CADA OPERAÇÃO</div>
          {opsComTP.map((op, i) => {
            const contrib = op.tp / taktMs;
            const pct = (op.tp / somaTP) * 100;
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,fontSize:11}}>
                <span style={{color:C.muted,width:28,flexShrink:0,fontSize:9}}>OP{op.i+1}</span>
                <span style={{width:150,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={op.nome}>{op.nome}</span>
                <span style={{color:C.txt,width:52,flexShrink:0,textAlign:"right",fontFamily:"monospace"}}>{fmt(op.tp)}</span>
                <div style={{flex:1,background:C.brd,borderRadius:3,height:6}}>
                  <div style={{height:"100%",width:`${pct}%`,background:C.red,borderRadius:3}}/>
                </div>
                <span style={{color:C.muted,fontSize:9,width:60,textAlign:"right",flexShrink:0}}>{contrib.toFixed(2)} ops</span>
              </div>
            );
          })}
        </div>

        {/* Comparador: operadores atuais */}
        <div style={{borderTop:`1px solid ${C.brd}`,paddingTop:16}}>
          <label style={{...lbl,fontSize:10}}>QUANTOS OPERADORES VOCÊ TEM HOJE?</label>
          <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap",marginTop:6}}>
            <input
              type="number" min={1} value={opsAtuais}
              placeholder={String(opsIdeal)}
              onChange={e=>setOpsAtuais(e.target.value)}
              style={{...inp,width:100,fontSize:24,fontWeight:900,textAlign:"center",height:52}}
            />
            {opsAtual > 0 && (()=>{
              const efAtual = (opsIdealExato / opsAtual) * 100;
              const msgs = {
                ok:      {titulo:"Dimensionamento correto",detalhe:`Você tem exatamente o número ideal. Eficiência: ${efIdeal.toFixed(1)}%.`},
                falta:   {titulo:`Faltam ${Math.abs(diff)} operador${Math.abs(diff)>1?"es":""}`,detalhe:`Tem ${opsAtual}, precisa de ${opsIdeal}. A linha não conseguirá atender a demanda — eficiência teórica: ${efAtual.toFixed(1)}%.`},
                excesso: {titulo:`Sobram ${diff} operador${diff>1?"es":""}`,detalhe:`Tem ${opsAtual}, precisa de ${opsIdeal}. Operadores ociosos — eficiência: ${efAtual.toFixed(1)}%. Considere realocar ou reduzir o takt.`},
              }[status];
              return (
                <div style={{flex:1,minWidth:200,background:`${statusCor}14`,border:`1px solid ${statusCor}50`,borderRadius:8,padding:"14px 18px"}}>
                  <div style={{fontSize:16,fontWeight:900,color:statusCor,marginBottom:6}}>
                    {status==="ok"?"✓":status==="falta"?"▼":"▲"} {msgs.titulo}
                  </div>
                  <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>{msgs.detalhe}</div>
                  {/* Barra comparativa */}
                  <div style={{marginTop:14}}>
                    <div style={{display:"flex",gap:16,fontSize:9,color:C.muted,marginBottom:4}}>
                      <span style={{color:C.grn}}>▮ necessário: {opsIdeal}</span>
                      <span style={{color:statusCor}}>▮ atual: {opsAtual}</span>
                    </div>
                    <div style={{position:"relative",height:14,background:C.bg,borderRadius:7,overflow:"hidden"}}>
                      <div style={{position:"absolute",inset:0,width:`${(Math.min(opsIdeal,opsAtual)/Math.max(opsIdeal,opsAtual))*100}%`,background:statusCor==="ok"?C.grn:statusCor,opacity:0.7,borderRadius:7}}/>
                      {opsAtual<opsIdeal&&<div style={{position:"absolute",inset:0,left:`${(opsAtual/opsIdeal)*100}%`,background:`${C.red}55`,borderRadius:"0 7px 7px 0"}}/>}
                      <div style={{position:"absolute",top:0,bottom:0,left:`${(opsIdeal/Math.max(opsIdeal,opsAtual))*100}%`,width:2,background:C.grn,zIndex:2}}/>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
