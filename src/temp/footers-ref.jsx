import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin, Star, ArrowRight, ArrowUpRight, Phone, Mail, Instagram, Heart,
  Globe, ChevronRight, Send, Compass, Sun, Waves, Sparkles, Clock, Copy,
  Check, MousePointer, Play, ExternalLink, ArrowUp, Linkedin, Twitter,
  Youtube, Facebook, MessageCircle, Palmtree, X, ChevronDown, Bot,
  User, Zap, Terminal, Hash, Minus, Plus, Eye, Hexagon, Layers,
  MousePointerClick, Scan, Radio, Wifi, Signal, Activity
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   ARIVIA VILLAS — 8 MODERN FOOTER DESIGNS (2026 TRENDS)
   
   1. BENTO GRID — Asymmetric card mosaic with hover reveals
   2. IMMERSIVE STORYTELLING — Full-bleed image + layered parallax text
   3. MICRO-INTERACTION MINIMAL — Ultra-clean with hover-expand columns
   4. EDITORIAL MAGAZINE — Typography-first, newspaper grid
   5. GLASSMORPHIC LAYERS — Frosted overlapping panels with depth
   6. BRUTALIST RAW — Anti-design, exposed grid, monospace everything
   7. CONVERSATIONAL — Chat-first AI concierge footer
   8. KINETIC TICKER — Scrolling text walls + dynamic reveal
   ═══════════════════════════════════════════════════════════════════════════ */

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&family=DM+Mono:wght@300;400&family=Space+Mono:wght@400;700&display=swap');

:root {
  --bg:#0a0a0f;--bg2:#111118;--bg3:#1a1a24;--card:#15151f;
  --line:rgba(255,255,255,.06);--line2:rgba(255,255,255,.1);
  --text:#f0ece4;--text-mid:#a8a29e;--text-dim:#6b6560;
  --sand:#d4a574;--sand-dim:rgba(212,165,116,.15);--sand-glow:rgba(212,165,116,.08);
  --warm:#e8c4a0;--coral:#e07a5f;--sea:#81b29a;--sky:#90bce0;--gold:#c9a96e;
  --serif:'Playfair Display',Georgia,serif;
  --sans:'Lato',-apple-system,sans-serif;
  --mono:'DM Mono',monospace;
  --mono2:'Space Mono',monospace;
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--text-dim);border-radius:3px}

@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes marquee-r{0%{transform:translateX(-50%)}100%{transform:translateX(0)}}
@keyframes pulse-glow{0%,100%{box-shadow:0 0 0 0 rgba(212,165,116,0)}50%{box-shadow:0 0 20px 4px rgba(212,165,116,.12)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes typing{from{width:0}to{width:100%}}
@keyframes orbit{0%{transform:rotate(0deg) translateX(120px) rotate(0deg)}100%{transform:rotate(360deg) translateX(120px) rotate(-360deg)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes scanline{0%{top:-2px}100%{top:100%}}
@keyframes glitch{0%,90%,100%{transform:translateX(0)}92%{transform:translateX(-2px)}94%{transform:translateX(2px)}96%{transform:translateX(-1px)}98%{transform:translateX(1px)}}
`;

/* ═══════════════════════════════════════════════════
   FOOTER 1: BENTO GRID
   ═══════════════════════════════════════════════════ */
const Footer1Bento = () => {
  const [copied,setCopied]=useState(false);
  const [hc,setHc]=useState(null);
  const [email,setEmail]=useState('');
  const copyEmail=()=>{navigator.clipboard?.writeText('hello@ariviavillas.com');setCopied(true);setTimeout(()=>setCopied(false),2000)};
  const Cell=({id,children,span,style:s})=>(<div onMouseEnter={()=>setHc(id)} onMouseLeave={()=>setHc(null)} style={{background:'var(--card)',border:'1px solid var(--line)',borderRadius:20,overflow:'hidden',gridColumn:span||'span 1',transition:'all .5s cubic-bezier(.16,1,.3,1)',position:'relative',borderColor:hc===id?'rgba(212,165,116,.2)':'var(--line)',transform:hc===id?'translateY(-3px)':'none',boxShadow:hc===id?'0 16px 40px rgba(0,0,0,.25)':'none',...s}}>{children}</div>);
  return(
    <footer style={{position:'relative',background:'var(--bg)',borderTop:'1px solid var(--line)',padding:'60px 5% 40px'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:32}}><div style={{fontFamily:'var(--serif)',fontSize:28,fontWeight:700,color:'var(--text)'}}>Arivia<span style={{color:'var(--sand)'}}>.</span></div><p style={{fontFamily:'var(--mono)',fontSize:10,letterSpacing:'.15em',color:'var(--text-dim)',textTransform:'uppercase'}}>01 — Bento Grid</p></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
          <Cell id="brand" span="span 2" style={{padding:'32px 28px'}}><p style={{fontFamily:'var(--serif)',fontSize:22,fontWeight:600,color:'var(--text)',lineHeight:1.3,marginBottom:12}}>Luxury living, <em style={{fontWeight:400,color:'var(--warm)'}}>redefined.</em></p><p style={{fontFamily:'var(--sans)',fontSize:13,color:'var(--text-dim)',lineHeight:1.7,maxWidth:340}}>Handpicked villas in the world's most beautiful destinations.</p><div style={{display:'flex',gap:8,marginTop:20}}>{[Instagram,Twitter,Linkedin,Youtube].map((Icon,i)=>(<div key={i} style={{width:36,height:36,borderRadius:10,background:'var(--bg3)',border:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-dim)',cursor:'pointer',transition:'all .3s'}} onMouseEnter={e=>{e.currentTarget.style.background='var(--sand-dim)';e.currentTarget.style.color='var(--sand)'}} onMouseLeave={e=>{e.currentTarget.style.background='var(--bg3)';e.currentTarget.style.color='var(--text-dim)'}}><Icon size={15}/></div>))}</div></Cell>
          <Cell id="n1" style={{padding:'28px 24px'}}><p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.2em',color:'var(--sand)',textTransform:'uppercase',marginBottom:16}}>Explore</p>{['Villas','Destinations','Experiences','Journal','About'].map(t=>(<a key={t} href="#" style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontFamily:'var(--sans)',fontSize:14,color:'var(--text-dim)',textDecoration:'none',padding:'8px 0',borderBottom:'1px solid var(--line)',transition:'color .2s'}} onMouseEnter={e=>{e.currentTarget.style.color='var(--text)';e.currentTarget.querySelector('svg').style.opacity='1'}} onMouseLeave={e=>{e.currentTarget.style.color='var(--text-dim)';e.currentTarget.querySelector('svg').style.opacity='0'}}>{t}<ArrowUpRight size={12} style={{opacity:0,transition:'opacity .2s',color:'var(--sand)'}}/></a>))}</Cell>
          <Cell id="n2" style={{padding:'28px 24px'}}><p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.2em',color:'var(--sand)',textTransform:'uppercase',marginBottom:16}}>Support</p>{['FAQ','Booking Policy','Privacy','Terms','Careers'].map(t=>(<a key={t} href="#" style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontFamily:'var(--sans)',fontSize:14,color:'var(--text-dim)',textDecoration:'none',padding:'8px 0',borderBottom:'1px solid var(--line)',transition:'color .2s'}} onMouseEnter={e=>{e.currentTarget.style.color='var(--text)';e.currentTarget.querySelector('svg').style.opacity='1'}} onMouseLeave={e=>{e.currentTarget.style.color='var(--text-dim)';e.currentTarget.querySelector('svg').style.opacity='0'}}>{t}<ArrowUpRight size={12} style={{opacity:0,transition:'opacity .2s',color:'var(--sand)'}}/></a>))}</Cell>
          <Cell id="news" span="span 2" style={{padding:'28px 28px'}}><p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.2em',color:'var(--coral)',textTransform:'uppercase',marginBottom:10}}><Mail size={11} style={{marginRight:4,verticalAlign:'middle'}}/>The Arivia Letter</p><p style={{fontFamily:'var(--serif)',fontSize:17,fontWeight:600,color:'var(--text)',marginBottom:12}}>Travel stories, delivered monthly.</p><div style={{display:'flex',gap:8}}><input placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={{flex:1,background:'var(--bg3)',border:'1px solid var(--line2)',borderRadius:10,padding:'12px 16px',fontFamily:'var(--sans)',fontSize:13,color:'var(--text)',outline:'none'}} onFocus={e=>e.target.style.borderColor='var(--sand)'} onBlur={e=>e.target.style.borderColor='var(--line2)'}/><button style={{padding:'0 20px',background:'var(--sand)',border:'none',borderRadius:10,cursor:'pointer',display:'flex',alignItems:'center',transition:'background .3s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--warm)'} onMouseLeave={e=>e.currentTarget.style.background='var(--sand)'}><Send size={16} color="var(--bg)"/></button></div></Cell>
          <Cell id="em" style={{padding:'24px 22px',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',textAlign:'center',cursor:'pointer'}} onClick={copyEmail}><Mail size={22} style={{color:'var(--sand)',marginBottom:10}}/><p style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mid)',marginBottom:4}}>hello@ariviavillas.com</p><p style={{fontFamily:'var(--mono)',fontSize:9,color:copied?'var(--sea)':'var(--text-dim)'}}>{copied?'✓ Copied!':'Click to copy'}</p></Cell>
          <Cell id="st" style={{padding:'24px 22px',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',textAlign:'center'}}><div style={{width:10,height:10,borderRadius:'50%',background:'var(--sea)',marginBottom:10,animation:'pulse-glow 2s infinite'}}/><p style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--sea)',marginBottom:4}}>All Systems Online</p><p style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--text-dim)'}}>Concierge available now</p></Cell>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:20,paddingTop:16,borderTop:'1px solid var(--line)'}}><p style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)'}}>© 2026 Arivia Villas</p><p style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)'}}>Athens · Milan · Ubud</p><button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} style={{width:32,height:32,borderRadius:8,background:'var(--bg3)',border:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-dim)',transition:'all .3s'}} onMouseEnter={e=>{e.currentTarget.style.color='var(--sand)'}} onMouseLeave={e=>{e.currentTarget.style.color='var(--text-dim)'}}><ArrowUp size={14}/></button></div>
      </div>
    </footer>
  );
};

/* ═══════════════════════════════════════════════════
   FOOTER 2: IMMERSIVE STORYTELLING
   ═══════════════════════════════════════════════════ */
const Footer2Immersive = () => {
  const [hl,setHl]=useState(null);
  return(
    <footer style={{position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0}}><img src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=60" alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:.12}}/><div style={{position:'absolute',inset:0,background:'linear-gradient(to top, #0a0a0f 0%, rgba(10,10,15,.95) 30%, rgba(10,10,15,.85) 100%)'}}/></div>
      <svg viewBox="0 0 1440 60" style={{display:'block',width:'100%',position:'relative',zIndex:2}} preserveAspectRatio="none"><path d="M0,60 C360,20 720,50 1080,15 C1260,5 1380,25 1440,20 L1440,0 L0,0 Z" fill="var(--bg)"/></svg>
      <div style={{position:'relative',zIndex:3,padding:'40px 5% 48px'}}><div style={{maxWidth:1200,margin:'0 auto'}}>
        <p style={{fontFamily:'var(--mono)',fontSize:10,letterSpacing:'.15em',color:'var(--text-dim)',textTransform:'uppercase',textAlign:'right',marginBottom:40}}>02 — Immersive</p>
        <div style={{textAlign:'center',marginBottom:64}}><p style={{fontFamily:'var(--sans)',fontSize:11,letterSpacing:'.3em',color:'var(--sand)',textTransform:'uppercase',marginBottom:16}}><Sun size={13} style={{marginRight:6,verticalAlign:'middle'}}/>Summer 2026</p><h2 style={{fontFamily:'var(--serif)',fontSize:'clamp(36px,5vw,64px)',fontWeight:700,color:'var(--text)',lineHeight:1.05,marginBottom:16}}>Ready to <em style={{fontWeight:400,color:'var(--warm)'}}>Escape?</em></h2><p style={{fontFamily:'var(--sans)',fontSize:15,color:'var(--text-dim)',maxWidth:400,margin:'0 auto 28px',lineHeight:1.7}}>Your perfect villa is waiting.</p><button style={{padding:'18px 48px',background:'var(--sand)',border:'none',borderRadius:60,fontFamily:'var(--sans)',fontSize:14,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--bg)',cursor:'pointer',transition:'all .4s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--warm)'} onMouseLeave={e=>e.currentTarget.style.background='var(--sand)'}>Explore Villas <ArrowRight size={16} style={{marginLeft:8,verticalAlign:'middle'}}/></button></div>
        <div style={{overflow:'hidden',borderTop:'1px solid var(--line)',borderBottom:'1px solid var(--line)',padding:'14px 0',marginBottom:48}}><div style={{display:'flex',gap:48,animation:'marquee 30s linear infinite',whiteSpace:'nowrap',width:'max-content'}}>{[...Array(2)].map((_,r)=>(<div key={r} style={{display:'flex',gap:48}}>{['Santorini','Tuscany','Bali','Maldives','Provence','Amalfi Coast','Mykonos','Ubud'].map(d=>(<span key={d+r} style={{fontFamily:'var(--serif)',fontSize:15,color:'var(--text-dim)',fontStyle:'italic',display:'flex',alignItems:'center',gap:8}}><span style={{width:4,height:4,borderRadius:'50%',background:'var(--sand)',opacity:.4}}/>{d}</span>))}</div>))}</div></div>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr',gap:32,marginBottom:48}}><div><div style={{fontFamily:'var(--serif)',fontSize:26,fontWeight:700,color:'var(--text)',marginBottom:16}}>Arivia<span style={{color:'var(--sand)'}}>.</span></div><p style={{fontFamily:'var(--sans)',fontSize:13,color:'var(--text-dim)',lineHeight:1.7,marginBottom:20,maxWidth:260}}>Handpicked luxury villas. Personal concierge.</p><div style={{display:'flex',gap:10}}>{[Instagram,Twitter,Facebook,Youtube].map((Icon,i)=>(<div key={i} style={{width:34,height:34,borderRadius:'50%',border:'1px solid var(--line2)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-dim)',cursor:'pointer',transition:'all .3s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--sand)';e.currentTarget.style.color='var(--sand)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--line2)';e.currentTarget.style.color='var(--text-dim)'}}><Icon size={14}/></div>))}</div></div>{[{t:'Stay',l:['All Villas','Destinations','Experiences']},{t:'Discover',l:['Journal','About Us','Careers']},{t:'Help',l:['FAQ','Contact','Booking Policy']},{t:'Legal',l:['Privacy','Terms','Cookies']}].map(col=>(<div key={col.t}><p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.2em',color:'var(--sand)',textTransform:'uppercase',marginBottom:14}}>{col.t}</p>{col.l.map(l=>(<a key={l} href="#" onMouseEnter={()=>setHl(l)} onMouseLeave={()=>setHl(null)} style={{display:'block',fontFamily:'var(--sans)',fontSize:13,textDecoration:'none',marginBottom:10,color:hl===l?'var(--text)':'var(--text-dim)',transform:hl===l?'translateX(6px)':'translateX(0)',transition:'all .3s'}}>{l}</a>))}</div>))}</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:20,borderTop:'1px solid var(--line)'}}><p style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)'}}>© 2026 Arivia Villas</p><p style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)'}}>Made with <Heart size={10} style={{verticalAlign:'middle',color:'var(--coral)'}}/> in Athens</p></div>
      </div></div>
    </footer>
  );
};

/* ═══════════════════════════════════════════════════
   FOOTER 3: MICRO-INTERACTION MINIMAL
   ═══════════════════════════════════════════════════ */
const Footer3Minimal = () => {
  const [ac,setAc]=useState(null);
  const COLS=[{id:'villas',label:'Villas',links:['Browse All','Featured','New Arrivals','By Destination'],accent:'var(--sand)'},{id:'company',label:'Company',links:['Our Story','Team','Careers','Press'],accent:'var(--sea)'},{id:'support',label:'Support',links:['FAQ','Contact','Policies','Accessibility'],accent:'var(--sky)'},{id:'connect',label:'Connect',links:['Instagram','Newsletter','Blog','WhatsApp'],accent:'var(--coral)'}];
  return(
    <footer style={{background:'var(--bg)',borderTop:'1px solid var(--line)',padding:'80px 5% 40px'}}><div style={{maxWidth:1100,margin:'0 auto'}}>
      <p style={{fontFamily:'var(--mono)',fontSize:10,letterSpacing:'.15em',color:'var(--text-dim)',textTransform:'uppercase',textAlign:'right',marginBottom:48}}>03 — Minimal</p>
      <div style={{textAlign:'center',marginBottom:64}}><div style={{fontFamily:'var(--serif)',fontSize:48,fontWeight:700,color:'var(--text)',letterSpacing:'-0.03em'}}>Arivia<span style={{color:'var(--sand)'}}>.</span></div><div style={{width:40,height:1,background:'var(--sand)',margin:'20px auto'}}/><p style={{fontFamily:'var(--serif)',fontSize:16,fontStyle:'italic',color:'var(--text-dim)'}}>Luxury Living, Redefined</p></div>
      <div style={{display:'flex',gap:2,marginBottom:64,borderRadius:16,overflow:'hidden',border:'1px solid var(--line)'}}>{COLS.map(col=>{const isA=ac===col.id;return(<div key={col.id} onMouseEnter={()=>setAc(col.id)} onMouseLeave={()=>setAc(null)} style={{flex:isA?3:1,padding:isA?'32px 28px':'32px 20px',background:isA?'var(--card)':'var(--bg2)',transition:'all .5s cubic-bezier(.16,1,.3,1)',cursor:'pointer',overflow:'hidden',borderRight:'1px solid var(--line)',position:'relative'}}><div style={{position:'absolute',top:0,left:0,right:0,height:2,background:col.accent,transform:isA?'scaleX(1)':'scaleX(0)',transformOrigin:'left',transition:'transform .4s cubic-bezier(.16,1,.3,1)'}}/><p style={{fontFamily:'var(--mono)',fontSize:10,letterSpacing:'.2em',textTransform:'uppercase',color:isA?col.accent:'var(--text-dim)',transition:'color .3s',marginBottom:isA?20:0,whiteSpace:'nowrap'}}>{col.label}</p><div style={{maxHeight:isA?'200px':'0',opacity:isA?1:0,transition:'all .4s cubic-bezier(.16,1,.3,1)',overflow:'hidden'}}>{col.links.map(l=>(<a key={l} href="#" style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontFamily:'var(--sans)',fontSize:14,color:'var(--text-dim)',textDecoration:'none',padding:'8px 0',borderBottom:'1px solid var(--line)',transition:'all .2s'}} onMouseEnter={e=>e.currentTarget.style.color='var(--text)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-dim)'}>{l}<ArrowUpRight size={12} style={{color:col.accent,opacity:.5}}/></a>))}</div></div>)})}</div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><p style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)'}}>© 2026</p><div style={{display:'flex',gap:20}}>{['Privacy','Terms','Cookies'].map(t=>(<a key={t} href="#" style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',textDecoration:'none',transition:'color .2s'}} onMouseEnter={e=>e.target.style.color='var(--text)'} onMouseLeave={e=>e.target.style.color='var(--text-dim)'}>{t}</a>))}</div><div style={{display:'flex',gap:8}}>{[Instagram,Twitter,Linkedin].map((Icon,i)=>(<div key={i} style={{color:'var(--text-dim)',cursor:'pointer',transition:'color .3s'}} onMouseEnter={e=>e.currentTarget.style.color='var(--sand)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-dim)'}><Icon size={15}/></div>))}</div></div>
    </div></footer>
  );
};

/* ═══════════════════════════════════════════════════
   FOOTER 4: EDITORIAL MAGAZINE
   ═══════════════════════════════════════════════════ */
const Footer4Editorial = () => {
  const [email,setEmail]=useState('');const [hl,setHl]=useState(null);
  return(
    <footer style={{background:'var(--bg)',position:'relative',overflow:'hidden'}}>
      <div style={{height:3,background:'linear-gradient(90deg,var(--sand),var(--coral),var(--sea),var(--sky),var(--sand))',backgroundSize:'200% 100%'}}/>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'64px 5% 40px'}}>
        <p style={{fontFamily:'var(--mono)',fontSize:10,letterSpacing:'.15em',color:'var(--text-dim)',textTransform:'uppercase',textAlign:'right',marginBottom:48}}>04 — Editorial</p>
        <div style={{marginBottom:48,position:'relative'}}><h2 style={{fontFamily:'var(--serif)',fontSize:'clamp(60px,9vw,140px)',fontWeight:700,color:'var(--text)',lineHeight:.9,letterSpacing:'-0.04em',opacity:.08,userSelect:'none'}}>ARIVIA</h2><div style={{position:'absolute',top:'50%',left:0,transform:'translateY(-50%)',display:'flex',alignItems:'center',gap:20}}><div style={{fontFamily:'var(--serif)',fontSize:28,fontWeight:700,color:'var(--text)'}}>Arivia<span style={{color:'var(--sand)'}}>.</span></div><div style={{width:40,height:1,background:'var(--sand)'}}/><p style={{fontFamily:'var(--serif)',fontSize:15,fontStyle:'italic',color:'var(--text-dim)'}}>Luxury Living, Redefined</p></div></div>
        <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr 1.6fr',gap:32,paddingBottom:48,borderBottom:'1px solid var(--line)'}}>
          <div><p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.25em',color:'var(--sand)',textTransform:'uppercase',marginBottom:20,paddingBottom:8,borderBottom:'1px solid var(--line)'}}>Contact</p>{[{i:Mail,t:'hello@ariviavillas.com'},{i:Phone,t:'+30 210 123 4567'},{i:MapPin,t:'Athens, Greece'},{i:Clock,t:'Mon–Sat, 9am–8pm'}].map((c,j)=>{const I=c.i;return(<div key={j} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid var(--line)'}}><I size={14} style={{color:'var(--sand)'}}/><span style={{fontFamily:'var(--sans)',fontSize:13,color:'var(--text-dim)'}}>{c.t}</span></div>)})}</div>
          <div><p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.25em',color:'var(--sand)',textTransform:'uppercase',marginBottom:20,paddingBottom:8,borderBottom:'1px solid var(--line)'}}>Explore</p>{['All Villas','Destinations','Experiences','Journal','About Us'].map((l,i)=>(<a key={l} href="#" onMouseEnter={()=>setHl(l)} onMouseLeave={()=>setHl(null)} style={{display:'block',fontFamily:'var(--sans)',fontSize:14,textDecoration:'none',padding:'10px 0',borderBottom:'1px solid var(--line)',color:hl===l?'var(--text)':'var(--text-dim)',transition:'all .2s'}}><span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',marginRight:10}}>0{i+1}</span>{l}</a>))}</div>
          <div><p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.25em',color:'var(--sand)',textTransform:'uppercase',marginBottom:20,paddingBottom:8,borderBottom:'1px solid var(--line)'}}>Legal</p>{['Privacy Policy','Terms of Service','Cookie Settings','Accessibility','Sitemap'].map(l=>(<a key={l} href="#" style={{display:'block',fontFamily:'var(--sans)',fontSize:13,color:'var(--text-dim)',textDecoration:'none',padding:'10px 0',borderBottom:'1px solid var(--line)',transition:'color .2s'}} onMouseEnter={e=>e.target.style.color='var(--text)'} onMouseLeave={e=>e.target.style.color='var(--text-dim)'}>{l}</a>))}</div>
          <div><p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.25em',color:'var(--sand)',textTransform:'uppercase',marginBottom:20,paddingBottom:8,borderBottom:'1px solid var(--line)'}}>Newsletter</p><p style={{fontFamily:'var(--serif)',fontSize:18,fontWeight:600,color:'var(--text)',lineHeight:1.3,marginBottom:8}}>The Arivia Letter</p><p style={{fontFamily:'var(--sans)',fontSize:13,color:'var(--text-dim)',lineHeight:1.6,marginBottom:16}}>Monthly. No spam.</p><div style={{display:'flex',gap:6,marginBottom:24}}><input placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={{flex:1,background:'var(--bg3)',border:'1px solid var(--line2)',borderRadius:8,padding:'11px 14px',fontFamily:'var(--sans)',fontSize:13,color:'var(--text)',outline:'none'}} onFocus={e=>e.target.style.borderColor='var(--sand)'} onBlur={e=>e.target.style.borderColor='var(--line2)'}/><button style={{padding:'0 16px',background:'var(--sand)',border:'none',borderRadius:8,cursor:'pointer',display:'flex',alignItems:'center'}}><Send size={14} color="var(--bg)"/></button></div><div style={{display:'flex',gap:10}}>{[{i:Instagram,l:'IG'},{i:Twitter,l:'X'},{i:Linkedin,l:'IN'},{i:Youtube,l:'YT'}].map(({i:Icon,l},j)=>(<div key={j} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'var(--bg3)',border:'1px solid var(--line)',borderRadius:8,cursor:'pointer',transition:'all .3s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--sand)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--line)'}}><Icon size={13} style={{color:'var(--sand)'}}/><span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-mid)'}}>{l}</span></div>))}</div></div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:20}}><p style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)'}}>© 2026 Arivia Villas Ltd.</p><p style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)'}}><span style={{color:'var(--sand)'}}>●</span> Athens <span style={{color:'var(--sea)',marginLeft:12}}>●</span> Milan <span style={{color:'var(--coral)',marginLeft:12}}>●</span> Ubud</p><button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',cursor:'pointer',transition:'color .3s'}} onMouseEnter={e=>e.currentTarget.style.color='var(--sand)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-dim)'}>Back to top <ArrowUp size={12}/></button></div>
      </div>
    </footer>
  );
};


/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER 5: GLASSMORPHIC LAYERS
   Trend: Frosted glass panels, overlapping depth, floating cards,
   backdrop-blur stacking, translucent surfaces
   ═══════════════════════════════════════════════════════════════════════════ */
const Footer5Glass = () => {
  const [email,setEmail]=useState('');
  return (
    <footer style={{position:'relative',overflow:'hidden',padding:'80px 5% 40px'}}>
      {/* Background orbs */}
      <div style={{position:'absolute',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(212,165,116,.12),transparent 70%)',top:-100,left:'10%',filter:'blur(60px)'}}/>
      <div style={{position:'absolute',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(129,178,154,.1),transparent 70%)',bottom:-50,right:'15%',filter:'blur(50px)'}}/>
      <div style={{position:'absolute',width:250,height:250,borderRadius:'50%',background:'radial-gradient(circle,rgba(224,122,95,.08),transparent 70%)',top:'40%',right:'40%',filter:'blur(40px)'}}/>

      <div style={{position:'relative',zIndex:2,maxWidth:1200,margin:'0 auto'}}>
        <p style={{fontFamily:'var(--mono)',fontSize:10,letterSpacing:'.15em',color:'var(--text-dim)',textTransform:'uppercase',textAlign:'right',marginBottom:40}}>05 — Glassmorphic</p>

        {/* Stacked glass panels */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20,marginBottom:40}}>
          {/* Panel 1 — Brand + Newsletter */}
          <div style={{gridRow:'span 2',background:'rgba(21,21,31,.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,.08)',borderRadius:24,padding:'36px 28px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent)'}}/>
            <div style={{fontFamily:'var(--serif)',fontSize:28,fontWeight:700,color:'var(--text)',marginBottom:20}}>Arivia<span style={{color:'var(--sand)'}}>.</span></div>
            <p style={{fontFamily:'var(--sans)',fontSize:14,color:'var(--text-dim)',lineHeight:1.7,marginBottom:28}}>Handpicked luxury villas in the world's most beautiful destinations. Every detail inspected, every stay unforgettable.</p>
            <div style={{width:'100%',height:1,background:'rgba(255,255,255,.06)',marginBottom:24}}/>
            <p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.2em',color:'var(--sand)',textTransform:'uppercase',marginBottom:14}}><Mail size={11} style={{marginRight:6,verticalAlign:'middle'}}/>Newsletter</p>
            <p style={{fontFamily:'var(--serif)',fontSize:16,fontWeight:600,color:'var(--text)',marginBottom:12}}>The Arivia Letter</p>
            <div style={{display:'flex',gap:6}}>
              <input placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={{flex:1,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:10,padding:'11px 14px',fontFamily:'var(--sans)',fontSize:13,color:'var(--text)',outline:'none',backdropFilter:'blur(4px)'}} onFocus={e=>e.target.style.borderColor='var(--sand)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.08)'}/>
              <button style={{width:44,height:44,borderRadius:10,background:'var(--sand)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'background .3s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--warm)'} onMouseLeave={e=>e.currentTarget.style.background='var(--sand)'}><Send size={16} color="var(--bg)"/></button>
            </div>
            <div style={{display:'flex',gap:8,marginTop:24}}>
              {[Instagram,Twitter,Linkedin,Youtube].map((Icon,i)=>(<div key={i} style={{width:38,height:38,borderRadius:10,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.06)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-dim)',cursor:'pointer',transition:'all .3s'}} onMouseEnter={e=>{e.currentTarget.style.background='var(--sand-dim)';e.currentTarget.style.color='var(--sand)';e.currentTarget.style.borderColor='var(--sand)'}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.04)';e.currentTarget.style.color='var(--text-dim)';e.currentTarget.style.borderColor='rgba(255,255,255,.06)'}}><Icon size={15}/></div>))}
            </div>
          </div>

          {/* Panel 2 — Explore */}
          <div style={{background:'rgba(21,21,31,.4)',backdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,.06)',borderRadius:20,padding:'28px 24px',position:'relative'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(212,165,116,.15),transparent)'}}/>
            <p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.2em',color:'var(--sand)',textTransform:'uppercase',marginBottom:16}}>Explore</p>
            {['Villas','Destinations','Experiences','Journal','About'].map(t=>(<a key={t} href="#" style={{display:'block',fontFamily:'var(--sans)',fontSize:14,color:'var(--text-dim)',textDecoration:'none',padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,.04)',transition:'all .2s'}} onMouseEnter={e=>{e.target.style.color='var(--text)';e.target.style.paddingLeft='8px'}} onMouseLeave={e=>{e.target.style.color='var(--text-dim)';e.target.style.paddingLeft='0'}}>{t}</a>))}
          </div>

          {/* Panel 3 — Support */}
          <div style={{background:'rgba(21,21,31,.4)',backdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,.06)',borderRadius:20,padding:'28px 24px',position:'relative'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(129,178,154,.15),transparent)'}}/>
            <p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.2em',color:'var(--sea)',textTransform:'uppercase',marginBottom:16}}>Support</p>
            {['FAQ','Contact Us','Booking Policy','Privacy','Terms'].map(t=>(<a key={t} href="#" style={{display:'block',fontFamily:'var(--sans)',fontSize:14,color:'var(--text-dim)',textDecoration:'none',padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,.04)',transition:'all .2s'}} onMouseEnter={e=>{e.target.style.color='var(--text)';e.target.style.paddingLeft='8px'}} onMouseLeave={e=>{e.target.style.color='var(--text-dim)';e.target.style.paddingLeft='0'}}>{t}</a>))}
          </div>

          {/* Panel 4 — Contact (wide, overlaps slightly) */}
          <div style={{gridColumn:'span 2',background:'rgba(21,21,31,.5)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,.06)',borderRadius:20,padding:'24px 28px',display:'flex',alignItems:'center',gap:32}}>
            <div style={{flex:1}}>
              <p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.2em',color:'var(--coral)',textTransform:'uppercase',marginBottom:8}}>Get in Touch</p>
              <p style={{fontFamily:'var(--serif)',fontSize:18,fontWeight:600,color:'var(--text)',marginBottom:4}}>Talk to our concierge</p>
              <p style={{fontFamily:'var(--sans)',fontSize:12,color:'var(--text-dim)'}}>Average response: under 1 hour</p>
            </div>
            <div style={{display:'flex',gap:12}}>
              {[{i:Mail,l:'Email',c:'var(--sand)'},{i:Phone,l:'Call',c:'var(--sea)'},{i:MessageCircle,l:'Chat',c:'var(--coral)'}].map(({i:Icon,l,c},j)=>(<button key={j} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'14px 20px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',borderRadius:14,cursor:'pointer',transition:'all .3s',backdropFilter:'blur(4px)'}} onMouseEnter={e=>{e.currentTarget.style.borderColor=c;e.currentTarget.style.background=`${c}10`}} onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.06)';e.currentTarget.style.background='rgba(255,255,255,.03)'}}><Icon size={18} style={{color:c}}/><span style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--text-dim)'}}>{l}</span></button>))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:16,borderTop:'1px solid rgba(255,255,255,.04)'}}>
          <p style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)'}}>© 2026 Arivia Villas</p>
          <div style={{display:'flex',gap:16}}>{['Privacy','Terms','Cookies'].map(t=>(<a key={t} href="#" style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',textDecoration:'none'}}>{t}</a>))}</div>
          <p style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)'}}>Athens · Milan · Ubud</p>
        </div>
      </div>
    </footer>
  );
};


/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER 6: BRUTALIST RAW
   Trend: Anti-design, exposed structure, monospace everything, 
   harsh borders, raw data aesthetic, terminal feel
   ═══════════════════════════════════════════════════════════════════════════ */
const Footer6Brutalist = () => {
  const [time,setTime]=useState('');
  useEffect(()=>{const t=setInterval(()=>setTime(new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})),1000);return()=>clearInterval(t)},[]);

  return(
    <footer style={{background:'var(--bg)',borderTop:'3px solid var(--text)',fontFamily:'var(--mono2)'}}>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'0 5%'}}>
        <p style={{fontFamily:'var(--mono)',fontSize:10,letterSpacing:'.15em',color:'var(--text-dim)',textTransform:'uppercase',textAlign:'right',padding:'12px 0'}}>06 — Brutalist</p>

        {/* Top banner */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 0',borderBottom:'2px solid var(--text-dim)'}}>
          <div style={{fontSize:32,fontWeight:700,color:'var(--text)',letterSpacing:'-0.04em'}}>ARIVIA<span style={{color:'var(--sand)'}}>.</span></div>
          <div style={{display:'flex',gap:24,alignItems:'center'}}>
            <span style={{fontSize:10,color:'var(--text-dim)',letterSpacing:'.1em'}}>LOCAL TIME</span>
            <span style={{fontSize:18,fontWeight:700,color:'var(--sand)',letterSpacing:'.05em',fontVariantNumeric:'tabular-nums'}}>{time}</span>
          </div>
        </div>

        {/* Grid — hard borders, no radius */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',borderBottom:'2px solid var(--text-dim)'}}>
          {[
            {h:'NAV/01',links:['VILLAS','DESTINATIONS','EXPERIENCES']},
            {h:'NAV/02',links:['JOURNAL','ABOUT','CAREERS']},
            {h:'LEGAL',links:['PRIVACY','TERMS','COOKIES']},
            {h:'CONTACT',links:['HELLO@ARIVIA.COM','+30.210.123.4567','ATHENS, GR']},
            {h:'SOCIAL',links:['INSTAGRAM →','X (TWITTER) →','LINKEDIN →']},
          ].map((col,i)=>(
            <div key={i} style={{borderRight:i<4?'1px solid var(--line2)':'none',padding:'24px 20px'}}>
              <p style={{fontSize:9,letterSpacing:'.25em',color:'var(--sand)',marginBottom:16,paddingBottom:8,borderBottom:'1px dashed var(--text-dim)'}}>{col.h}</p>
              {col.links.map(l=>(<a key={l} href="#" style={{display:'block',fontSize:11,color:'var(--text-dim)',textDecoration:'none',padding:'6px 0',transition:'color .15s',letterSpacing:'.05em'}} onMouseEnter={e=>e.target.style.color='var(--text)'} onMouseLeave={e=>e.target.style.color='var(--text-dim)'}>{l}</a>))}
            </div>
          ))}
        </div>

        {/* Status bar — terminal style */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 0',borderBottom:'1px solid var(--line2)'}}>
          <div style={{display:'flex',gap:20,alignItems:'center'}}>
            <span style={{display:'flex',alignItems:'center',gap:6,fontSize:10,color:'var(--sea)'}}><span style={{width:6,height:6,borderRadius:'50%',background:'var(--sea)',animation:'pulse-glow 2s infinite'}}/> SYS:OK</span>
            <span style={{fontSize:10,color:'var(--text-dim)'}}>CONCIERGE:ONLINE</span>
            <span style={{fontSize:10,color:'var(--text-dim)'}}>VILLAS:42</span>
            <span style={{fontSize:10,color:'var(--text-dim)'}}>DEST:6</span>
          </div>
          <span style={{fontSize:10,color:'var(--text-dim)'}}>v2026.03</span>
        </div>

        {/* Copyright — raw */}
        <div style={{display:'flex',justifyContent:'space-between',padding:'14px 0'}}>
          <p style={{fontSize:10,color:'var(--text-dim)'}}>© ARIVIA VILLAS LTD. 2018–2026</p>
          <p style={{fontSize:10,color:'var(--text-dim)'}}>ALL RIGHTS RESERVED</p>
          <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} style={{fontSize:10,color:'var(--text-dim)',background:'none',border:'1px solid var(--text-dim)',padding:'4px 12px',cursor:'pointer',fontFamily:'var(--mono2)',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.color='var(--text)';e.currentTarget.style.borderColor='var(--text)'}} onMouseLeave={e=>{e.currentTarget.style.color='var(--text-dim)';e.currentTarget.style.borderColor='var(--text-dim)'}}>↑ TOP</button>
        </div>
      </div>
    </footer>
  );
};


/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER 7: CONVERSATIONAL / CHAT-FIRST
   Trend: AI-native interfaces, the footer IS a conversation starter,
   chat bubble aesthetic, always-on concierge presence
   ═══════════════════════════════════════════════════════════════════════════ */
const Footer7Chat = () => {
  const [msg,setMsg]=useState('');
  const [msgs,setMsgs]=useState([
    {from:'bot',text:'Hi! I\'m your Arivia concierge. Ask me anything — villas, dates, destinations, experiences. 🌊'},
  ]);
  const [typing,setTyping]=useState(false);

  const sendMsg=()=>{
    if(!msg.trim()) return;
    setMsgs(m=>[...m,{from:'user',text:msg}]);
    setMsg('');
    setTyping(true);
    setTimeout(()=>{
      setTyping(false);
      setMsgs(m=>[...m,{from:'bot',text:'Great question! Our concierge team would love to help. Click "Chat with a Human" to continue this conversation with a real person who knows every villa personally. 🏡'}]);
    },1800);
  };

  return(
    <footer style={{background:'var(--bg)',borderTop:'1px solid var(--line)',padding:'48px 5% 40px'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <p style={{fontFamily:'var(--mono)',fontSize:10,letterSpacing:'.15em',color:'var(--text-dim)',textTransform:'uppercase',textAlign:'right',marginBottom:32}}>07 — Conversational</p>

        <div style={{display:'grid',gridTemplateColumns:'1fr 400px',gap:40,alignItems:'start'}}>
          {/* Left — traditional footer info */}
          <div>
            <div style={{fontFamily:'var(--serif)',fontSize:28,fontWeight:700,color:'var(--text)',marginBottom:24}}>Arivia<span style={{color:'var(--sand)'}}>.</span></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:28,marginBottom:32}}>
              {[{t:'Explore',l:['Villas','Destinations','Experiences','Journal']},{t:'Company',l:['About','Careers','Press','FAQ']},{t:'Legal',l:['Privacy','Terms','Cookies','Sitemap']}].map(col=>(<div key={col.t}><p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.2em',color:'var(--sand)',textTransform:'uppercase',marginBottom:12}}>{col.t}</p>{col.l.map(l=>(<a key={l} href="#" style={{display:'block',fontFamily:'var(--sans)',fontSize:13,color:'var(--text-dim)',textDecoration:'none',marginBottom:8,transition:'color .2s'}} onMouseEnter={e=>e.target.style.color='var(--text)'} onMouseLeave={e=>e.target.style.color='var(--text-dim)'}>{l}</a>))}</div>))}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:16,borderTop:'1px solid var(--line)'}}>
              <p style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)'}}>© 2026 Arivia Villas</p>
              <div style={{display:'flex',gap:10}}>{[Instagram,Twitter,Linkedin].map((Icon,i)=>(<div key={i} style={{width:32,height:32,borderRadius:8,border:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-dim)',cursor:'pointer',transition:'all .3s'}} onMouseEnter={e=>{e.currentTarget.style.color='var(--sand)';e.currentTarget.style.borderColor='var(--sand)'}} onMouseLeave={e=>{e.currentTarget.style.color='var(--text-dim)';e.currentTarget.style.borderColor='var(--line)'}}><Icon size={14}/></div>))}</div>
            </div>
          </div>

          {/* Right — Chat widget */}
          <div style={{background:'var(--card)',border:'1px solid var(--line2)',borderRadius:20,overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,.3)'}}>
            {/* Chat header */}
            <div style={{padding:'16px 20px',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',gap:12,background:'var(--bg3)'}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'var(--sand)',display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={18} color="var(--bg)"/></div>
              <div><p style={{fontFamily:'var(--sans)',fontSize:13,fontWeight:700,color:'var(--text)'}}>Arivia Concierge</p><p style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--sea)',display:'flex',alignItems:'center',gap:4}}><span style={{width:5,height:5,borderRadius:'50%',background:'var(--sea)'}}/>Online now</p></div>
            </div>
            {/* Messages */}
            <div style={{padding:'16px 16px 8px',maxHeight:240,overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>
              {msgs.map((m,i)=>(
                <div key={i} style={{display:'flex',justifyContent:m.from==='user'?'flex-end':'flex-start'}}>
                  <div style={{maxWidth:'80%',padding:'10px 14px',borderRadius:m.from==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',background:m.from==='user'?'var(--sand)':'var(--bg3)',color:m.from==='user'?'var(--bg)':'var(--text-mid)',fontFamily:'var(--sans)',fontSize:13,lineHeight:1.5}}>{m.text}</div>
                </div>
              ))}
              {typing&&<div style={{display:'flex',gap:4,padding:'8px 14px',background:'var(--bg3)',borderRadius:14,width:'fit-content'}}>{[0,1,2].map(i=>(<div key={i} style={{width:6,height:6,borderRadius:'50%',background:'var(--text-dim)',animation:`float 1.2s ${i*.15}s infinite`}}/>))}</div>}
            </div>
            {/* Input */}
            <div style={{padding:'12px 16px',borderTop:'1px solid var(--line)',display:'flex',gap:8}}>
              <input placeholder="Ask me anything..." value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')sendMsg()}} style={{flex:1,background:'var(--bg3)',border:'1px solid var(--line2)',borderRadius:10,padding:'10px 14px',fontFamily:'var(--sans)',fontSize:13,color:'var(--text)',outline:'none'}} onFocus={e=>e.target.style.borderColor='var(--sand)'} onBlur={e=>e.target.style.borderColor='var(--line2)'}/>
              <button onClick={sendMsg} style={{width:40,height:40,borderRadius:10,background:'var(--sand)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'background .3s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--warm)'} onMouseLeave={e=>e.currentTarget.style.background='var(--sand)'}><Send size={16} color="var(--bg)"/></button>
            </div>
            {/* Human CTA */}
            <div style={{padding:'10px 16px 14px',textAlign:'center'}}>
              <button style={{fontFamily:'var(--sans)',fontSize:11,color:'var(--sand)',background:'none',border:'1px solid var(--sand-dim)',borderRadius:8,padding:'8px 20px',cursor:'pointer',transition:'all .3s',letterSpacing:'.05em'}} onMouseEnter={e=>{e.currentTarget.style.background='var(--sand)';e.currentTarget.style.color='var(--bg)'}} onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='var(--sand)'}}>
                <User size={12} style={{marginRight:6,verticalAlign:'middle'}}/>Chat with a Human
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};


/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER 8: KINETIC TICKER
   Trend: Scrolling text walls, oversized kinetic typography,
   moving marquees in multiple directions, dynamic energy
   ═══════════════════════════════════════════════════════════════════════════ */
const Footer8Kinetic = () => {
  const [hl,setHl]=useState(null);
  const [email,setEmail]=useState('');

  const Marquee=({children,speed=30,reverse,style:s})=>(<div style={{overflow:'hidden',whiteSpace:'nowrap',...s}}><div style={{display:'inline-flex',gap:0,animation:`${reverse?'marquee-r':'marquee'} ${speed}s linear infinite`}}>{children}{children}</div></div>);

  return(
    <footer style={{background:'var(--bg)',overflow:'hidden'}}>
      <p style={{fontFamily:'var(--mono)',fontSize:10,letterSpacing:'.15em',color:'var(--text-dim)',textTransform:'uppercase',textAlign:'right',padding:'12px 5% 0'}}>08 — Kinetic</p>

      {/* TICKER 1 — Giant destination names */}
      <Marquee speed={40} style={{padding:'24px 0',borderTop:'1px solid var(--line)',borderBottom:'1px solid var(--line)'}}>
        {['SANTORINI','TUSCANY','BALI','MALDIVES','PROVENCE','AMALFI','MYKONOS','UBUD'].map(d=>(
          <span key={d} style={{fontFamily:'var(--serif)',fontSize:'clamp(40px,6vw,80px)',fontWeight:700,color:'var(--text)',opacity:.06,letterSpacing:'-0.03em',padding:'0 32px',userSelect:'none'}}>{d}<span style={{color:'var(--sand)',opacity:1}}>·</span></span>
        ))}
      </Marquee>

      {/* Main content */}
      <div style={{maxWidth:1200,margin:'0 auto',padding:'48px 5%'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1.5fr',gap:40,marginBottom:48}}>
          {/* Brand */}
          <div>
            <div style={{fontFamily:'var(--serif)',fontSize:32,fontWeight:700,color:'var(--text)',marginBottom:16}}>Arivia<span style={{color:'var(--sand)'}}>.</span></div>
            <p style={{fontFamily:'var(--sans)',fontSize:14,color:'var(--text-dim)',lineHeight:1.7,marginBottom:20}}>Luxury living, redefined. 42 handpicked villas across 6 extraordinary destinations.</p>
            <div style={{display:'flex',gap:8}}>
              {[Instagram,Twitter,Linkedin,Youtube].map((Icon,i)=>(<div key={i} style={{width:38,height:38,borderRadius:10,background:'var(--bg3)',border:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-dim)',cursor:'pointer',transition:'all .3s'}} onMouseEnter={e=>{e.currentTarget.style.color='var(--sand)';e.currentTarget.style.borderColor='var(--sand)'}} onMouseLeave={e=>{e.currentTarget.style.color='var(--text-dim)';e.currentTarget.style.borderColor='var(--line)'}}><Icon size={15}/></div>))}
            </div>
          </div>
          {/* Nav 1 */}
          <div>
            <p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.2em',color:'var(--sand)',textTransform:'uppercase',marginBottom:16}}>Explore</p>
            {['Villas','Destinations','Experiences','Journal','About Us'].map(l=>(<a key={l} href="#" onMouseEnter={()=>setHl(l)} onMouseLeave={()=>setHl(null)} style={{display:'flex',alignItems:'center',gap:8,fontFamily:'var(--sans)',fontSize:14,color:hl===l?'var(--sand)':'var(--text-dim)',textDecoration:'none',padding:'8px 0',borderBottom:'1px solid var(--line)',transition:'all .25s',transform:hl===l?'translateX(8px)':'translateX(0)'}}><ChevronRight size={12} style={{opacity:hl===l?1:0,transition:'opacity .2s'}}/>{l}</a>))}
          </div>
          {/* Nav 2 */}
          <div>
            <p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.2em',color:'var(--sand)',textTransform:'uppercase',marginBottom:16}}>Support</p>
            {['FAQ','Contact','Booking Policy','Privacy','Terms'].map(l=>(<a key={l} href="#" onMouseEnter={()=>setHl(l)} onMouseLeave={()=>setHl(null)} style={{display:'flex',alignItems:'center',gap:8,fontFamily:'var(--sans)',fontSize:14,color:hl===l?'var(--sand)':'var(--text-dim)',textDecoration:'none',padding:'8px 0',borderBottom:'1px solid var(--line)',transition:'all .25s',transform:hl===l?'translateX(8px)':'translateX(0)'}}><ChevronRight size={12} style={{opacity:hl===l?1:0,transition:'opacity .2s'}}/>{l}</a>))}
          </div>
          {/* Newsletter */}
          <div>
            <p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.2em',color:'var(--coral)',textTransform:'uppercase',marginBottom:16}}><Mail size={11} style={{marginRight:4,verticalAlign:'middle'}}/>Stay Inspired</p>
            <p style={{fontFamily:'var(--serif)',fontSize:20,fontWeight:600,color:'var(--text)',marginBottom:8}}>The Arivia Letter</p>
            <p style={{fontFamily:'var(--sans)',fontSize:13,color:'var(--text-dim)',lineHeight:1.6,marginBottom:16}}>Travel stories & new villas, monthly.</p>
            <div style={{display:'flex',gap:6}}>
              <input placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={{flex:1,background:'var(--bg3)',border:'1px solid var(--line2)',borderRadius:10,padding:'12px 14px',fontFamily:'var(--sans)',fontSize:13,color:'var(--text)',outline:'none'}} onFocus={e=>e.target.style.borderColor='var(--sand)'} onBlur={e=>e.target.style.borderColor='var(--line2)'}/>
              <button style={{padding:'0 18px',background:'var(--sand)',border:'none',borderRadius:10,cursor:'pointer',display:'flex',alignItems:'center',transition:'background .3s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--warm)'} onMouseLeave={e=>e.currentTarget.style.background='var(--sand)'}><Send size={16} color="var(--bg)"/></button>
            </div>
          </div>
        </div>
      </div>

      {/* TICKER 2 — Reverse, smaller, taglines */}
      <Marquee speed={50} reverse style={{padding:'12px 0',borderTop:'1px solid var(--line)',borderBottom:'1px solid var(--line)'}}>
        {['HANDPICKED LUXURY','PERSONAL CONCIERGE','87-POINT INSPECTION','FREE CANCELLATION','CURATED EXPERIENCES','SUSTAINABLE TRAVEL','24/7 SUPPORT','BOOK DIRECT'].map(t=>(
          <span key={t} style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)',letterSpacing:'.15em',padding:'0 28px',display:'flex',alignItems:'center',gap:16}}>
            <span style={{width:4,height:4,borderRadius:'50%',background:'var(--sand)',opacity:.3}}/>{t}
          </span>
        ))}
      </Marquee>

      {/* Bottom */}
      <div style={{maxWidth:1200,margin:'0 auto',padding:'16px 5%',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <p style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)'}}>© 2026 Arivia Villas</p>
        <p style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)'}}><span style={{color:'var(--sand)'}}>●</span> Athens <span style={{color:'var(--sea)',marginLeft:10}}>●</span> Milan <span style={{color:'var(--coral)',marginLeft:10}}>●</span> Ubud</p>
        <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'1px solid var(--line)',borderRadius:8,padding:'6px 14px',fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',cursor:'pointer',transition:'all .3s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--sand)';e.currentTarget.style.color='var(--sand)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--line)';e.currentTarget.style.color='var(--text-dim)'}}><ArrowUp size={12}/>TOP</button>
      </div>
    </footer>
  );
};


/* ═══════════════════════════════════════════════════════════════════════════
   MAIN SHOWCASE — 8 FOOTER SELECTOR
   ═══════════════════════════════════════════════════════════════════════════ */
const FOOTERS = [
  { id:1, name:'Bento Grid', desc:'Asymmetric card mosaic', Comp:Footer1Bento, accent:'var(--sand)' },
  { id:2, name:'Immersive', desc:'Full-bleed + cinematic CTA', Comp:Footer2Immersive, accent:'var(--coral)' },
  { id:3, name:'Minimal', desc:'Hover-expand columns', Comp:Footer3Minimal, accent:'var(--sea)' },
  { id:4, name:'Editorial', desc:'Typography-forward magazine', Comp:Footer4Editorial, accent:'var(--sky)' },
  { id:5, name:'Glassmorphic', desc:'Frosted overlapping panels', Comp:Footer5Glass, accent:'var(--warm)' },
  { id:6, name:'Brutalist', desc:'Raw terminal anti-design', Comp:Footer6Brutalist, accent:'var(--text)' },
  { id:7, name:'Chat-First', desc:'AI concierge conversation', Comp:Footer7Chat, accent:'var(--gold)' },
  { id:8, name:'Kinetic', desc:'Scrolling ticker typography', Comp:Footer8Kinetic, accent:'var(--coral)' },
];

export default function FooterShowcase() {
  const [active, setActive] = useState(0);
  const ActiveFooter = FOOTERS[active].Comp;

  return (
    <div style={{background:'var(--bg)',color:'var(--text)',minHeight:'100vh',fontFamily:'var(--sans)'}}>
      <style>{STYLE}</style>
      <header style={{position:'fixed',top:0,left:0,right:0,zIndex:100,padding:'14px 5%',background:'rgba(10,10,15,.92)',backdropFilter:'blur(16px)',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontFamily:'var(--serif)',fontSize:22,fontWeight:700,color:'var(--text)'}}>Arivia<span style={{color:'var(--sand)'}}>.</span></div>
        <p style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)'}}>8 Footer Designs — 2026</p>
      </header>

      <div style={{paddingTop:80,maxWidth:1100,margin:'0 auto',padding:'80px 5% 40px',textAlign:'center'}}>
        <p style={{fontFamily:'var(--sans)',fontSize:11,letterSpacing:'.3em',color:'var(--sand)',textTransform:'uppercase',marginBottom:14}}>Choose a Style</p>
        <h1 style={{fontFamily:'var(--serif)',fontSize:'clamp(28px,4vw,44px)',fontWeight:700,color:'var(--text)',lineHeight:1.1,marginBottom:32}}>8 Footer <em style={{fontWeight:400,color:'var(--warm)'}}>Designs</em></h1>

        {/* 2 rows of 4 */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
          {FOOTERS.map((f,i) => (
            <button key={f.id} onClick={()=>setActive(i)} style={{
              padding:'16px 12px',borderRadius:12,cursor:'pointer',transition:'all .4s',textAlign:'center',
              background: active===i ? 'var(--card)' : 'var(--bg2)',
              border: `2px solid ${active===i ? f.accent : 'var(--line)'}`,
              boxShadow: active===i ? `0 0 20px ${f.accent}12` : 'none',
              transform: active===i ? 'translateY(-2px)' : 'none',
            }}>
              <p style={{fontFamily:'var(--serif)',fontSize:28,fontWeight:700,color:active===i?f.accent:'var(--text-dim)',lineHeight:1,marginBottom:6,transition:'color .3s'}}>0{f.id}</p>
              <p style={{fontFamily:'var(--sans)',fontSize:12,fontWeight:700,color:active===i?'var(--text)':'var(--text-mid)',marginBottom:2,transition:'color .3s'}}>{f.name}</p>
              <p style={{fontFamily:'var(--sans)',fontSize:10,color:'var(--text-dim)',lineHeight:1.3}}>{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:600,margin:'0 auto',padding:'0 5% 60px',textAlign:'center'}}>
        <div style={{width:50,height:1,background:'var(--line)',margin:'0 auto 20px'}}/>
        <p style={{fontFamily:'var(--serif)',fontSize:16,fontStyle:'italic',color:'var(--text-dim)'}}>Scroll down to preview the selected footer in context.</p>
        <div style={{height:120,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{width:2,height:40,background:'var(--sand)',opacity:.2,borderRadius:1}}/></div>
      </div>

      <ActiveFooter/>
    </div>
  );
}
