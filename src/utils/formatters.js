export const fmt   = ms => (!ms||isNaN(ms)) ? "—" : (ms/1000).toFixed(2)+"s";
export const fmtM  = ms => { if(!ms) return "—"; const m=Math.floor(ms/60000),s=((ms%60000)/1000).toFixed(0); return m>0?`${m}m ${s}s`:`${s}s`; };
export const fmtDT = () => new Date().toLocaleString("pt-BR");
export const fmtD  = () => new Date().toLocaleDateString("pt-BR");
