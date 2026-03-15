import { LS } from "../constants/theme";

export { LS };
export const lsLoad = () => { try { return JSON.parse(localStorage.getItem(LS)||"[]"); } catch { return []; } };
export const lsSave = d => { try { localStorage.setItem(LS, JSON.stringify(d)); } catch { alert("⚠ Falha ao salvar no navegador. Armazenamento local cheio. Faça um backup (exportar JSON) antes de continuar."); } };

export const IDB_NAME = "ritmoprod_idb", IDB_STORE = "handles", IDB_KEY = "pendriveHandle";
export const idbOpen = () => new Promise((res, rej) => {
  const req = indexedDB.open(IDB_NAME, 1);
  req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
  req.onsuccess = e => res(e.target.result);
  req.onerror   = e => rej(e.target.error);
});
export const idbSaveHandle = async (handle) => {
  try { const db = await idbOpen(); const tx = db.transaction(IDB_STORE,"readwrite"); tx.objectStore(IDB_STORE).put(handle, IDB_KEY); } catch {}
};
export const idbLoadHandle = async () => {
  try { const db = await idbOpen(); return await new Promise((res,rej)=>{ const req=db.transaction(IDB_STORE,"readonly").objectStore(IDB_STORE).get(IDB_KEY); req.onsuccess=e=>res(e.target.result||null); req.onerror=e=>rej(e.target.error); }); } catch { return null; }
};
export const idbClearHandle = async () => {
  try { const db = await idbOpen(); db.transaction(IDB_STORE,"readwrite").objectStore(IDB_STORE).delete(IDB_KEY); } catch {}
};
