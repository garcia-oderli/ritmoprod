export const avg   = a => a.reduce((s,v)=>s+v,0)/a.length;
export const sd    = a => { if(a.length<2) return 0; const m=avg(a); return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1)); };
export const cvPct = a => a.length<2 ? 0 : (sd(a)/avg(a))*100;
export const linReg = a => {
  const n=a.length; if(n<3) return {slope:0,r2:0,dir:"estavel",pct:0};
  const sumX=n*(n-1)/2,sumX2=n*(n-1)*(2*n-1)/6;
  const sumY=a.reduce((s,v)=>s+v,0),sumXY=a.reduce((s,v,i)=>s+i*v,0);
  const slope=(n*sumXY-sumX*sumY)/(n*sumX2-sumX*sumX);
  const m=sumY/n,inter=(sumY-slope*sumX)/n;
  const ssTot=a.reduce((s,v)=>s+(v-m)**2,0);
  const ssRes=a.reduce((s,v,i)=>s+(v-(slope*i+inter))**2,0);
  const r2=ssTot>0?Math.max(0,1-ssRes/ssTot):0;
  const pct=m>0?Math.abs(slope)/m*100:0;
  const dir=pct<2?"estavel":slope>0?"crescente":"decrescente";
  return {slope,r2,dir,pct};
};
