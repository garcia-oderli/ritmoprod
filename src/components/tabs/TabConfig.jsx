import { calcOp } from "../../utils/calculations";
import { fmt } from "../../utils/formatters";
import { gerarTemplateXLS, importarXLS } from "../../utils/export/exportExcel";
import { exportarEstudosJSON, importarEstudosJSON } from "../../utils/export/exportJSON";
import { ST, Empty } from "../UI";

export default function TabConfig({
  estudo, setEstudo, operacoes, setOperacoes, novaOp, setNovaOp, novaFr, setNovaFr,
  estudos, setEstudos, importRef, configJsonImportRef, importInfo, setImportInfo, jsonInfo, setJsonInfo,
  claudeApiKey, setClaudeApiKey,
  C, lbl, inp, btnR, addOp, delOp, metaOk, showToast, doBackupDownload, backupPendente,
  duplicarEstudo
}) {
  return (
    <div>
      <ST C={C}>IMPORTAR DADOS</ST>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        {/* XLS - Esquerda */}
        <div style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:10,padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
          <p style={{margin:"0 0 8px",fontSize:12,fontWeight:600,color:C.txt}}>Planilha XLS</p>
          <p style={{margin:"0 0 12px",fontSize:10,color:C.muted,lineHeight:1.5}}>
            Importe tempos coletados. Baixe o template padrão.
          </p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:importInfo?12:0}}>
            <button onClick={gerarTemplateXLS} style={{...btnR,background:"transparent",border:`1px solid ${C.brd}`,color:C.txt,fontSize:9,padding:"5px 10px"}}>↓ TEMPLATE</button>
            <button onClick={()=>importRef.current?.click()} style={{...btnR,fontSize:9,padding:"5px 10px"}}>↑ IMPORTAR</button>
            <input ref={importRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f){importarXLS(f,setEstudo,setOperacoes,setImportInfo);e.target.value="";}}}/>
          </div>
          {importInfo&&(
            <div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 12px",background:importInfo.ok?"rgba(34,197,94,0.08)":"rgba(239,68,68,0.08)",border:`1px solid ${importInfo.ok?"rgba(34,197,94,0.25)":"rgba(239,68,68,0.25)"}`,borderRadius:6,fontSize:9,color:importInfo.ok?C.grn:"#f87171"}}>
              <span style={{fontWeight:700}}>{importInfo.ok?"✓":"✗"}</span>
              <span style={{flex:1}}>{importInfo.msg}</span>
              <button onClick={()=>setImportInfo(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12,padding:0}}>×</button>
            </div>
          )}
        </div>

        {/* JSON - Direita */}
        <div style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:10,padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
          <p style={{margin:"0 0 8px",fontSize:12,fontWeight:600,color:C.txt}}>Backup JSON</p>
          <p style={{margin:"0 0 12px",fontSize:10,color:C.muted,lineHeight:1.5}}>
            Salve/restaure todos os estudos. Backup completo.
          </p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:jsonInfo?12:0}}>
            <button onClick={()=>exportarEstudosJSON(estudos)} disabled={estudos.length===0} style={{...btnR,background:"transparent",border:`1px solid ${C.brd}`,color:C.txt,fontSize:9,padding:"5px 10px",opacity:estudos.length===0?0.4:1,cursor:estudos.length===0?"not-allowed":"pointer"}}>↓ EXPORTAR</button>
            <button onClick={()=>configJsonImportRef.current?.click()} style={{...btnR,fontSize:9,padding:"5px 10px"}}>↑ IMPORTAR</button>
            <input ref={configJsonImportRef} type="file" accept=".json" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f){importarEstudosJSON(f,setEstudos,setJsonInfo);e.target.value="";}}}/>
          </div>
          {jsonInfo&&(
            <div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 12px",background:jsonInfo.ok?"rgba(34,197,94,0.08)":"rgba(239,68,68,0.08)",border:`1px solid ${jsonInfo.ok?"rgba(34,197,94,0.25)":"rgba(239,68,68,0.25)"}`,borderRadius:6,fontSize:9,color:jsonInfo.ok?C.grn:"#f87171"}}>
              <span style={{fontWeight:700}}>{jsonInfo.ok?"✓":"✗"}</span>
              <span style={{flex:1}}>{jsonInfo.msg}</span>
              <button onClick={()=>setJsonInfo(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12,padding:0}}>×</button>
            </div>
          )}
        </div>
      </div>
      <ST C={C}>DADOS DO ESTUDO</ST>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
        <button onClick={duplicarEstudo} title="Cria uma cópia deste estudo com nome v2, v3… para comparar no módulo Antes/Depois"
          style={{...btnR,background:"#0369a1",fontSize:10,padding:"7px 16px"}}>⧉ DUPLICAR ESTUDO</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:12,marginBottom:24}}>
        {[{k:"nome",l:"OPERAÇÃO / ÁREA"},{k:"produto",l:"PRODUTO"},{k:"analista",l:"ANALISTA"},{k:"data",l:"DATA"}].map(f=>(
          <div key={f.k}><label style={lbl}>{f.l}</label><input value={estudo[f.k]} onChange={e=>setEstudo(s=>({...s,[f.k]:e.target.value}))} style={inp}/></div>
        ))}
        <div><label style={lbl}>TOLERÂNCIA / FADIGA (%)</label><input type="number" min={0} max={50} value={estudo.tolerancia} onChange={e=>setEstudo(s=>({...s,tolerancia:+e.target.value}))} style={inp}/></div>
        <div><label style={lbl}>META DE OBSERVAÇÕES</label><input type="number" min={1} max={100} value={estudo.metasObs} onChange={e=>setEstudo(s=>({...s,metasObs:+e.target.value}))} style={inp}/></div>
        <div><label style={lbl}>TAKT TIME (s)</label><input type="number" min={0} step={0.1} value={estudo.taktTime||""} placeholder="Ex: 45" onChange={e=>setEstudo(s=>({...s,taktTime:+e.target.value}))} style={inp}/></div>
        <div><label style={lbl}>TEMPO DISPONÍVEL (min/turno)</label><input type="number" min={0} value={estudo.tempoDisp||""} placeholder="Ex: 480" onChange={e=>setEstudo(s=>({...s,tempoDisp:+e.target.value}))} style={inp}/></div>
        <div><label style={lbl}>PEÇAS PRODUZIDAS</label><input type="number" min={0} value={estudo.pecasProduzidas||""} placeholder="0" onChange={e=>setEstudo(s=>({...s,pecasProduzidas:+e.target.value}))} style={inp}/></div>
        <div><label style={lbl}>PEÇAS REJEITADAS</label><input type="number" min={0} value={estudo.pecasRejeitadas||""} placeholder="0" onChange={e=>setEstudo(s=>({...s,pecasRejeitadas:+e.target.value}))} style={inp}/></div>
      </div>
      {/* ── Integração Claude ── */}
      <ST C={C}>INTEGRAÇÃO COM CLAUDE (ANÁLISE IA)</ST>
      <div style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:10,padding:"18px 20px",marginBottom:24,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
        <p style={{margin:"0 0 12px",fontSize:11,color:C.muted,lineHeight:1.5}}>
          Obtenha análises inteligentes do seu estudo usando Claude. Identifique gargalos, desequilíbrios e recomendações de melhoria.
        </p>
        <div><label style={lbl}>API KEY ANTHROPIC</label><input type="password" value={claudeApiKey} onChange={e=>{setClaudeApiKey(e.target.value);localStorage.setItem('claudeApiKey',e.target.value);}} placeholder="sk-ant-..." style={inp}/></div>
        <p style={{margin:"12px 0 0",fontSize:9,color:C.muted,fontStyle:"italic"}}>Obtenha sua chave em <strong>console.anthropic.com</strong>. Salva localmente no navegador.</p>
      </div>
      {/* ── Calculadora de Takt Time ── */}
      <ST C={C}>CALCULADORA DE TAKT TIME</ST>
      <div style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:10,padding:"18px 20px",marginBottom:24,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
        <p style={{margin:"0 0 4px",fontSize:11,color:C.muted}}>
          Digite a <strong style={{color:C.txt}}>quantidade a produzir</strong> para descobrir o Takt Time necessário.
        </p>
        <p style={{margin:"0 0 14px",fontSize:10,color:C.muted,fontStyle:"italic"}}>
          Takt Time = Tempo Disponível (s) ÷ Quantidade (peças)
        </p>
        {/* Quantidade — campo principal */}
        <div style={{marginBottom:12}}>
          <label style={{...lbl,fontSize:10,letterSpacing:1}}>QUANTIDADE A PRODUZIR (peças/dia)</label>
          <input
            type="number" min={1} value={estudo.calcTaktDem||""} placeholder="Ex: 2500"
            onChange={e=>setEstudo(s=>({...s,calcTaktDem:e.target.value}))}
            style={{...inp,fontSize:20,fontWeight:700,height:44,textAlign:"center"}}
          />
        </div>
        {/* Tempo disponível — campo secundário */}
        <div style={{marginBottom:14}}>
          <label style={{...lbl,fontSize:10,letterSpacing:1}}>TEMPO DISPONÍVEL (s/dia)</label>
          <input
            type="number" min={0} value={estudo.calcTaktTD||""} placeholder="Ex: 31680"
            onChange={e=>setEstudo(s=>({...s,calcTaktTD:e.target.value}))}
            style={{...inp,fontSize:13}}
          />
          {estudo.tempoDisp>0&&!estudo.calcTaktTD&&(
            <button onClick={()=>setEstudo(s=>({...s,calcTaktTD:String(estudo.tempoDisp*60)}))}
              style={{marginTop:4,background:"none",border:"none",color:C.red,fontSize:10,cursor:"pointer",padding:0,textDecoration:"underline"}}>
              usar {(estudo.tempoDisp*60).toLocaleString("pt-BR")} s (do estudo)
            </button>
          )}
        </div>
        {/* Resultado */}
        {(()=>{
          const tdVal=parseFloat(estudo.calcTaktTD), dem=parseFloat(estudo.calcTaktDem);
          if(!dem||dem<=0||!tdVal||tdVal<=0) return (
            <div style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>
              {!dem?"Informe a quantidade para calcular.":"Informe o tempo disponível para calcular."}
            </div>
          );
          const tt=tdVal/dem;
          const pecasH=Math.floor(3600/tt);
          return (
            <div style={{background:`rgba(34,197,94,0.07)`,border:`1px solid rgba(34,197,94,0.3)`,borderRadius:8,padding:"16px 18px",boxShadow:"0 2px 8px rgba(34,197,94,0.1)"}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:1,marginBottom:6}}>TAKT TIME NECESSÁRIO</div>
              <div style={{display:"flex",alignItems:"baseline",gap:10,flexWrap:"wrap",marginBottom:6}}>
                <span style={{fontSize:36,fontWeight:900,color:C.grn,lineHeight:1}}>{tt.toFixed(2)}</span>
                <span style={{fontSize:16,color:C.muted}}>s / peça</span>
                <span style={{fontSize:12,color:C.muted,marginLeft:"auto"}}>{pecasH} pçs/h</span>
              </div>
              <div style={{fontSize:11,color:C.muted,marginBottom:12}}>
                {tdVal.toLocaleString("pt-BR")} s ÷ {dem.toLocaleString("pt-BR")} pçs = <strong style={{color:C.txt}}>{tt.toFixed(3)} s/peça</strong>
              </div>
              <button
                onClick={()=>setEstudo(s=>({...s,taktTime:parseFloat(tt.toFixed(2))}))}
                style={{...btnR,fontSize:11,padding:"7px 18px"}}
              >
                ✓ APLICAR {tt.toFixed(2)} s NO ESTUDO
              </button>
            </div>
          );
        })()}
      </div>
      <ST C={C}>OPERAÇÕES A CRONOMETRAR</ST>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <input value={novaOp} onChange={e=>setNovaOp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addOp()} placeholder="Nome da operação… (Enter)" style={{...inp,flex:1,minWidth:140}}/>
        <div style={{display:"flex",alignItems:"center",gap:6}}><label style={{...lbl,margin:0,whiteSpace:"nowrap"}}>FR%</label><input type="number" min={50} max={150} step={5} value={novaFr} onChange={e=>setNovaFr(+e.target.value)} style={{...inp,width:70,textAlign:"center"}}/></div>
        <button onClick={addOp} style={btnR}>+ ADD</button>
      </div>
      {operacoes.length===0?<Empty C={C}>NENHUMA OPERAÇÃO CADASTRADA</Empty>:
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {operacoes.map((op,i)=>{const c=calcOp(op,estudo.tolerancia);return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:C.card,border:`1px solid ${C.brd}`,borderLeft:`4px solid ${C.red}`,borderRadius:4,padding:"10px 14px",flexWrap:"wrap"}}>
              <span style={{fontSize:10,color:C.red,fontWeight:900,minWidth:36}}>OP{i+1}</span>
              <span style={{flex:1,fontSize:13,fontWeight:700,minWidth:80}}>{op.nome}</span>
              <span style={{fontSize:10,color:C.muted}}>FR {op.fr}%</span>
              <span style={{fontSize:10,fontWeight:700,color:metaOk(op)?C.grn:C.muted}}>{metaOk(op)?"✓ ":""}{op.tempos.length}/{estudo.metasObs} obs</span>
              {(op.paradas||[]).length>0&&<span style={{fontSize:10,color:C.ylw}}>⏸ {op.paradas.length}</span>}
              {c&&<span style={{fontSize:10,color:C.red,fontWeight:900}}>TP {fmt(c.tpVal)}</span>}
              <button onClick={()=>delOp(i)} style={{background:"none",border:"none",color:C.brd,cursor:"pointer",fontSize:16,padding:"0 2px"}}>×</button>
            </div>
          );})}
        </div>
      }
      <div style={{marginTop:20,padding:"12px 16px",background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,fontSize:10,color:C.muted,lineHeight:2}}>
        <strong style={{color:C.txt}}>FÓRMULAS: </strong>TN = TO × FR/100 · TP = TN × (1+{estudo.tolerancia}%) · Cap/h = 3600÷TP(s)
      </div>
    </div>
  );
}
