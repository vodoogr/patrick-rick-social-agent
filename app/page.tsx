export default function Home() {
  return (
    <main style={{minHeight:"100vh",background:"#101118",color:"#fafafa",fontFamily:"Arial,sans-serif",padding:"max(32px,8vw)"}}>
      <div style={{maxWidth:720,margin:"0 auto"}}>
        <p style={{color:"#afabbc",letterSpacing:3,fontSize:12}}>PATRICK RICK UNIVERSE</p>
        <h1 style={{fontSize:"clamp(30px,6vw,56px)",lineHeight:1.1,marginBottom:18}}>Social Agent</h1>
        <p style={{fontSize:18,lineHeight:1.6,color:"#d4d1da"}}>
          Backend privado en desarrollo para conectar Patrick Rick Creative Director
          con las campañas de Patrick Rick y Chris Rick.
        </p>
        <div style={{border:"1px solid #34313e",padding:22,borderRadius:14,marginTop:30}}>
          <strong>Fase 1 · Borradores</strong>
          <p style={{color:"#c8c4cd",lineHeight:1.6}}>
            El conector MCP permite crear y consultar borradores tras autenticarse.
            Publicar en Instagram, TikTok o YouTube está deshabilitado hasta
            completar las integraciones oficiales y la aprobación humana.
          </p>
        </div>
      </div>
    </main>
  );
}
