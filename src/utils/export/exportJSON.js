import { lsSave } from "../storage";
import { fmtD } from "../formatters";

export const exportarEstudosJSON = (estudos) => {
  const blob = new Blob([JSON.stringify(estudos, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ritmoprod-estudos-${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportarEstudoJSON = (item) => {
  const blob = new Blob([JSON.stringify([item], null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ritmoprod-${item.estudo.nome||"estudo"}-${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importarEstudosJSON = (file, setEstudos, setJsonInfo) => {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const dados = JSON.parse(e.target.result);
      const arr = Array.isArray(dados) ? dados : [dados];
      const validos = arr.filter(x => x && x.id && x.estudo && Array.isArray(x.operacoes));
      if (!validos.length) { setJsonInfo({ok:false, msg:"Arquivo inválido: nenhum estudo reconhecido."}); return; }
      setEstudos(prev => {
        const existingIds = new Set(prev.map(e => e.id));
        const novos = validos.filter(x => !existingIds.has(x.id));
        const duplicados = validos.length - novos.length;
        const next = [...novos, ...prev];
        lsSave(next);
        setJsonInfo({ok:true, msg:`${novos.length} estudo(s) importado(s) de "${file.name}"${duplicados>0?` · ${duplicados} já existia(m) e foram ignorado(s)`:""}.`});
        return next;
      });
    } catch(err) {
      setJsonInfo({ok:false, msg:"Erro ao ler arquivo: " + err.message});
    }
  };
  reader.readAsText(file);
};
