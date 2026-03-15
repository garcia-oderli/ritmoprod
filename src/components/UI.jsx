export const Spinner = () => (
  <span style={{display:"inline-block", width:12, height:12, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.6s linear infinite", verticalAlign:"middle"}} />
);

export const ST = ({children,C}) => <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,marginTop:8}}><span style={{fontSize:9,fontWeight:900,letterSpacing:2,color:C.muted,textTransform:"uppercase"}}>{children}</span><div style={{flex:1,height:1,background:C.brd}} /></div>;

export const Empty = ({children,C}) => <div style={{padding:"64px 24px",textAlign:"center",color:C.muted,fontSize:12,letterSpacing:1,border:`1px dashed ${C.brd}`,borderRadius:12,background:C.bg}}>{children}</div>;

export const Toast = ({toast}) => {
  if (!toast) return null;
  return (
    <div style={{position:"fixed",bottom:24,right:24,background:toast.type==="info"?"#2563eb":toast.type==="success"?"#16a34a":"#d97706",color:"#fff",padding:"12px 18px",borderRadius:8,fontSize:12,fontWeight:600,boxShadow:"0 4px 12px rgba(0,0,0,0.25)",animation:"slideIn 0.3s ease"}}>
      {toast.msg}
    </div>
  );
};
