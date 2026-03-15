import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { DARK, LIGHT, MOTIVOS } from "./constants/theme";
import { fmt, fmtM, fmtDT, fmtD } from "./utils/formatters";
import { lsLoad, lsSave, idbSaveHandle, idbLoadHandle, idbClearHandle } from "./utils/storage";
import { calcOp, gerarSugestoes, balancearLinha, calcOEE } from "./utils/calculations";
import { linReg } from "./utils/math";
import { logoDataUrl } from "./utils/export/exportUtils";
import { exportExcel } from "./utils/export/exportExcel";
import { exportPDF } from "./utils/export/exportPDF";
import { exportarEstudosJSON, exportarEstudoJSON, importarEstudosJSON } from "./utils/export/exportJSON";
import { Toast } from "./components/UI";
import TabConfig from "./components/tabs/TabConfig";
import TabCaptura from "./components/tabs/TabCaptura";
import TabRelatorio from "./components/tabs/TabRelatorio";
import TabSugestoes from "./components/tabs/TabSugestoes";
import TabPadroes from "./components/tabs/TabPadroes";
import TabYamazumi from "./components/tabs/TabYamazumi";
import TabDimensionamento from "./components/tabs/TabDimensionamento";
import TabAnteDepois from "./components/tabs/TabAnteDepois";
import TabInstrucoes from "./components/tabs/TabInstrucoes";

export default function App() {
  // ── Tema ──
  const [isDark, setIsDark] = useState(false);
  const C = isDark ? DARK : LIGHT;
  const btnR   = {background:C.red,border:"none",borderRadius:8,color:"#fff",padding:"10px 20px",fontSize:11,fontWeight:700,letterSpacing:0.5,fontFamily:"inherit",cursor:"pointer",textTransform:"uppercase",whiteSpace:"nowrap",transition:"all .15s",boxShadow:`0 4px 12px ${C.red}33`};
  const btnHdr = {background:"rgba(128,128,128,0.1)",border:`1px solid ${C.brd}`,borderRadius:6,color:C.muted,padding:"6px 14px",fontSize:10,letterSpacing:0.5,fontFamily:"inherit",cursor:"pointer",transition:"all .15s"};
  const lbl    = {display:"block",fontSize:10,letterSpacing:0.5,color:C.muted,marginBottom:6,textTransform:"uppercase",fontWeight:600};
  const inp    = {width:"100%",background:C.bg,border:`1px solid ${C.brd}`,borderRadius:8,color:C.txt,padding:"10px 14px",fontSize:13,fontFamily:"inherit",outline:"none",transition:"border-color .15s"};

  // ── Estudos list ──
  const [estudos, setEstudos]   = useState(lsLoad);
  const [estudoId, setEstudoId] = useState(null);
  const [tela, setTela]         = useState("lista"); // lista | estudo

  // ── Current study ──
  const [tab, setTab]           = useState("config");
  const [estudo, setEstudo]     = useState({nome:"",produto:"",analista:"",data:fmtD(),tolerancia:15,metasObs:10,taktTime:0,tempoDisp:0,pecasProduzidas:0,pecasRejeitadas:0,calcTaktDem:"",calcTaktTD:""});
  const [operacoes, setOperacoes] = useState([]);
  const [novaOp, setNovaOp]     = useState(""); const [novaFr, setNovaFr] = useState(100);

  // ── Capture ──
  const [opAtiva, setOpAtiva]   = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [pausado, setPausado]   = useState(false);
  const [elapsed, setElapsed]   = useState(0);
  const [lastTap, setLastTap]   = useState(0);
  const pausaInicioRef = useRef(null);
  const [pausaMotivo, setPausaMotivo] = useState(MOTIVOS[0]);
  const [pausaObs, setPausaObs] = useState("");
  const [pausaElapsed, setPausaElapsed] = useState(0);
  const [reportOp, setReportOp] = useState(null);
  const [importInfo, setImportInfo] = useState(null);
  const [jsonInfo, setJsonInfo] = useState(null);
  const startRef=useRef(null); const timerRef=useRef(null); const pausaRef=useRef(null); const importRef=useRef(null); const jsonImportRef=useRef(null); const configJsonImportRef=useRef(null);
  const fileHandleRef = useRef(null);  // File System Access API handle (pendrive)
  const [pendriveStatus, setPendriveStatus] = useState("desvinculado"); // desvinculado | salvando | salvo | erro | reconectar
  const [showWelcome, setShowWelcome] = useState(false);
  const [modoSeq, setModoSeq]           = useState(false);
  const [seqAguardando, setSeqAguardando] = useState(false);
  const [ultimoBackup, setUltimoBackup] = useState(null);
  const [backupPendente, setBackupPendente] = useState(false);
  const [comparaIds, setComparaIds]     = useState([]);
  const [opsAtuais, setOpsAtuais]       = useState("");   // Dimensionamento: operadores atuais
  const [antesDepoisRef, setAntesDepoisRef] = useState("");  // ID do estudo de referência para Antes/Depois
  const [antesDepoisDepoisId, setAntesDepoisDepoisId] = useState("");  // ID do estudo DEPOIS (padrão = estudo atual)
  const [claudeApiKey, setClaudeApiKey] = useState(() => { try { return localStorage.getItem('claudeApiKey') || ""; } catch { return ""; } });
  const [claudeAnalise, setClaudeAnalise] = useState(null);
  const [claudeCarregando, setClaudeCarregando] = useState(false);

  // ── Auto-save ──
  useEffect(()=>{
    if(!estudoId) return;
    setEstudos(prev=>{
      const next=prev.map(e=>e.id===estudoId?{...e,estudo,operacoes,updatedAt:fmtDT()}:e);
      lsSave(next); return next;
    });
  },[estudo,operacoes]);

  // ── Timers ──
  useEffect(()=>{
    if(capturing&&!pausado){startRef.current=Date.now()-elapsed;timerRef.current=setInterval(()=>setElapsed(Date.now()-startRef.current),50);}
    else clearInterval(timerRef.current);
    return ()=>clearInterval(timerRef.current);
  },[capturing,pausado]);

  useEffect(()=>{
    if(pausado){const s=Date.now();pausaRef.current=setInterval(()=>setPausaElapsed(Date.now()-s),100);}
    else{clearInterval(pausaRef.current);setPausaElapsed(0);}
    return ()=>clearInterval(pausaRef.current);
  },[pausado]);

  // ── Backup manual via botão ──
  const estudosRef = useRef(estudos);
  useEffect(()=>{ estudosRef.current = estudos; },[estudos]);
  const doBackupDownload = useCallback(()=>{
    const d=estudosRef.current; if(!d.length) return;
    const blob=new Blob([JSON.stringify(d,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url;
    a.download="ritmoprod-dados.json";
    a.click(); URL.revokeObjectURL(url);
    setUltimoBackup(new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}));
    setBackupPendente(false);
  },[]);
  // Marca pendente sempre que dados mudam
  useEffect(()=>{
    if(!estudos.length) return;
    setBackupPendente(true);
  },[estudos]);

  // ── Aviso ao fechar com dados não salvos ──
  useEffect(()=>{
    const onUnload = e => {
      if(!backupPendente) return;
      e.preventDefault();
      e.returnValue = "Você tem dados não salvos! Exporte o JSON antes de sair.";
    };
    window.addEventListener("beforeunload", onUnload);
    return ()=>window.removeEventListener("beforeunload", onUnload);
  },[backupPendente]);

  // ── Auto-save no pendrive (File System Access API) ──
  const salvarNoPendrive = useCallback(async (dados) => {
    if (!fileHandleRef.current) return;
    try {
      setPendriveStatus("salvando");
      const writable = await fileHandleRef.current.createWritable();
      await writable.write(JSON.stringify(dados, null, 2));
      await writable.close();
      setPendriveStatus("salvo");
    } catch { setPendriveStatus("erro"); }
  }, []);

  useEffect(() => {
    if (!fileHandleRef.current || !estudos.length) return;
    const id = setTimeout(() => salvarNoPendrive(estudos), 1500);
    return () => clearTimeout(id);
  }, [estudos, salvarNoPendrive]);

  const vincularPendrive = async () => {
    if (!("showSaveFilePicker" in window)) return alert("Seu navegador não suporta acesso a arquivos.\nUse Chrome ou Edge.");
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: "ritmoprod-dados.json",
        types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
      });
      fileHandleRef.current = handle;
      await idbSaveHandle(handle);
      setPendriveStatus("salvando");
      await salvarNoPendrive(estudos);
    } catch { /* usuário cancelou */ }
  };

  const carregarDoPendrive = async () => {
    if (!("showOpenFilePicker" in window)) return alert("Seu navegador não suporta acesso a arquivos.\nUse Chrome ou Edge.");
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
      });
      const file = await handle.getFile();
      const text = await file.text();
      const dados = JSON.parse(text);
      if (!Array.isArray(dados)) throw new Error("Formato inválido");
      const next = dados.map(e => ({ ...e, id: e.id || Date.now().toString() }));
      setEstudos(next); lsSave(next);
      fileHandleRef.current = handle;
      await idbSaveHandle(handle);
      setPendriveStatus("salvo");
      setJsonInfo({ ok: true, msg: `${next.length} estudo(s) carregado(s) do pendrive. Auto-save ativado.` });
    } catch (err) {
      if (err.name !== "AbortError") setJsonInfo({ ok: false, msg: "Erro ao carregar arquivo: " + err.message });
    }
  };

  // ── Reconexão automática ao abrir o app ──
  useEffect(() => {
    (async () => {
      if (!("showSaveFilePicker" in window)) return;
      const handle = await idbLoadHandle();
      if (!handle) { setShowWelcome(true); return; }
      try {
        // verifica permissão (pode precisar de clique do usuário em alguns casos)
        const perm = await handle.queryPermission({ mode: "readwrite" });
        if (perm === "granted") {
          fileHandleRef.current = handle;
          // carrega dados do arquivo
          const file = await handle.getFile();
          const text = await file.text();
          const dados = JSON.parse(text);
          if (Array.isArray(dados) && dados.length) {
            setEstudos(dados); lsSave(dados);
          }
          setPendriveStatus("salvo");
        } else {
          // permissão precisa de gesto do usuário — guarda handle mas aguarda
          fileHandleRef.current = handle;
          setPendriveStatus("reconectar");
        }
      } catch { await idbClearHandle(); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reconectarPendrive = async () => {
    const handle = fileHandleRef.current;
    if (!handle) return;
    try {
      const perm = await handle.requestPermission({ mode: "readwrite" });
      if (perm !== "granted") return;
      const file = await handle.getFile();
      const text = await file.text();
      const dados = JSON.parse(text);
      if (Array.isArray(dados) && dados.length) { setEstudos(dados); lsSave(dados); }
      setPendriveStatus("salvo");
      setJsonInfo({ ok: true, msg: `${dados.length} estudo(s) carregado(s) do pendrive. Auto-save ativado.` });
    } catch { setPendriveStatus("erro"); }
  };

  // ── Study CRUD ──
  const novoEstudo = () => {
    const id=Date.now().toString();
    const e={nome:"",produto:"",analista:"",data:fmtD(),tolerancia:15,metasObs:10};
    const item={id,estudo:e,operacoes:[],createdAt:fmtDT(),updatedAt:fmtDT()};
    const next=[item,...estudos]; setEstudos(next); lsSave(next);
    setEstudoId(id); setEstudo(e); setOperacoes([]); setTab("config"); setTela("estudo");
  };

  const abrirEstudo = item => {
    setEstudoId(item.id); setEstudo(item.estudo); setOperacoes(item.operacoes||[]);
    setTab("config"); setTela("estudo"); setReportOp(null);
  };

  const deletarEstudo = (id,e) => {
    if(!window.confirm(`Excluir "${e.estudo.nome||"estudo sem nome"}"?`)) return;
    const next=estudos.filter(x=>x.id!==id); setEstudos(next); lsSave(next);
  };

  const voltarLista = () => {
    setTela("lista"); setEstudoId(null);
    setCapturing(false); setPausado(false); setOpAtiva(null); setElapsed(0); setLastTap(0);
  };

  const duplicarEstudo = () => {
    const gerarNomeVersao = nome => {
      const match = nome.match(/^(.*?)\s+v(\d+)$/);
      if (match) return `${match[1]} v${parseInt(match[2]) + 1}`;
      return `${nome || "Estudo"} v2`;
    };
    const id = Date.now().toString();
    const novoNome = gerarNomeVersao(estudo.nome);
    const novoEst = { ...estudo, nome: novoNome };
    const item = { id, estudo: novoEst, operacoes: operacoes.map(o => ({ ...o, tempos: [...o.tempos], paradas: [...(o.paradas||[])] })), createdAt: fmtDT(), updatedAt: fmtDT() };
    const next = [item, ...estudos];
    setEstudos(next); lsSave(next);
    showToast(`Estudo duplicado: "${novoNome}"`);
  };

  // ── Capture ──
  const iniciarCaptura = i => { setOpAtiva(i);setCapturing(true);setPausado(false);setElapsed(0);setLastTap(0);setSeqAguardando(false); };
  const pararCaptura = useCallback((forceFull=false) => {
    setCapturing(false); setPausado(false); setElapsed(0); setLastTap(0);
    if(modoSeq&&!forceFull&&opAtiva!==null&&opAtiva<operacoes.length-1){
      setSeqAguardando(true);
    } else {
      setOpAtiva(null); setModoSeq(false); setSeqAguardando(false);
    }
  }, [modoSeq, opAtiva, operacoes.length]);
  const iniciarProxima  = () => { const next=opAtiva+1; setSeqAguardando(false); iniciarCaptura(next); };
  const cancelarSeq     = () => { setModoSeq(false); setSeqAguardando(false); setOpAtiva(null); setCapturing(false); setElapsed(0); setLastTap(0); };
  const iniciarSequencial = () => { setModoSeq(true); iniciarCaptura(0); setTab("captura"); };
  const handleTap = useCallback(()=>{
    if(!capturing||pausado||opAtiva===null) return;
    const t=elapsed-lastTap; setLastTap(elapsed);
    setOperacoes(ops=>ops.map((op,i)=>i!==opAtiva?op:{...op,tempos:[...op.tempos,t]}));
    try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=880;g.gain.setValueAtTime(0.3,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.08);o.start();o.stop(ctx.currentTime+0.08);}catch{}
  },[capturing,pausado,opAtiva,elapsed,lastTap]);

  const iniciarPausa  = useCallback(() => { setPausado(true);pausaInicioRef.current=fmtDT();setPausaMotivo(MOTIVOS[0]);setPausaObs(""); }, []);
  const finalizarPausa = useCallback(() => {
    const dur=pausaElapsed||1000;
    setOperacoes(ops=>ops.map((op,i)=>i!==opAtiva?op:{...op,paradas:[...(op.paradas||[]),{motivo:pausaMotivo,obs:pausaObs,duracao:dur,inicio:pausaInicioRef.current}]}));
    setPausado(false);setPausaMotivo(MOTIVOS[0]);setPausaObs("");
  }, [pausaElapsed, pausaMotivo, pausaObs, opAtiva]);

  const addOp  = () => { if(!novaOp.trim()) return; setOperacoes(ops=>[...ops,{nome:novaOp.trim(),fr:novaFr,tempos:[],paradas:[],rodada2Inicio:null}]); setNovaOp("");setNovaFr(100); };
  const delTempo  = (oi,ti) => setOperacoes(ops=>ops.map((op,i)=>i!==oi?op:{...op,tempos:op.tempos.filter((_,j)=>j!==ti)}));
  const delParada = (oi,pi) => setOperacoes(ops=>ops.map((op,i)=>i!==oi?op:{...op,paradas:(op.paradas||[]).filter((_,j)=>j!==pi)}));
  const delOp     = i => setOperacoes(ops=>ops.filter((_,j)=>j!==i));
  const marcarRodada2    = (oi) => setOperacoes(ops=>ops.map((op,i)=>i!==oi?op:{...op,rodada2Inicio:op.tempos.length}));
  const desmarcarRodada2 = (oi) => setOperacoes(ops=>ops.map((op,i)=>i!==oi?op:{...op,rodada2Inicio:null}));

  const metaOk    = op => op.tempos.length>=estudo.metasObs;

  const calcOpsCache = useMemo(() => operacoes.map(op => calcOp(op, estudo.tolerancia)), [operacoes, estudo.tolerancia]);
  const sugestoes = useMemo(() => gerarSugestoes(operacoes,estudo.tolerancia), [operacoes, estudo.tolerancia]);

  const prioCor   = {alta:C.red,media:C.ylw,baixa:C.grn};

  // ── Teclado + Áudio (após todas as funções) ──
  useEffect(()=>{
    const onKey=e=>{
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"||e.target.tagName==="SELECT") return;
      if(e.code==="Space"&&capturing&&!pausado){e.preventDefault();handleTap();}
      if((e.code==="KeyP"||e.code==="KeyF")&&capturing&&!pausado){e.preventDefault();iniciarPausa();}
      if((e.code==="KeyP"||e.code==="KeyF")&&capturing&&pausado){e.preventDefault();finalizarPausa();}
      if(e.code==="Escape"&&capturing){e.preventDefault();pararCaptura();}
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[capturing,pausado,handleTap,iniciarPausa,finalizarPausa,pararCaptura]);

  // ── Toast ──
  const [toast, setToast] = useState(null);
  const showToast = (msg, type="info") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.txt,fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif",overflowX:"hidden",boxSizing:"border-box"}}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        button { transition: all 0.15s ease; }
        button:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        button:active:not(:disabled) { opacity: 0.75; transform: scale(0.97) translateY(0); }
        input:focus, select:focus, textarea:focus {
          border-color: ${C.red} !important;
          box-shadow: 0 0 0 3px ${C.red}33 !important;
          outline: none;
        }
      `}</style>

      {/* ── Modal Boas-vindas / Guia do Pendrive ── */}
      {showWelcome&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16,animation:"fadeIn 0.2s ease"}}>
          <div style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:14,padding:"28px 32px",maxWidth:520,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
            {/* Cabeçalho */}
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,paddingBottom:16,borderBottom:`1px solid ${C.brd}`}}>
              <img src={logoDataUrl} alt="RitmoProd" style={{height:44,borderRadius:6}}/>
              <div>
                <div style={{fontSize:16,fontWeight:900,color:C.txt}}>Bem-vindo ao RitmoProd</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>Como seus dados são salvos</div>
              </div>
            </div>

            {/* Como funciona */}
            <div style={{background:"rgba(220,38,38,0.07)",border:`1px solid rgba(220,38,38,0.25)`,borderRadius:8,padding:"12px 14px",marginBottom:16,fontSize:11,color:C.txt,lineHeight:1.8}}>
              <strong style={{color:"#dc2626"}}>⚠ Atenção:</strong> Os dados ficam no <strong>navegador desta máquina</strong>.<br/>
              Para não perder nada ao trocar de PC, <strong>sempre exporte o JSON</strong> antes de sair.
            </div>

            {/* Passos */}
            {[
              {
                num:"1", cor:C.grn, titulo:"Carregar dados do pendrive",
                desc:"Se você já tem estudos salvos em ritmoprod-dados.json, importe agora.",
                btn:"↑ IMPORTAR ritmoprod-dados.json",
                action: async ()=>{ await carregarDoPendrive(); setShowWelcome(false); }
              },
              {
                num:"2", cor:C.red, titulo:"Começar do zero",
                desc:"Primeira vez? Pode fechar e começar. Lembre de exportar o JSON ao final.",
                btn:"✓ ENTENDI, VAMOS COMEÇAR",
                action: ()=>setShowWelcome(false)
              },
            ].map(p=>(
              <div key={p.num} style={{display:"flex",gap:14,marginBottom:12,alignItems:"flex-start",background:C.bg,border:`1px solid ${C.brd}`,borderLeft:`4px solid ${p.cor}`,borderRadius:"0 8px 8px 0",padding:"12px 14px"}}>
                <div style={{fontSize:20,fontWeight:900,color:p.cor,minWidth:24,lineHeight:1}}>{p.num}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.txt,marginBottom:4}}>{p.titulo}</div>
                  <div style={{fontSize:11,color:C.muted,marginBottom:10,lineHeight:1.5}}>{p.desc}</div>
                  <button onClick={p.action} style={{...btnR,fontSize:11,padding:"7px 16px",background:p.cor}}>{p.btn}</button>
                </div>
              </div>
            ))}

            {/* Regra de ouro */}
            <div style={{background:"rgba(245,158,11,0.08)",border:`1px solid rgba(245,158,11,0.3)`,borderRadius:8,padding:"10px 14px",fontSize:11,color:C.ylw,lineHeight:1.8}}>
              <strong>Regra de ouro:</strong> O botão <strong>⚠ SALVAR</strong> no topo baixa o arquivo <code style={{background:"rgba(255,255,255,0.1)",padding:"1px 6px",borderRadius:3}}>ritmoprod-dados.json</code>.<br/>
              Salve no pendrive e importe na próxima vez que abrir em outro PC.
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.brd}`,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,flexWrap:"wrap",gap:6,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10,cursor:tela==="estudo"?"pointer":"default"}} onClick={tela==="estudo"?voltarLista:undefined}>
            <img src={logoDataUrl} alt="RitmoProd" style={{height:40,borderRadius:4}}/>
            <div style={{fontSize:10,color:C.muted,letterSpacing:1}}>{tela==="estudo"?"← Voltar aos estudos":"Estudo de Tempos · IE"}</div>
          </div>
          <button onClick={()=>setIsDark(d=>!d)} title={isDark?"Modo claro":"Modo escuro"} style={{background:"none",border:`1px solid ${C.brd}`,borderRadius:6,color:C.muted,cursor:"pointer",fontSize:14,padding:"4px 8px",marginLeft:4}}>{isDark?"☀":"🌙"}</button>
          {/* Botão salvar sempre visível */}
          {estudos.length>0&&(
            <button onClick={doBackupDownload} title="Baixar ritmoprod-dados.json agora" style={{background:backupPendente?"#dc2626":"#15803d",border:"none",borderRadius:6,color:"#fff",cursor:"pointer",fontSize:10,fontWeight:700,padding:"5px 10px",letterSpacing:0.5,animation:backupPendente?"pulse 1.5s infinite":"none"}}>
              {backupPendente?"⚠ SALVAR":"✓ SALVO"}
            </button>
          )}
          {ultimoBackup&&<div style={{fontSize:8,color:C.grn,letterSpacing:1,display:"flex",alignItems:"center",gap:3}}>✓ {ultimoBackup}</div>}
        </div>
        {tela==="estudo" && (
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            {calcOpsCache.some(c=>c)&&<>
              <button onClick={()=>exportExcel(estudo,operacoes,estudo.tolerancia)} style={btnHdr}>↓ EXCEL</button>
              <button onClick={()=>exportPDF(estudo,operacoes,estudo.tolerancia)} style={{...btnHdr,border:"1px solid #c0392b",color:"#e07070"}}>⎙ PDF</button>
            </>}
            <div style={{fontSize:9,color:C.muted,textAlign:"right",letterSpacing:1}}>
              <div style={{color:C.muted,fontSize:11}}>{estudo.nome||"sem nome"}</div>
              <div style={{color:C.grn,fontSize:9}}>● salvo automaticamente</div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ LISTA DE ESTUDOS ═══ */}
      {tela==="lista" && (
        <div style={{maxWidth:860,margin:"0 auto",padding:"24px 14px",boxSizing:"border-box"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:10}}>
            <div>
              <div style={{fontSize:16,fontWeight:900}}>MEUS ESTUDOS</div>
              <div style={{fontSize:10,color:C.muted,marginTop:2,letterSpacing:1}}>{estudos.length} ESTUDO(S) SALVO(S) LOCALMENTE</div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {estudos.length>=2&&<button onClick={()=>setComparaIds(comparaIds.length?[]:[null,null])} style={{...btnR,background:comparaIds.length?"#7c3aed":"transparent",border:`1px solid ${comparaIds.length?"#7c3aed":C.brd}`,color:comparaIds.length?"#fff":C.txt}}>⇄ COMPARAR</button>}
              <button onClick={novoEstudo} style={btnR}>+ NOVO ESTUDO</button>
            </div>
          </div>
          {/* ── KPI Dashboard ── */}
          {estudos.length > 0 && (()=>{
            const totalOpsAll = estudos.reduce((a, e) => a + e.operacoes.length, 0);
            const totalObsAll = estudos.reduce((a, e) => a + e.operacoes.reduce((b, o) => b + o.tempos.filter(v=>v>200).length, 0), 0);
            const totalParadasAll = estudos.reduce((a, e) => a + e.operacoes.reduce((b, o) => b + (o.paradas||[]).length, 0), 0);
            const totalCompletas = estudos.reduce((a, e) => {
              const meta = e.estudo.metasObs || 10;
              return a + e.operacoes.filter(o => o.tempos.filter(v=>v>200).length >= meta).length;
            }, 0);
            const pctCompletas = totalOpsAll > 0 ? Math.round((totalCompletas / totalOpsAll) * 100) : 0;
            return (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:18}}>
                {[
                  {l:"ESTUDOS",v:estudos.length,c:C.red},
                  {l:"OPERAÇÕES",v:totalOpsAll,c:C.txt},
                  {l:"OBSERVAÇÕES",v:totalObsAll,c:C.txt},
                  {l:"COMPLETAS",v:`${pctCompletas}%`,c:pctCompletas>=80?C.grn:C.ylw},
                  {l:"PARADAS",v:totalParadasAll,c:totalParadasAll>0?C.ylw:C.grn},
                ].map(k=>(
                  <div key={k.l} style={{background:C.card,border:`1px solid ${C.brd}`,borderLeft:`3px solid ${k.c}`,borderRadius:"0 8px 8px 0",padding:"12px 14px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
                    <div style={{fontSize:8,color:C.muted,letterSpacing:2,marginBottom:4,textTransform:"uppercase"}}>{k.l}</div>
                    <div style={{fontSize:22,fontWeight:900,color:k.c}}>{k.v}</div>
                  </div>
                ))}
              </div>
            );
          })()}
          {comparaIds.length===2&&comparaIds[0]&&comparaIds[1]&&(()=>{
            const e1=estudos.find(e=>e.id===comparaIds[0]);
            const e2=estudos.find(e=>e.id===comparaIds[1]);
            if(!e1||!e2) return null;
            const tol1=e1.estudo.tolerancia||15, tol2=e2.estudo.tolerancia||15;
            const allOps=[...new Set([...e1.operacoes.map(o=>o.nome),...e2.operacoes.map(o=>o.nome)])];
            return(
              <div style={{background:C.card,border:`2px solid #7c3aed`,borderRadius:10,padding:"16px 20px",marginBottom:16,boxShadow:"0 2px 8px rgba(124,58,237,0.15)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                  <div style={{fontSize:13,fontWeight:900,color:"#7c3aed"}}>⇄ COMPARAÇÃO DE ESTUDOS</div>
                  <button onClick={()=>setComparaIds([])} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}>×</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  {[{idx:0,e:e1},{idx:1,e:e2}].map(({idx,e})=>(
                    <div key={idx} style={{background:C.bg,border:`1px solid ${C.brd}`,borderRadius:6,padding:"10px 14px"}}>
                      <div style={{fontSize:9,color:"#7c3aed",letterSpacing:2,marginBottom:4}}>ESTUDO {idx+1}</div>
                      <div style={{fontWeight:700}}>{e.estudo.nome||"sem nome"}</div>
                      <div style={{fontSize:10,color:C.muted}}>{e.estudo.data} · {e.estudo.analista}</div>
                    </div>
                  ))}
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead><tr style={{background:C.bg}}><th style={{padding:"7px 10px",textAlign:"left",fontSize:9,color:C.muted}}>OPERAÇÃO</th><th style={{padding:"7px",fontSize:9,color:"#7c3aed"}}>TP Est.1</th><th style={{padding:"7px",fontSize:9,color:"#7c3aed"}}>TP Est.2</th><th style={{padding:"7px",fontSize:9,color:C.muted}}>ΔDIF</th><th style={{padding:"7px",fontSize:9,color:C.muted}}>CAP/H Est.1</th><th style={{padding:"7px",fontSize:9,color:C.muted}}>CAP/H Est.2</th></tr></thead>
                    <tbody>{allOps.map((nome,ri)=>{
                      const op1=e1.operacoes.find(o=>o.nome===nome); const op2=e2.operacoes.find(o=>o.nome===nome);
                      const c1=op1?calcOp(op1,tol1):null; const c2=op2?calcOp(op2,tol2):null;
                      const diff=c1&&c2?((c2.tpVal-c1.tpVal)/c1.tpVal*100):null;
                      return(<tr key={ri} style={{background:ri%2===0?C.card:C.bg}}>
                        <td style={{padding:"7px 10px",fontWeight:600}}>{nome}</td>
                        <td style={{padding:"7px",textAlign:"center",color:C.red,fontWeight:700}}>{c1?fmt(c1.tpVal):"—"}</td>
                        <td style={{padding:"7px",textAlign:"center",color:C.red,fontWeight:700}}>{c2?fmt(c2.tpVal):"—"}</td>
                        <td style={{padding:"7px",textAlign:"center",fontWeight:700,color:diff===null?C.muted:diff>0?"#dc2626":"#16a34a"}}>{diff===null?"—":`${diff>0?"+":""}${diff.toFixed(1)}%`}</td>
                        <td style={{padding:"7px",textAlign:"center"}}>{c1?c1.cap+" pçs":"—"}</td>
                        <td style={{padding:"7px",textAlign:"center"}}>{c2?c2.cap+" pçs":"—"}</td>
                      </tr>);
                    })}</tbody>
                  </table>
                </div>
              </div>
            );
          })()}
          {comparaIds.length===2&&(!comparaIds[0]||!comparaIds[1])&&(
            <div style={{background:"rgba(124,58,237,0.08)",border:`1px solid rgba(124,58,237,0.3)`,borderRadius:8,padding:"10px 16px",marginBottom:12,fontSize:11,color:"#7c3aed"}}>
              ⇄ Selecione <b>2 estudos</b> abaixo para comparar (clique nos cards)
            </div>
          )}
          <div style={{marginBottom:jsonInfo?12:20,background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
            {/* Pendrive auto-save */}
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.brd}`,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:10,color:C.muted,letterSpacing:1,marginRight:2}}>PENDRIVE:</span>
              <button onClick={vincularPendrive} style={{...btnR,background:"#15803d",fontSize:11}}>
                {fileHandleRef.current?"↻ TROCAR ARQUIVO":"🖫 VINCULAR ARQUIVO"}
              </button>
              <button onClick={carregarDoPendrive} style={{...btnR,background:"#1e40af",fontSize:11}}>↑ ABRIR DO PENDRIVE</button>
              {pendriveStatus==="reconectar" && (
                <button onClick={reconectarPendrive} style={{...btnR,background:"#d97706",fontSize:11,animation:"pulse 1.5s infinite"}}>
                  ⚡ RECONECTAR PENDRIVE
                </button>
              )}
              <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,fontSize:10}}>
                {pendriveStatus==="salvo"       && <span style={{color:C.grn,fontWeight:700}}>✓ Salvo automaticamente</span>}
                {pendriveStatus==="salvando"    && <span style={{color:C.ylw}}>⏳ Salvando…</span>}
                {pendriveStatus==="erro"        && <span style={{color:C.red}}>✗ Erro ao salvar</span>}
                {pendriveStatus==="reconectar"  && <span style={{color:C.ylw}}>Clique para carregar dados</span>}
                {pendriveStatus==="desvinculado"&& <span style={{color:C.muted}}>Não vinculado</span>}
              </div>
            </div>
            {/* Backup manual */}
            <div style={{padding:"10px 14px",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:10,color:C.muted,letterSpacing:1,marginRight:2}}>BACKUP MANUAL:</span>
              <button onClick={()=>exportarEstudosJSON(estudos)} disabled={estudos.length===0} style={{...btnR,background:"transparent",border:`1px solid ${C.brd}`,color:C.txt,fontSize:11,opacity:estudos.length===0?0.4:1,cursor:estudos.length===0?"not-allowed":"pointer"}}>↓ EXPORTAR JSON</button>
              <button onClick={()=>jsonImportRef.current?.click()} style={{...btnR,background:"transparent",border:`1px solid ${C.brd}`,color:C.txt,fontSize:11}}>↑ IMPORTAR JSON</button>
              <input ref={jsonImportRef} type="file" accept=".json" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f){importarEstudosJSON(f,setEstudos,setJsonInfo);e.target.value="";}}}/>
            </div>
          </div>
          {jsonInfo&&(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",marginBottom:16,background:jsonInfo.ok?"rgba(34,197,94,0.08)":"rgba(239,68,68,0.08)",border:`1px solid ${jsonInfo.ok?"rgba(34,197,94,0.25)":"rgba(239,68,68,0.25)"}`,borderRadius:8,fontSize:11,color:jsonInfo.ok?C.grn:"#f87171"}}>
              <span style={{fontWeight:700}}>{jsonInfo.ok?"✓":"✗"}</span>
              <span style={{flex:1}}>{jsonInfo.msg}</span>
              <button onClick={()=>setJsonInfo(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:0}}>×</button>
            </div>
          )}

          {estudos.length===0 ? (
            <div style={{padding:"64px 24px",textAlign:"center",border:`2px dashed ${C.brd}`,borderRadius:8}}>
              <div style={{fontSize:36,marginBottom:12}}>⧗</div>
              <div style={{fontSize:13,fontWeight:900,marginBottom:6}}>Nenhum estudo ainda</div>
              <div style={{fontSize:11,color:C.muted,marginBottom:20}}>Crie seu primeiro estudo de tempos para começar</div>
              <button onClick={novoEstudo} style={btnR}>+ CRIAR PRIMEIRO ESTUDO</button>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {estudos.map(item=>{
                const nObs=item.operacoes.reduce((a,o)=>a+o.tempos.length,0);
                const nOps=item.operacoes.length;
                const completas=item.operacoes.filter(o=>o.tempos.length>=(item.estudo.metasObs||10)).length;
                return (
                  <div key={item.id} style={{background:C.card,border:`1px solid ${comparaIds.includes(item.id)?"#7c3aed":C.brd}`,borderLeft:`4px solid ${comparaIds.includes(item.id)?"#7c3aed":C.red}`,borderRadius:10,padding:"16px 20px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",cursor:"pointer",transition:"all .15s",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}} onClick={()=>{
                    if(comparaIds.length===2&&!comparaIds[0]){const n=[item.id,comparaIds[1]];setComparaIds(n);return;}
                    if(comparaIds.length===2&&!comparaIds[1]){const n=[comparaIds[0],item.id];setComparaIds(n);return;}
                    if(comparaIds.length===0)abrirEstudo(item);
                  }}>
                    <div style={{flex:1,minWidth:140}}>
                      <div style={{fontSize:14,fontWeight:900}}>{item.estudo.nome||<span style={{color:C.muted,fontStyle:"italic"}}>sem nome</span>}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:3}}>
                        {item.estudo.analista&&`${item.estudo.analista} · `}{item.estudo.data}
                        {item.estudo.produto&&` · ${item.estudo.produto}`}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:10}}>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:18,fontWeight:900,color:C.red}}>{nOps}</div>
                        <div style={{color:C.muted,letterSpacing:1}}>OPS</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:18,fontWeight:900,color:C.txt}}>{nObs}</div>
                        <div style={{color:C.muted,letterSpacing:1}}>OBS</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:18,fontWeight:900,color:completas===nOps&&nOps>0?C.grn:C.ylw}}>{completas}/{nOps}</div>
                        <div style={{color:C.muted,letterSpacing:1}}>COMPLETAS</div>
                      </div>
                    </div>
                    <div style={{fontSize:9,color:C.muted,textAlign:"right",minWidth:80}}>
                      <div>atualizado</div>
                      <div style={{color:C.txt}}>{item.updatedAt?.split(" ")[0]||"—"}</div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();exportarEstudoJSON(item);}} title="Exportar estudo" style={{background:"none",border:`1px solid ${C.brd}`,borderRadius:4,color:C.muted,cursor:"pointer",fontSize:11,padding:"4px 10px"}}>↓</button>
                    <button onClick={e=>{e.stopPropagation();deletarEstudo(item.id,item);}} title="Excluir estudo" style={{background:"none",border:`1px solid ${C.brd}`,borderRadius:4,color:C.muted,cursor:"pointer",fontSize:11,padding:"4px 10px"}}>🗑</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ ESTUDO ═══ */}
      {tela==="estudo" && (
        <>
          {/* Tabs */}
          <div style={{display:"flex",background:C.card,padding:"0 20px",borderBottom:`1px solid ${C.brd}`,overflowX:"auto"}}>
            {[{id:"config",l:"① CONFIG"},{id:"captura",l:"② CAPTURA"},{id:"relatorio",l:"③ RELATÓRIO"},{id:"sugestoes",l:`④ SUGESTÕES${sugestoes.length>0?` (${sugestoes.length})`:""}`},{id:"padroes",l:"⑤ PADRÕES"},{id:"yamazumi",l:"⑥ YAMAZUMI"},{id:"dimensionamento",l:"⑦ OPERADORES"},{id:"antesdepois",l:"⑧ ANTES/DEPOIS"},{id:"instrucoes",l:"📖 INSTRUÇÕES"}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",padding:"14px 16px",fontSize:11,letterSpacing:1,fontFamily:"inherit",fontWeight:600,textTransform:"uppercase",color:tab===t.id?C.red:C.muted,borderBottom:tab===t.id?`2px solid ${C.red}`:"2px solid transparent",marginBottom:-1,whiteSpace:"nowrap"}}>{t.l}</button>
            ))}
          </div>

          <div style={{maxWidth:900,margin:"0 auto",padding:"20px 14px",boxSizing:"border-box"}}>

            {tab==="config" && (
              <TabConfig
                estudo={estudo} setEstudo={setEstudo}
                operacoes={operacoes} setOperacoes={setOperacoes}
                novaOp={novaOp} setNovaOp={setNovaOp}
                novaFr={novaFr} setNovaFr={setNovaFr}
                estudos={estudos} setEstudos={setEstudos}
                importRef={importRef} configJsonImportRef={configJsonImportRef}
                importInfo={importInfo} setImportInfo={setImportInfo}
                jsonInfo={jsonInfo} setJsonInfo={setJsonInfo}
                claudeApiKey={claudeApiKey} setClaudeApiKey={setClaudeApiKey}
                C={C} lbl={lbl} inp={inp} btnR={btnR}
                addOp={addOp} delOp={delOp} metaOk={metaOk}
                showToast={showToast} doBackupDownload={doBackupDownload} backupPendente={backupPendente}
                duplicarEstudo={duplicarEstudo}
              />
            )}

            {tab==="captura" && (
              <TabCaptura
                operacoes={operacoes} setOperacoes={setOperacoes}
                estudo={estudo}
                opAtiva={opAtiva} capturing={capturing} pausado={pausado}
                elapsed={elapsed} lastTap={lastTap}
                pausaElapsed={pausaElapsed}
                pausaMotivo={pausaMotivo} setPausaMotivo={setPausaMotivo}
                pausaObs={pausaObs} setPausaObs={setPausaObs}
                modoSeq={modoSeq} setModoSeq={setModoSeq}
                seqAguardando={seqAguardando}
                C={C} lbl={lbl} inp={inp} btnR={btnR}
                iniciarCaptura={iniciarCaptura} pararCaptura={pararCaptura}
                iniciarProxima={iniciarProxima} cancelarSeq={cancelarSeq}
                iniciarSequencial={iniciarSequencial}
                handleTap={handleTap} iniciarPausa={iniciarPausa} finalizarPausa={finalizarPausa}
                delTempo={delTempo} delParada={delParada}
                marcarRodada2={marcarRodada2} desmarcarRodada2={desmarcarRodada2}
                metaOk={metaOk}
              />
            )}

            {tab==="relatorio" && (
              <TabRelatorio
                estudo={estudo} operacoes={operacoes}
                reportOp={reportOp} setReportOp={setReportOp}
                C={C} btnR={btnR} metaOk={metaOk}
              />
            )}

            {tab==="sugestoes" && (
              <TabSugestoes
                estudo={estudo} operacoes={operacoes}
                sugestoes={sugestoes}
                claudeAnalise={claudeAnalise} setClaudeAnalise={setClaudeAnalise}
                claudeCarregando={claudeCarregando} setClaudeCarregando={setClaudeCarregando}
                claudeApiKey={claudeApiKey}
                C={C} btnR={btnR} prioCor={prioCor}
              />
            )}

            {tab==="padroes" && (
              <TabPadroes
                estudo={estudo} operacoes={operacoes}
                C={C} btnR={btnR}
              />
            )}

            {tab==="yamazumi" && (
              <TabYamazumi
                estudo={estudo} operacoes={operacoes}
                C={C} btnR={btnR}
              />
            )}

            {tab==="dimensionamento" && (
              <TabDimensionamento
                estudo={estudo} operacoes={operacoes}
                opsAtuais={opsAtuais} setOpsAtuais={setOpsAtuais}
                C={C} lbl={lbl} inp={inp} btnR={btnR}
              />
            )}

            {tab==="antesdepois" && (
              <TabAnteDepois
                estudo={estudo} operacoes={operacoes}
                estudos={estudos} estudoId={estudoId}
                antesDepoisRef={antesDepoisRef} setAntesDepoisRef={setAntesDepoisRef}
                antesDepoisDepoisId={antesDepoisDepoisId} setAntesDepoisDepoisId={setAntesDepoisDepoisId}
                C={C} btnR={btnR}
              />
            )}

            {tab==="instrucoes" && (
              <TabInstrucoes C={C} btnR={btnR} />
            )}

          </div>
        </>
      )}

      <div style={{marginTop:32,padding:"10px 16px",borderTop:`1px solid ${C.brd}`,display:"flex",justifyContent:"center",fontSize:9,color:C.muted,letterSpacing:1}}>
        Desenvolvido por <strong style={{color:C.txt,margin:"0 4px"}}>Oderli Sergio Garcia</strong> &amp; <strong style={{color:C.red,margin:"0 4px"}}>Claude (Anthropic)</strong>
      </div>

      <Toast toast={toast} />

      <style>{`*{box-sizing:border-box}input:focus,select:focus{outline:2px solid ${C.red}!important;border-color:${C.red}!important}button{transition:opacity .15s,transform .1s}button:hover{opacity:.88}button:active{opacity:.7;transform:scale(0.98)}select option{background:${C.card};color:${C.txt}}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.brd};border-radius:3px}@keyframes slideIn{from{transform:translateX(400px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}
