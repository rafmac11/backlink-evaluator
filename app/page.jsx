"use client";
import { useState, useEffect } from "react";

export default function Landing() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  const features = [
    { icon: "o", title: "AI Link Evaluator", desc: "Claude researches both the source and target domain in real time, scoring links across 4 pillars: Authority, Topical Alignment, Toxicity Risk, and Agentic Utility. Get a composite 0-100 Link Value score with a clear Acquire / Monitor / Avoid recommendation." },
    { icon: ">", title: "Backlink Explorer", desc: "Fetch the full backlink profile of any domain - 100 top linking domains sorted by PageRank, anchor text distribution, dofollow ratio, and first-seen dates. Powered by DataForSEO's live index." },
    { icon: "o", title: "Real PageRank Data", desc: "Integrated with OpenPageRank to show the true Google-derived PageRank (0-10) for the target domain and every linking domain in the table. No inflated vanity metrics." },
    { icon: "#", title: "Link Profile Visualization", desc: "Interactive scatter plot of all referring domains, topical category breakdown derived from anchor texts, and top anchor text bar chart - everything you need to understand a link profile at a glance." },
  ];

  const pillars = [
    { num: "01", label: "Authority & Trust", color: "#c8f542", desc: "Domain age, DR, backlink quality, spam signals" },
    { num: "02", label: "Topical Alignment", color: "#42f5c8", desc: "Niche proximity, content relevance, audience overlap" },
    { num: "03", label: "Toxicity Risk", color: "#f5a342", desc: "PBN detection, thin content, manual penalty signals" },
    { num: "04", label: "Agentic Utility", color: "#a542f5", desc: "Real traffic, indexed pages, commercial value" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root[data-theme="dark"] { --bg:#0a0a0f;--surface:#111118;--surface2:#18181f;--border:#222230;--text:#f0f0f5;--muted:#6b6b80;--accent:#c8f542;--card-bg:#111118;--nav-bg:rgba(10,10,15,0.85);--hero-grad:radial-gradient(ellipse 80% 60% at 50% -10%,rgba(200,245,66,0.12) 0%,transparent 70%); }
        :root[data-theme="light"] { --bg:#f5f5f0;--surface:#ffffff;--surface2:#f0f0eb;--border:#e0e0d8;--text:#111118;--muted:#888880;--accent:#5a9e00;--card-bg:#ffffff;--nav-bg:rgba(245,245,240,0.9);--hero-grad:radial-gradient(ellipse 80% 60% at 50% -10%,rgba(90,158,0,0.1) 0%,transparent 70%); }
        html { scroll-behavior: smooth; }
        body { font-family:'Space Mono',monospace;background:var(--bg);color:var(--text);min-height:100vh;transition:background 0.3s,color 0.3s; }
        .nav { position:fixed;top:0;left:0;right:0;z-index:100;background:var(--nav-bg);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:0 40px;height:64px;display:flex;align-items:center;justify-content:space-between; }
        .logo { font-family:'Syne',sans-serif;font-weight:800;font-size:18px;letter-spacing:-0.5px; }
        .logo span { color:var(--accent); }
        .nav-right { display:flex;align-items:center;gap:16px; }
        .theme-toggle { width:44px;height:24px;background:var(--surface2);border:1px solid var(--border);border-radius:12px;cursor:pointer;position:relative;transition:all 0.3s; }
        .theme-toggle::after { content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;background:var(--accent);border-radius:50%;transition:transform 0.3s; }
        .theme-toggle.light::after { transform:translateX(20px); }
        .theme-label { font-size:10px;color:var(--muted);letter-spacing:1px; }
        .login-btn { padding:8px 24px;background:var(--accent);color:#000;border:none;border-radius:6px;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer;text-decoration:none;transition:opacity 0.2s,transform 0.2s; }
        .login-btn:hover { opacity:0.9;transform:translateY(-1px); }
        .hero { min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 24px 80px;position:relative;overflow:hidden; }
        .hero::before { content:'';position:absolute;inset:0;background:var(--hero-grad);pointer-events:none; }
        .hero-tag { display:inline-block;padding:4px 16px;border:1px solid var(--accent);border-radius:100px;font-size:10px;color:var(--accent);letter-spacing:3px;margin-bottom:32px;animation:fadeUp 0.6s ease both; }
        .hero-title { font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(40px,7vw,88px);line-height:1.0;letter-spacing:-2px;margin-bottom:28px;animation:fadeUp 0.6s ease 0.1s both; }
        .hero-title .accent { color:var(--accent); }
        .hero-sub { max-width:580px;color:var(--muted);font-size:14px;line-height:1.8;margin-bottom:48px;animation:fadeUp 0.6s ease 0.2s both; }
        .hero-ctas { display:flex;gap:16px;flex-wrap:wrap;justify-content:center;animation:fadeUp 0.6s ease 0.3s both; }
        .cta-primary { padding:14px 36px;background:var(--accent);color:#000;border:none;border-radius:8px;font-family:'Syne',sans-serif;font-weight:800;font-size:15px;cursor:pointer;text-decoration:none;transition:transform 0.2s,box-shadow 0.2s; }
        .cta-primary:hover { transform:translateY(-2px);box-shadow:0 8px 32px rgba(200,245,66,0.25); }
        .cta-secondary { padding:14px 36px;background:transparent;color:var(--text);border:1px solid var(--border);border-radius:8px;font-family:'Syne',sans-serif;font-weight:700;font-size:15px;cursor:pointer;text-decoration:none;transition:border-color 0.2s,color 0.2s; }
        .cta-secondary:hover { border-color:var(--accent);color:var(--accent); }
        .stats-bar { display:flex;gap:48px;flex-wrap:wrap;justify-content:center;margin-top:72px;padding-top:48px;border-top:1px solid var(--border);animation:fadeUp 0.6s ease 0.4s both;width:100%;max-width:700px; }
        .stat-num { font-family:'Syne',sans-serif;font-size:36px;font-weight:800;color:var(--accent);line-height:1;margin-bottom:6px; }
        .stat-label { font-size:10px;color:var(--muted);letter-spacing:2px; }
        .section { max-width:1100px;margin:0 auto;padding:100px 24px; }
        .section-tag { font-size:10px;color:var(--accent);letter-spacing:3px;margin-bottom:16px; }
        .section-title { font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(28px,4vw,48px);line-height:1.1;margin-bottom:20px;letter-spacing:-1px; }
        .section-sub { color:var(--muted);font-size:13px;line-height:1.8;max-width:520px;margin-bottom:60px; }
        .features-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1px;background:var(--border);border:1px solid var(--border);border-radius:16px;overflow:hidden; }
        .feature-card { background:var(--card-bg);padding:36px 32px;transition:background 0.2s; }
        .feature-card:hover { background:var(--surface2); }
        .feature-icon { font-size:24px;color:var(--accent);margin-bottom:20px;display:block; }
        .feature-title { font-family:'Syne',sans-serif;font-weight:700;font-size:17px;margin-bottom:12px; }
        .feature-desc { color:var(--muted);font-size:12px;line-height:1.8; }
        .pillars-section { background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border); }
        .pillars-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:0; }
        .pillar { padding:48px 32px;border-right:1px solid var(--border);position:relative; }
        .pillar:last-child { border-right:none; }
        .pillar::before { content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--pc); }
        .pillar-num { font-family:'Syne',sans-serif;font-size:48px;font-weight:800;color:var(--border);line-height:1;margin-bottom:16px; }
        .pillar-label { font-family:'Syne',sans-serif;font-weight:700;font-size:15px;margin-bottom:10px; }
        .pillar-desc { font-size:11px;color:var(--muted);line-height:1.7; }
        .how-section { max-width:1100px;margin:0 auto;padding:100px 24px;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center; }
        .steps { display:flex;flex-direction:column;gap:32px; }
        .step { display:flex;gap:20px;align-items:flex-start; }
        .step-num { width:36px;height:36px;border:1px solid var(--accent);border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--accent);flex-shrink:0; }
        .step-title { font-family:'Syne',sans-serif;font-weight:700;font-size:15px;margin-bottom:6px; }
        .step-desc { font-size:12px;color:var(--muted);line-height:1.7; }
        .mock-card { background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:32px; }
        .mock-score { font-family:'Syne',sans-serif;font-size:80px;font-weight:800;color:var(--accent);line-height:1;margin-bottom:4px; }
        .mock-micro { font-size:10px;color:var(--muted);letter-spacing:2px;margin-bottom:24px; }
        .bar-track { height:4px;background:var(--border);border-radius:2px;margin-bottom:12px;overflow:hidden; }
        .bar-fill { height:100%;border-radius:2px; }
        .mock-row { display:flex;justify-content:space-between;font-size:11px;margin-bottom:8px;color:var(--muted); }
        .mock-row b { color:var(--text); }
        .cta-section { text-align:center;padding:120px 24px;position:relative;overflow:hidden; }
        .cta-section::before { content:'';position:absolute;inset:0;background:var(--hero-grad);pointer-events:none; }
        footer { border-top:1px solid var(--border);padding:32px 40px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px; }
        .footer-text { font-size:11px;color:var(--muted); }
        @media(max-width:768px) { .how-section{grid-template-columns:1fr} .pillars-grid{grid-template-columns:1fr 1fr} .nav{padding:0 20px} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <nav className="nav">
        <div className="logo">Link Value <span>Platform</span></div>
        <div className="nav-right">
          <span className="theme-label">{dark ? "DARK" : "LIGHT"}</span>
          <button className={`theme-toggle ${dark ? "" : "light"}`} onClick={() => setDark(!dark)} />
          <a href="/dashboard" className="login-btn">-> LAUNCH APP</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-tag">AI-POWERED BACKLINK INTELLIGENCE</div>
        <h1 className="hero-title">Know if a link<br />is worth <span className="accent">acquiring.</span></h1>
        <p className="hero-sub">The only tool that combines Claude AI research, real PageRank data, and deep backlink analysis to give you a definitive link value score - before you spend a dollar on outreach.</p>
        <div className="hero-ctas">
          <a href="/dashboard" className="cta-primary">-> Launch Platform</a>
          <a href="#how" className="cta-secondary">How it works</a>
        </div>
        <div className="stats-bar">
          {[{n:"4",l:"EVALUATION PILLARS"},{n:"0-100",l:"LINK VALUE SCORE"},{n:"100+",l:"BACKLINKS PER LOOKUP"},{n:"~30s",l:"AI RESEARCH TIME"}].map(s=>(
            <div key={s.l} style={{textAlign:"center"}}><div className="stat-num">{s.n}</div><div className="stat-label">{s.l}</div></div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-tag">WHAT'S INSIDE</div>
        <h2 className="section-title">Two tools.<br />One decision.</h2>
        <p className="section-sub">Evaluate a prospective link with Claude AI research, or explore the full backlink profile of any domain with real data.</p>
        <div className="features-grid">
          {features.map(f=>(
            <div className="feature-card" key={f.title}>
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="pillars-section">
        <div style={{maxWidth:1100,margin:"0 auto",padding:"60px 24px 0"}}>
          <div className="section-tag">THE EVALUATION FRAMEWORK</div>
          <h2 className="section-title" style={{marginBottom:48}}>4 pillars. 1 score.</h2>
        </div>
        <div className="pillars-grid" style={{maxWidth:1100,margin:"0 auto",borderTop:"1px solid var(--border)"}}>
          {pillars.map(p=>(
            <div className="pillar" key={p.num} style={{"--pc":p.color}}>
              <div className="pillar-num">{p.num}</div>
              <div className="pillar-label" style={{color:p.color}}>{p.label}</div>
              <p className="pillar-desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="how-section" id="how">
        <div>
          <div className="section-tag">HOW IT WORKS</div>
          <h2 className="section-title">Research-backed scoring in 30 seconds.</h2>
          <p className="section-sub" style={{marginBottom:40}}>Claude browses the live web to evaluate both domains, then synthesizes a composite score across all four pillars.</p>
          <div className="steps">
            {[
              {n:"1",t:"Enter source & target URLs",d:"Paste the linking domain and the page receiving the link."},
              {n:"2",t:"Claude researches both domains",d:"Real-time web research on authority signals, content relevance, spam indicators, and traffic quality."},
              {n:"3",t:"Get your Link Value score",d:"A 0-100 composite score with a clear recommendation: Acquire, Monitor, or Avoid."},
            ].map(s=>(
              <div className="step" key={s.n}>
                <div className="step-num">{s.n}</div>
                <div><div className="step-title">{s.t}</div><p className="step-desc">{s.d}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="mock-card">
          <div style={{fontSize:10,color:"var(--muted)",letterSpacing:2,marginBottom:8}}>COMPOSITE LINK VALUE</div>
          <div className="mock-score">78</div>
          <div className="mock-micro">/100</div>
          <div className="bar-track"><div className="bar-fill" style={{width:"78%",background:"var(--accent)"}} /></div>
          <div style={{height:20}} />
          {[{l:"Authority & Trust",s:82,c:"#c8f542"},{l:"Topical Alignment",s:91,c:"#42f5c8"},{l:"Toxicity Risk",s:95,c:"#f5a342"},{l:"Agentic Utility",s:61,c:"#a542f5"}].map(p=>(
            <div key={p.l}>
              <div className="mock-row"><span>{p.l}</span><b>{p.s}/100</b></div>
              <div className="bar-track"><div className="bar-fill" style={{width:`${p.s}%`,background:p.c}} /></div>
            </div>
          ))}
          <span style={{display:"inline-block",padding:"6px 20px",background:"rgba(200,245,66,0.1)",color:"#c8f542",border:"1px solid rgba(200,245,66,0.3)",borderRadius:6,fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18,marginTop:20}}>-> ACQUIRE</span>
        </div>
      </div>

      <section className="cta-section">
        <div className="section-tag" style={{marginBottom:20}}>READY TO START</div>
        <h2 style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"clamp(32px,5vw,60px)",letterSpacing:-1,marginBottom:20,lineHeight:1.1}}>Stop guessing.<br />Start scoring.</h2>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:40,lineHeight:1.8}}>Every link acquisition decision deserves data-backed confidence.</p>
        <a href="/dashboard" className="cta-primary" style={{fontSize:16,padding:"16px 48px"}}>-> Launch the Platform</a>
      </section>

      <footer>
        <div className="logo" style={{fontSize:14}}>Link Value <span>Platform</span></div>
        <div className="footer-text">AI-powered ? PageRank data ? DataForSEO backlinks</div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span className="footer-text">{dark?"? Dark":"?? Light"}</span>
          <button className={`theme-toggle ${dark?"":"light"}`} onClick={()=>setDark(!dark)} />
        </div>
      </footer>
    </>
  );
}
