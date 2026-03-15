import { exportExcel } from "../../utils/export/exportExcel";
import { exportPDF } from "../../utils/export/exportPDF";
import { analisarComClaude } from "../../api/claude";
import { ST } from "../UI";

export default function TabSugestoes({
  estudo, operacoes, sugestoes, claudeAnalise, setClaudeAnalise,
  claudeCarregando, setClaudeCarregando, claudeApiKey, C, btnR, prioCor
}) {
  return (
    <div>
      {sugestoes.length > 0 ? (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:20}}>
            {[{l:"ALTA",v:sugestoes.filter(s=>s.prio==="alta").length,c:C.red},{l:"MÉDIA",v:sugestoes.filter(s=>s.prio==="media").length,c:C.ylw},{l:"BAIXA",v:sugestoes.filter(s=>s.prio==="baixa").length,c:C.grn}].map(k=><div key={k.l} style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:6,padding:"13px 15px",borderLeft:`4px solid ${k.c}`}}><div style={{fontSize:8,color:C.muted,letterSpacing:2,marginBottom:5}}>{k.l} PRIORIDADE</div><div style={{fontSize:24,fontWeight:900,color:k.c}}>{k.v}</div></div>)}
          </div>
          <ST C={C}>SUGESTÕES DE MELHORIA</ST>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:24}}>
            {sugestoes.map((s,i)=>(
              <div key={i} style={{background:C.card,border:`1px solid ${C.brd}`,borderLeft:`5px solid ${prioCor[s.prio]}`,borderRadius:6,padding:"14px 18px"}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start",flexWrap:"wrap",marginBottom:8}}>
                  <span style={{background:prioCor[s.prio],color:"#fff",padding:"2px 8px",borderRadius:3,fontSize:8,fontWeight:900,letterSpacing:2,textTransform:"uppercase",whiteSpace:"nowrap"}}>{s.prio}</span>
                  <span style={{fontSize:9,color:C.muted,background:C.bg,padding:"2px 8px",borderRadius:3,border:`1px solid ${C.brd}`}}>{s.op}</span>
                  <span style={{fontSize:13,fontWeight:900,flex:1}}>{s.titulo}</span>
                </div>
                <p style={{fontSize:12,color:C.muted,margin:"0 0 8px",lineHeight:1.6}}>{s.desc}</p>
                <div style={{background:"rgba(34,197,94,0.08)",border:`1px solid rgba(34,197,94,0.25)`,borderRadius:5,padding:"8px 12px"}}><span style={{fontSize:9,color:C.grn,fontWeight:900,marginRight:8}}>✦ AÇÃO</span><span style={{fontSize:11,color:C.grn}}>{s.acao}</span></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        operacoes.length > 0 && <div style={{padding:"20px 24px",textAlign:"center",color:C.muted,fontSize:11,letterSpacing:2,border:`2px dashed ${C.brd}`,borderRadius:8,marginBottom:20}}>✓ NENHUMA SUGESTÃO — ESTUDO EM BOA FORMA</div>
      )}
      {claudeAnalise && (
        <div style={{background:"rgba(139,92,246,0.08)",border:`1px solid rgba(139,92,246,0.3)`,borderRadius:8,padding:"16px 18px",marginBottom:20}}>
          <div style={{fontSize:10,color:"#8b5cf6",fontWeight:900,letterSpacing:2,marginBottom:12}}>🤖 ANÁLISE CLAUDE</div>
          <div style={{fontSize:12,color:C.txt,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{claudeAnalise}</div>
          <button onClick={()=>setClaudeAnalise(null)} style={{marginTop:12,background:"none",border:`1px solid rgba(139,92,246,0.3)`,borderRadius:4,color:"#8b5cf6",fontSize:10,padding:"6px 12px",cursor:"pointer"}}>✕ FECHAR</button>
        </div>
      )}
      {operacoes.length > 0 && (
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",flexWrap:"wrap"}}>
          <button onClick={()=>analisarComClaude(estudo,operacoes,estudo.tolerancia,claudeApiKey,setClaudeAnalise,setClaudeCarregando)} disabled={claudeCarregando||!claudeApiKey.trim()} style={{...btnR,background:claudeCarregando?"#999":claudeApiKey.trim()?"#8b5cf6":"#ccc",cursor:claudeCarregando?"wait":"pointer"}}>🤖 {claudeCarregando?"ANALISANDO...":"CLAUDE"}</button>
          <button onClick={()=>exportExcel(estudo,operacoes,estudo.tolerancia)} style={btnR}>↓ EXCEL</button>
          <button onClick={()=>exportPDF(estudo,operacoes,estudo.tolerancia)} style={{...btnR,background:"#1e3a6e"}}>⎙ PDF</button>
        </div>
      )}
      {operacoes.length === 0 && (
        <div style={{padding:"56px 24px",textAlign:"center",color:C.muted,fontSize:11,letterSpacing:2,border:`2px dashed ${C.brd}`,borderRadius:8}}>ADICIONE OPERAÇÕES E COLETE DADOS</div>
      )}
    </div>
  );
}
