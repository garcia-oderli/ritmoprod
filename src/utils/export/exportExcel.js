import * as XLSX from "xlsx";
import { calcOp, gerarSugestoes } from "../calculations";
import { fmt, fmtM, fmtDT, fmtD } from "../formatters";

export const exportExcel = (estudo,operacoes,tol) => {
  const wb=XLSX.utils.book_new(); const sugs=gerarSugestoes(operacoes,tol);
  const s1=[["RitmoProd — CONSOLIDADO"],[`Operação: ${estudo.nome}`,`Produto: ${estudo.produto||"—"}`,`Analista: ${estudo.analista||"—"}`,`Data: ${estudo.data}`],[`Tolerância: ${tol}%`,`Meta: ${estudo.metasObs}`],[],["OP","OPERAÇÃO","N","FR%","TO MÍN(s)","TO MÉD(s)","TO MÁX(s)","DP(s)","CV%","TN MÉD(s)","TP(s)","CAP/H","PARADAS","T.PARADO"]];
  operacoes.forEach((op,i)=>{const c=calcOp(op,tol);if(!c)return;s1.push([`OP${i+1}`,op.nome,c.n,op.fr,(c.min/1000).toFixed(3),(c.toMed/1000).toFixed(3),(c.max/1000).toFixed(3),(c.sd/1000).toFixed(3),+c.cvPct.toFixed(1),(c.tnMed/1000).toFixed(3),(c.tpVal/1000).toFixed(3),c.cap,c.nParadas,fmtM(c.totalParada)]);});
  const ws1=XLSX.utils.aoa_to_sheet(s1); ws1["!cols"]=[{wch:6},{wch:28},{wch:5},{wch:5},{wch:10},{wch:10},{wch:10},{wch:8},{wch:6},{wch:10},{wch:10},{wch:10},{wch:10},{wch:12}]; XLSX.utils.book_append_sheet(wb,ws1,"Consolidado");
  const s2=[["OP","OPERAÇÃO","FR%","OBS#","TO(s)","TN(s)"]]; operacoes.forEach((op,i)=>op.tempos.filter(v=>v>200).forEach((t,ti)=>s2.push([`OP${i+1}`,op.nome,op.fr,ti+1,(t/1000).toFixed(3),((t*op.fr/100)/1000).toFixed(3)]))); const ws2=XLSX.utils.aoa_to_sheet(s2); XLSX.utils.book_append_sheet(wb,ws2,"Tempos Coletados");
  const s3=[["OP","OPERAÇÃO","MOTIVO","DURAÇÃO","OBSERVAÇÃO","HORÁRIO"]]; operacoes.forEach((op,i)=>(op.paradas||[]).forEach(p=>s3.push([`OP${i+1}`,op.nome,p.motivo,fmtM(p.duracao),p.obs||"",p.inicio]))); const ws3=XLSX.utils.aoa_to_sheet(s3); XLSX.utils.book_append_sheet(wb,ws3,"Paradas");
  const s4=[["PRIORIDADE","TIPO","OPERAÇÃO","TÍTULO","DESCRIÇÃO","AÇÃO"]]; sugs.forEach(s=>s4.push([s.prio.toUpperCase(),s.tipo,s.op,s.titulo,s.desc,s.acao])); const ws4=XLSX.utils.aoa_to_sheet(s4); ws4["!cols"]=[{wch:10},{wch:12},{wch:24},{wch:36},{wch:50},{wch:60}]; XLSX.utils.book_append_sheet(wb,ws4,"Sugestões");
  XLSX.writeFile(wb,`ritmoprod-${estudo.nome||"estudo"}-${fmtD().replace(/\//g,"-")}.xlsx`);
};

export const gerarTemplateXLS = () => {
  const wb = XLSX.utils.book_new();

  const wsConfig = XLSX.utils.aoa_to_sheet([
    ["CAMPO","VALOR"],
    ["Operação / Área","Ex: Linha de Montagem A"],
    ["Produto","Ex: Produto X"],
    ["Analista","Ex: João Silva"],
    ["Data", new Date().toLocaleDateString("pt-BR")],
    ["Tolerância (%)","15"],
    ["Meta de Observações","10"],
  ]);
  wsConfig["!cols"]=[{wch:22},{wch:32}];
  XLSX.utils.book_append_sheet(wb, wsConfig, "Config");

  const wsTempos = XLSX.utils.aoa_to_sheet([
    ["OPERAÇÃO","FR%","TEMPO (s)"],
    ["Solda de pino",100,12.50],
    ["Solda de pino",100,13.10],
    ["Solda de pino",100,11.80],
    ["Solda de pino",100,12.95],
    ["Montagem de placa",95,8.40],
    ["Montagem de placa",95,9.10],
    ["Montagem de placa",95,8.75],
    ["Montagem de placa",95,8.20],
  ]);
  wsTempos["!cols"]=[{wch:30},{wch:8},{wch:12}];
  XLSX.utils.book_append_sheet(wb, wsTempos, "Tempos");

  const wsParadas = XLSX.utils.aoa_to_sheet([
    ["OPERAÇÃO","MOTIVO","DURAÇÃO (s)","OBSERVAÇÃO"],
    ["Solda de pino","Setup / Troca",120,"Troca de eletrodo"],
    ["Montagem de placa","Falta de material",240,"Aguardou componente SMD"],
  ]);
  wsParadas["!cols"]=[{wch:30},{wch:26},{wch:14},{wch:40}];
  XLSX.utils.book_append_sheet(wb, wsParadas, "Paradas");

  XLSX.writeFile(wb,"ritmoprod-template.xlsx");
};

export const importarXLS = (file, setEstudo, setOperacoes, setImportInfo) => {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, {type:"array"});

      // Config
      const wsC = wb.Sheets["Config"];
      if (wsC) {
        const rows = XLSX.utils.sheet_to_json(wsC, {header:1});
        const m = {};
        rows.slice(1).forEach(r => { if(r[0]) m[String(r[0]).trim()] = r[1]; });
        setEstudo(prev => ({
          ...prev,
          nome:      m["Operação / Área"]     ? String(m["Operação / Área"])     : prev.nome,
          produto:   m["Produto"]              ? String(m["Produto"])              : prev.produto,
          analista:  m["Analista"]             ? String(m["Analista"])             : prev.analista,
          data:      m["Data"]                 ? String(m["Data"])                 : prev.data,
          tolerancia:m["Tolerância (%)"]       ? +m["Tolerância (%)"]              : prev.tolerancia,
          metasObs:  m["Meta de Observações"]  ? +m["Meta de Observações"]         : prev.metasObs,
        }));
      }

      // Tempos
      const wsT = wb.Sheets["Tempos"];
      if (!wsT) { setImportInfo({ok:false,msg:"Aba 'Tempos' não encontrada no arquivo."}); return; }
      const rows = XLSX.utils.sheet_to_json(wsT, {header:1});
      const opMap = {};
      let ignorados = 0;
      rows.slice(1).forEach(r => {
        const nome = String(r[0]||"").trim();
        const fr   = +r[1] || 100;
        const tempo = parseFloat(r[2]);
        if (!nome || isNaN(tempo) || tempo <= 0) { ignorados++; return; }
        if (!opMap[nome]) opMap[nome] = {nome, fr, tempos:[], paradas:[]};
        opMap[nome].tempos.push(Math.round(tempo * 1000));
      });

      // Paradas
      const wsP = wb.Sheets["Paradas"];
      if (wsP) {
        const pRows = XLSX.utils.sheet_to_json(wsP, {header:1});
        pRows.slice(1).forEach(r => {
          const nome = String(r[0]||"").trim();
          const motivo = String(r[1]||"Outro").trim();
          const dur  = parseFloat(r[2]);
          const obs  = String(r[3]||"");
          if (!nome || isNaN(dur) || dur <= 0) return;
          if (!opMap[nome]) opMap[nome] = {nome, fr:100, tempos:[], paradas:[]};
          opMap[nome].paradas.push({motivo, obs, duracao:Math.round(dur*1000), inicio:new Date().toLocaleString("pt-BR")});
        });
      }

      const novasOps = Object.values(opMap);
      if (!novasOps.length) { setImportInfo({ok:false,msg:"Nenhum dado válido encontrado na aba 'Tempos'."}); return; }
      setOperacoes(novasOps);
      const totalObs = novasOps.reduce((a,o)=>a+o.tempos.length,0);
      const totalPar = novasOps.reduce((a,o)=>a+o.paradas.length,0);
      setImportInfo({ok:true, msg:`${novasOps.length} operação(ões) · ${totalObs} obs · ${totalPar} parada(s) importadas de "${file.name}"`});
    } catch(err) {
      setImportInfo({ok:false, msg:"Erro ao ler arquivo: " + err.message});
    }
  };
  reader.readAsArrayBuffer(file);
};
