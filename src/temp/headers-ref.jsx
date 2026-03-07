import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, X, ChevronDown, ChevronRight, ArrowRight, ArrowUpRight,
  Globe, Sun, Heart, Compass, Sparkles, Layers, Home, BookOpen,
  Instagram, Twitter
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   ARIVIA VILLAS — 8 MODERN HEADER DESIGNS (2026 TRENDS)
   
   1. FLOATING GLASS — Transparent glassmorphic, scroll-morph
   2. SPLIT CENTER — Logo centered, nav split left/right
   3. MEGA MENU — Hover-reveal rich dropdown panels
   4. TICKER BAR — Top info ribbon + clean nav below
   5. COMMAND PALETTE — Minimal + ⌘K spotlight search overlay
   6. DOCK NAV — macOS-style magnifying icon dock
   7. FULL-SCREEN OVERLAY — Hamburger → cinematic reveal
   8. CONTEXTUAL STRIP — Thin colored strip with morphing states
   ═══════════════════════════════════════════════════════════════════════════ */

const NAV = ['Villas','Destinations','Experiences','Journal','About'];
const DESTS = ['Santorini','Bali','Tuscany','Maldives','Provence','Amalfi Coast'];

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&family=DM+Mono:wght@300;400&display=swap');
:root{
  --bg:#0a0a0f;--bg2:#111118;--bg3:#1a1a24;--card:#15151f;
  --line:rgba(255,255,255,.06);--line2:rgba(255,255,255,.1);
  --text:#f0ece4;--text-mid:#a8a29e;--text-dim:#6b6560;
  --sand:#d4a574;--sand-dim:rgba(212,165,116,.15);--sand-glow:rgba(212,165,116,.08);
  --warm:#e8c4a0;--coral:#e07a5f;--sea:#81b29a;--sky:#90bce0;--gold:#c9a96e;
  --serif:'Playfair Display',Georgia,serif;
  --sans:'Lato',-apple-system,sans-serif;
  --mono:'DM Mono',monospace;
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text)}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--text-dim);border-radius:3px}

@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideRight{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes expandIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes curtainDown{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes staggerFade{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
`;

const Logo = ({size=22, style:s}) => (
  <div style={{fontFamily:'var(--serif)',fontSize:size,fontWeight:700,color:'var(--text)',letterSpacing:'-0.02em',cursor:'pointer',...s}}>
    Arivia<span style={{color:'var(--sand)'}}>.</span>
  </div>
);

const Btn = ({children,primary,small,style:s,...p}) => (
  <button {...p} style={{padding:small?'8px 18px':'12px 28px',background:primary?'var(--sand)':'transparent',border:primary?'none':'1px solid var(--sand)',color:primary?'var(--bg)':'var(--sand)',fontFamily:'var(--sans)',fontSize:small?11:12,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',cursor:'pointer',borderRadius:6,transition:'all .3s',display:'inline-flex',alignItems:'center',gap:6,...s}}
    onMouseEnter={e=>{if(primary)e.currentTarget.style.background='var(--warm)';else{e.currentTarget.style.background='var(--sand)';e.currentTarget.style.color='var(--bg)'}}}
    onMouseLeave={e=>{if(primary)e.currentTarget.style.background='var(--sand)';else{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--sand)'}}}
  >{children}</button>
);


/* ═══════════════════════════════════════════════════════════════════════════
   HEADER 1: FLOATING GLASS
   Trend: Transparent → frosted on scroll, rounded pill shape, 
   floating with margin, glassmorphic depth
   ═══════════════════════════════════════════════════════════════════════════ */
const Header1Glass = () => {
  const [scrolled,setScrolled]=useState(false);
  const [hov,setHov]=useState(null);
  useEffect(()=>{const f=()=>setScrolled(window.scrollY>80);window.addEventListener('scroll',f);return()=>window.removeEventListener('scroll',f)},[]);

  return(
    <header style={{
      position:'fixed',top:scrolled?8:16,left:'50%',transform:'translateX(-50%)',zIndex:100,
      width:scrolled?'94%':'90%',maxWidth:1200,
      padding:scrolled?'10px 24px':'14px 32px',
      background:scrolled?'rgba(17,17,24,.85)':'rgba(17,17,24,.4)',
      backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
      border:`1px solid ${scrolled?'rgba(255,255,255,.08)':'rgba(255,255,255,.04)'}`,
      borderRadius:scrolled?16:20,
      boxShadow:scrolled?'0 8px 32px rgba(0,0,0,.3)':'none',
      transition:'all .5s cubic-bezier(.16,1,.3,1)',
      display:'flex',alignItems:'center',justifyContent:'space-between',
    }}>
      <Logo size={scrolled?20:22}/>
      <nav style={{display:'flex',gap:4}}>
        {NAV.map(t=>(
          <a key={t} href="#"
            onMouseEnter={()=>setHov(t)} onMouseLeave={()=>setHov(null)}
            style={{
              padding:'8px 16px',borderRadius:10,
              fontFamily:'var(--sans)',fontSize:13,textDecoration:'none',
              color:hov===t?'var(--sand)':'var(--text-mid)',
              background:hov===t?'var(--sand-glow)':'transparent',
              transition:'all .3s',cursor:'pointer',
            }}
          >{t}</a>
        ))}
      </nav>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-dim)',transition:'all .3s'}}
          onMouseEnter={e=>{e.currentTarget.style.color='var(--sand)';e.currentTarget.style.borderColor='var(--sand)'}}
          onMouseLeave={e=>{e.currentTarget.style.color='var(--text-dim)';e.currentTarget.style.borderColor='rgba(255,255,255,.06)'}}
        ><Search size={15}/></div>
        <Btn primary small>Book</Btn>
      </div>
    </header>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER 2: SPLIT CENTER
   Trend: Logo centered, nav items split left/right of logo,
   symmetrical balance, editorial feel
   ═══════════════════════════════════════════════════════════════════════════ */
const Header2Split = () => {
  const [scrolled,setScrolled]=useState(false);
  const [hov,setHov]=useState(null);
  useEffect(()=>{const f=()=>setScrolled(window.scrollY>40);window.addEventListener('scroll',f);return()=>window.removeEventListener('scroll',f)},[]);

  const leftNav = ['Villas','Destinations','Experiences'];
  const rightNav = ['Journal','About','Contact'];

  return(
    <header style={{
      position:'fixed',top:0,left:0,right:0,zIndex:100,
      padding:scrolled?'10px 5%':'16px 5%',
      background:scrolled?'rgba(10,10,15,.94)':'transparent',
      backdropFilter:scrolled?'blur(16px)':'none',
      borderBottom:scrolled?'1px solid var(--line)':'1px solid transparent',
      transition:'all .4s ease',
    }}>
      <div style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center'}}>
        {/* Left nav */}
        <nav style={{display:'flex',gap:28,justifyContent:'flex-end',paddingRight:40}}>
          {leftNav.map(t=>(
            <a key={t} href="#" onMouseEnter={()=>setHov(t)} onMouseLeave={()=>setHov(null)}
              style={{fontFamily:'var(--sans)',fontSize:13,textDecoration:'none',letterSpacing:'.04em',color:hov===t?'var(--sand)':'var(--text-mid)',transition:'color .3s',cursor:'pointer',position:'relative'}}
            >
              {t}
              <span style={{position:'absolute',bottom:-4,left:0,right:0,height:1,background:'var(--sand)',transform:hov===t?'scaleX(1)':'scaleX(0)',transition:'transform .3s',transformOrigin:'center'}}/>
            </a>
          ))}
        </nav>
        {/* Center logo */}
        <Logo size={scrolled?22:26} style={{transition:'font-size .4s'}}/>
        {/* Right nav */}
        <nav style={{display:'flex',gap:28,paddingLeft:40,alignItems:'center'}}>
          {rightNav.map(t=>(
            <a key={t} href="#" onMouseEnter={()=>setHov(t)} onMouseLeave={()=>setHov(null)}
              style={{fontFamily:'var(--sans)',fontSize:13,textDecoration:'none',letterSpacing:'.04em',color:hov===t?'var(--sand)':'var(--text-mid)',transition:'color .3s',cursor:'pointer',position:'relative'}}
            >
              {t}
              <span style={{position:'absolute',bottom:-4,left:0,right:0,height:1,background:'var(--sand)',transform:hov===t?'scaleX(1)':'scaleX(0)',transition:'transform .3s',transformOrigin:'center'}}/>
            </a>
          ))}
          <Btn primary small style={{marginLeft:12}}>Book</Btn>
        </nav>
      </div>
    </header>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER 3: MEGA MENU
   Trend: Hover-reveal rich dropdown panels with images, 
   featured content, multi-column layouts
   ═══════════════════════════════════════════════════════════════════════════ */
const Header3Mega = () => {
  const [scrolled,setScrolled]=useState(false);
  const [openMenu,setOpenMenu]=useState(null);
  useEffect(()=>{const f=()=>setScrolled(window.scrollY>40);window.addEventListener('scroll',f);return()=>window.removeEventListener('scroll',f)},[]);

  const MENUS = {
    Villas: {
      cols:[
        {title:'By Type',links:['All Villas','Beachfront','Mountain','Countryside','Overwater']},
        {title:'By Feature',links:['Infinity Pool','Pet Friendly','Family','Romantic','Instant Book']},
      ],
      featured:{title:'New: Villa Meltemi',sub:'Mykonos, Greece — Now available',img:'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=400&q=80'},
    },
    Destinations: {
      cols:[
        {title:'Europe',links:['Santorini','Tuscany','Amalfi Coast','Provence','Mykonos']},
        {title:'Asia & Indian Ocean',links:['Bali','Ubud','Maldives']},
      ],
      featured:{title:'Summer in Provence',sub:'Lavender fields are in bloom',img:'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&q=80'},
    },
    Experiences: {
      cols:[
        {title:'Categories',links:['Adventure','Culinary','Wellness','Culture','Water Sports']},
        {title:'Popular',links:['Sunset Sailing','Truffle Hunt','Yoga Retreat','Wine Tasting']},
      ],
      featured:{title:'Private Chef Dinners',sub:'Our #1 rated experience',img:'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=400&q=80'},
    },
  };

  return(
    <>
      <header style={{
        position:'fixed',top:0,left:0,right:0,zIndex:100,
        padding:scrolled?'10px 5%':'16px 5%',
        background:'rgba(10,10,15,.94)',backdropFilter:'blur(16px)',
        borderBottom:'1px solid var(--line)',transition:'all .4s',
      }}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Logo/>
          <nav style={{display:'flex',gap:4}} onMouseLeave={()=>setOpenMenu(null)}>
            {NAV.map(t=>(
              <div key={t} onMouseEnter={()=>setOpenMenu(MENUS[t]?t:null)} style={{position:'relative'}}>
                <a href="#" style={{
                  padding:'10px 16px',fontFamily:'var(--sans)',fontSize:13,textDecoration:'none',
                  color:openMenu===t?'var(--sand)':'var(--text-mid)',transition:'color .2s',cursor:'pointer',
                  display:'flex',alignItems:'center',gap:4,
                }}>
                  {t}
                  {MENUS[t]&&<ChevronDown size={12} style={{transition:'transform .3s',transform:openMenu===t?'rotate(180deg)':'rotate(0)'}}/>}
                </a>
              </div>
            ))}
          </nav>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <Search size={16} style={{color:'var(--text-dim)',cursor:'pointer'}}/>
            <Btn primary small>Book Now</Btn>
          </div>
        </div>
      </header>

      {/* Mega dropdown */}
      {openMenu && MENUS[openMenu] && (
        <div onMouseEnter={()=>{}} onMouseLeave={()=>setOpenMenu(null)} style={{
          position:'fixed',top:56,left:0,right:0,zIndex:99,
          background:'rgba(17,17,24,.97)',backdropFilter:'blur(20px)',
          borderBottom:'1px solid var(--line)',
          animation:'slideDown .3s cubic-bezier(.16,1,.3,1)',
          padding:'28px 5%',
        }}>
          <div style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr 280px',gap:32}}>
            {MENUS[openMenu].cols.map((col,i)=>(
              <div key={i}>
                <p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.2em',color:'var(--sand)',textTransform:'uppercase',marginBottom:14,paddingBottom:8,borderBottom:'1px solid var(--line)'}}>{col.title}</p>
                {col.links.map(l=>(
                  <a key={l} href="#" style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontFamily:'var(--sans)',fontSize:14,color:'var(--text-dim)',textDecoration:'none',padding:'10px 0',borderBottom:'1px solid var(--line)',transition:'all .2s'}}
                    onMouseEnter={e=>{e.currentTarget.style.color='var(--text)';e.currentTarget.style.paddingLeft='8px'}}
                    onMouseLeave={e=>{e.currentTarget.style.color='var(--text-dim)';e.currentTarget.style.paddingLeft='0'}}
                  >{l}<ArrowUpRight size={12} style={{color:'var(--sand)',opacity:.4}}/></a>
                ))}
              </div>
            ))}
            {/* Featured card */}
            <div style={{borderRadius:14,overflow:'hidden',position:'relative',cursor:'pointer'}}>
              <img src={MENUS[openMenu].featured.img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(10,10,15,.9) 0%,transparent 50%)'}}/>
              <div style={{position:'absolute',bottom:16,left:16,right:16}}>
                <p style={{fontFamily:'var(--sans)',fontSize:10,letterSpacing:'.12em',color:'var(--sand)',textTransform:'uppercase',marginBottom:4}}>Featured</p>
                <p style={{fontFamily:'var(--serif)',fontSize:16,fontWeight:600,color:'var(--text)',marginBottom:2}}>{MENUS[openMenu].featured.title}</p>
                <p style={{fontFamily:'var(--sans)',fontSize:12,color:'var(--text-dim)'}}>{MENUS[openMenu].featured.sub}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER 4: TICKER BAR
   Trend: Top information ribbon (announcements, offers) with infinite
   scroll + clean navigation bar below
   ═══════════════════════════════════════════════════════════════════════════ */
const Header4Ticker = () => {
  const [scrolled,setScrolled]=useState(false);
  const [hov,setHov]=useState(null);
  const [tickerVisible,setTickerVisible]=useState(true);
  useEffect(()=>{const f=()=>setScrolled(window.scrollY>40);window.addEventListener('scroll',f);return()=>window.removeEventListener('scroll',f)},[]);

  return(
    <div style={{position:'fixed',top:0,left:0,right:0,zIndex:100}}>
      {/* Ticker ribbon */}
      {tickerVisible && (
        <div style={{
          background:'var(--sand)',padding:'6px 0',overflow:'hidden',position:'relative',
          transition:'all .3s',height:scrolled?0:28,opacity:scrolled?0:1,
        }}>
          <div style={{display:'flex',animation:'marquee 40s linear infinite',whiteSpace:'nowrap',width:'max-content'}}>
            {[...Array(2)].map((_,r)=>(
              <div key={r} style={{display:'flex',gap:40}}>
                {['Summer 2026: 6 new villas added','Free cancellation on all bookings','Book direct — best price guaranteed','New: Private chef experiences in Tuscany'].map((t,i)=>(
                  <span key={t+r} style={{fontFamily:'var(--sans)',fontSize:11,fontWeight:700,color:'var(--bg)',display:'flex',alignItems:'center',gap:8}}>
                    <Sparkles size={11}/>{t}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <button onClick={()=>setTickerVisible(false)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'rgba(10,10,15,.4)',cursor:'pointer',padding:2}}>
            <X size={13}/>
          </button>
        </div>
      )}
      {/* Nav bar */}
      <header style={{
        padding:'12px 5%',
        background:'rgba(10,10,15,.94)',backdropFilter:'blur(16px)',
        borderBottom:'1px solid var(--line)',transition:'all .4s',
        display:'flex',alignItems:'center',justifyContent:'space-between',
      }}>
        <Logo size={22}/>
        <nav style={{display:'flex',gap:28}}>
          {NAV.map(t=>(
            <a key={t} href="#" onMouseEnter={()=>setHov(t)} onMouseLeave={()=>setHov(null)}
              style={{fontFamily:'var(--sans)',fontSize:13,textDecoration:'none',letterSpacing:'.04em',color:hov===t?'var(--sand)':'var(--text-mid)',transition:'color .3s',cursor:'pointer'}}
            >{t}</a>
          ))}
        </nav>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--sea)',display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'var(--sea)',animation:'pulse-dot 2s infinite'}}/>Concierge Online
          </div>
          <Btn primary small>Book Now</Btn>
        </div>
      </header>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER 5: COMMAND PALETTE
   Trend: Minimal header + ⌘K spotlight-style search overlay,
   keyboard-first navigation, app-like feel
   ═══════════════════════════════════════════════════════════════════════════ */
const Header5Command = () => {
  const [scrolled,setScrolled]=useState(false);
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const inputRef=useRef(null);
  useEffect(()=>{const f=()=>setScrolled(window.scrollY>40);window.addEventListener('scroll',f);return()=>window.removeEventListener('scroll',f)},[]);
  useEffect(()=>{const f=e=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();setOpen(true)}if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f)},[]);
  useEffect(()=>{if(open)setTimeout(()=>inputRef.current?.focus(),100)},[open]);

  const ALL_ITEMS=[
    {cat:'Pages',items:['Home','Villas','Destinations','Experiences','Journal','About','FAQ','Contact']},
    {cat:'Destinations',items:DESTS},
    {cat:'Actions',items:['Book a Villa','Talk to Concierge','Browse Experiences','Read Journal']},
  ];
  const filtered=query?ALL_ITEMS.map(g=>({...g,items:g.items.filter(i=>i.toLowerCase().includes(query.toLowerCase()))})).filter(g=>g.items.length>0):ALL_ITEMS;

  return(
    <>
      <header style={{
        position:'fixed',top:0,left:0,right:0,zIndex:100,
        padding:'12px 5%',background:scrolled?'rgba(10,10,15,.94)':'rgba(10,10,15,.6)',
        backdropFilter:'blur(16px)',borderBottom:'1px solid var(--line)',transition:'all .4s',
        display:'flex',alignItems:'center',justifyContent:'space-between',
      }}>
        <Logo/>
        <nav style={{display:'flex',gap:28}}>
          {NAV.map(t=>(<a key={t} href="#" style={{fontFamily:'var(--sans)',fontSize:13,textDecoration:'none',color:'var(--text-mid)',transition:'color .3s',cursor:'pointer'}} onMouseEnter={e=>e.target.style.color='var(--sand)'} onMouseLeave={e=>e.target.style.color='var(--text-mid)'}>{t}</a>))}
        </nav>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {/* Search trigger */}
          <button onClick={()=>setOpen(true)} style={{
            display:'flex',alignItems:'center',gap:10,padding:'7px 14px',
            background:'var(--bg3)',border:'1px solid var(--line2)',borderRadius:8,
            fontFamily:'var(--sans)',fontSize:12,color:'var(--text-dim)',cursor:'pointer',transition:'all .3s',
          }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--sand)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--line2)'}
          >
            <Search size={13}/>Search
            <span style={{fontFamily:'var(--mono)',fontSize:10,padding:'2px 6px',background:'var(--bg)',borderRadius:4,border:'1px solid var(--line)',color:'var(--text-dim)'}}>⌘K</span>
          </button>
          <Btn primary small>Book</Btn>
        </div>
      </header>

      {/* Command palette overlay */}
      {open && (
        <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,.6)',backdropFilter:'blur(4px)',display:'flex',justifyContent:'center',paddingTop:'15vh',animation:'fadeIn .2s ease'}} onClick={()=>setOpen(false)}>
          <div style={{width:'100%',maxWidth:560,background:'var(--bg2)',border:'1px solid var(--line2)',borderRadius:16,overflow:'hidden',boxShadow:'0 30px 80px rgba(0,0,0,.5)',maxHeight:'60vh',display:'flex',flexDirection:'column',animation:'expandIn .25s cubic-bezier(.16,1,.3,1)'}} onClick={e=>e.stopPropagation()}>
            {/* Input */}
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'16px 20px',borderBottom:'1px solid var(--line)'}}>
              <Search size={18} style={{color:'var(--sand)',flexShrink:0}}/>
              <input ref={inputRef} placeholder="Search villas, destinations, pages..." value={query} onChange={e=>setQuery(e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontFamily:'var(--sans)',fontSize:16,color:'var(--text)'}}/>
              <button onClick={()=>setOpen(false)} style={{padding:'4px 10px',background:'var(--bg3)',border:'1px solid var(--line)',borderRadius:6,fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',cursor:'pointer'}}>ESC</button>
            </div>
            {/* Results */}
            <div style={{overflowY:'auto',padding:'8px'}}>
              {filtered.map(g=>(
                <div key={g.cat} style={{marginBottom:8}}>
                  <p style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.2em',color:'var(--text-dim)',textTransform:'uppercase',padding:'8px 12px'}}>{g.cat}</p>
                  {g.items.map(item=>(
                    <button key={item} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:'none',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'var(--sans)',fontSize:14,color:'var(--text-mid)',textAlign:'left',transition:'all .15s'}}
                      onMouseEnter={e=>{e.currentTarget.style.background='var(--sand-glow)';e.currentTarget.style.color='var(--text)'}}
                      onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='var(--text-mid)'}}
                      onClick={()=>setOpen(false)}
                    >
                      <ChevronRight size={13} style={{color:'var(--sand)',opacity:.5}}/>{item}
                      <span style={{marginLeft:'auto',fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)'}}>↵</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            {/* Footer */}
            <div style={{padding:'10px 16px',borderTop:'1px solid var(--line)',display:'flex',gap:16,justifyContent:'center'}}>
              {[{k:'↑↓',l:'Navigate'},{k:'↵',l:'Select'},{k:'esc',l:'Close'}].map(h=>(
                <span key={h.k} style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',display:'flex',alignItems:'center',gap:4}}>
                  <span style={{padding:'2px 6px',background:'var(--bg3)',borderRadius:4,border:'1px solid var(--line)'}}>{h.k}</span>{h.l}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER 6: DOCK NAV
   Trend: macOS dock-style icon navigation with magnification on hover,
   playful yet refined, app-native feel
   ═══════════════════════════════════════════════════════════════════════════ */
const Header6Dock = () => {
  const [scrolled,setScrolled]=useState(false);
  const [hov,setHov]=useState(null);
  useEffect(()=>{const f=()=>setScrolled(window.scrollY>40);window.addEventListener('scroll',f);return()=>window.removeEventListener('scroll',f)},[]);

  const DOCK_ITEMS = [
    {id:'home',icon:Home,label:'Home',color:'var(--text-mid)'},
    {id:'villas',icon:Layers,label:'Villas',color:'var(--sand)'},
    {id:'dest',icon:Globe,label:'Destinations',color:'var(--sea)'},
    {id:'exp',icon:Compass,label:'Experiences',color:'var(--coral)'},
    {id:'journal',icon:BookOpen,label:'Journal',color:'var(--sky)'},
    {id:'about',icon:Heart,label:'About',color:'var(--warm)'},
  ];

  return(
    <header style={{position:'fixed',top:0,left:0,right:0,zIndex:100}}>
      {/* Top bar */}
      <div style={{
        padding:'10px 5%',background:scrolled?'rgba(10,10,15,.9)':'transparent',
        backdropFilter:scrolled?'blur(12px)':'none',transition:'all .4s',
        display:'flex',alignItems:'center',justifyContent:'space-between',
      }}>
        <Logo size={20}/>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <Search size={15} style={{color:'var(--text-dim)',cursor:'pointer'}}/>
          <Btn primary small>Book</Btn>
        </div>
      </div>
      {/* Dock */}
      <div style={{
        position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',
        display:'flex',gap:6,padding:'10px 16px',
        background:'rgba(17,17,24,.85)',backdropFilter:'blur(20px)',
        border:'1px solid rgba(255,255,255,.08)',borderRadius:20,
        boxShadow:'0 12px 40px rgba(0,0,0,.4)',
      }}>
        {DOCK_ITEMS.map(item=>{
          const Icon=item.icon;
          const isHov=hov===item.id;
          return(
            <div key={item.id}
              onMouseEnter={()=>setHov(item.id)} onMouseLeave={()=>setHov(null)}
              style={{
                display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:'pointer',
                transition:'all .3s cubic-bezier(.16,1,.3,1)',
                transform:isHov?'translateY(-8px) scale(1.2)':'translateY(0) scale(1)',
              }}
            >
              <div style={{
                width:isHov?48:40,height:isHov?48:40,borderRadius:12,
                background:isHov?`${item.color}20`:'var(--bg3)',
                border:`1px solid ${isHov?item.color:'var(--line)'}`,
                display:'flex',alignItems:'center',justifyContent:'center',
                transition:'all .3s cubic-bezier(.16,1,.3,1)',
              }}>
                <Icon size={isHov?22:18} style={{color:isHov?item.color:'var(--text-dim)',transition:'all .3s'}}/>
              </div>
              <span style={{
                fontFamily:'var(--mono)',fontSize:9,color:item.color,
                opacity:isHov?1:0,transform:isHov?'translateY(0)':'translateY(-4px)',
                transition:'all .2s',position:'absolute',bottom:-16,whiteSpace:'nowrap',
              }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </header>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER 7: FULL-SCREEN OVERLAY
   Trend: Minimal hamburger → cinematic full-screen nav with staggered
   reveals, oversized typography, category browsing
   ═══════════════════════════════════════════════════════════════════════════ */
const Header7Overlay = () => {
  const [scrolled,setScrolled]=useState(false);
  const [open,setOpen]=useState(false);
  const [hov,setHov]=useState(null);
  useEffect(()=>{const f=()=>setScrolled(window.scrollY>40);window.addEventListener('scroll',f);return()=>window.removeEventListener('scroll',f)},[]);
  useEffect(()=>{document.body.style.overflow=open?'hidden':'';return()=>{document.body.style.overflow=''}},[open]);

  const FULL_NAV = [
    {label:'Villas',sub:'42 handpicked properties'},
    {label:'Destinations',sub:'6 curated regions'},
    {label:'Experiences',sub:'Local expert-led activities'},
    {label:'Journal',sub:'Stories & travel inspiration'},
    {label:'About',sub:'Our story & team'},
    {label:'Contact',sub:'Talk to a human'},
  ];

  return(
    <>
      <header style={{
        position:'fixed',top:0,left:0,right:0,zIndex:100,
        padding:'14px 5%',background:scrolled?'rgba(10,10,15,.94)':'transparent',
        backdropFilter:scrolled?'blur(16px)':'none',
        borderBottom:scrolled?'1px solid var(--line)':'none',transition:'all .4s',
        display:'flex',alignItems:'center',justifyContent:'space-between',
      }}>
        <Logo/>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <Btn primary small>Book Now</Btn>
          {/* Hamburger */}
          <button onClick={()=>setOpen(true)} style={{
            width:40,height:40,borderRadius:10,background:'var(--bg3)',border:'1px solid var(--line2)',
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5,
            cursor:'pointer',transition:'all .3s',padding:0,
          }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--sand)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--line2)'}
          >
            <span style={{width:18,height:1.5,background:'var(--text-mid)',borderRadius:1,transition:'all .3s'}}/>
            <span style={{width:12,height:1.5,background:'var(--sand)',borderRadius:1,transition:'all .3s'}}/>
          </button>
        </div>
      </header>

      {/* Full-screen overlay */}
      {open && (
        <div style={{
          position:'fixed',inset:0,zIndex:200,background:'var(--bg)',
          display:'grid',gridTemplateColumns:'1fr 1fr',
          animation:'fadeIn .3s ease',
        }}>
          {/* Left — navigation */}
          <div style={{padding:'80px 8%',display:'flex',flexDirection:'column',justifyContent:'center'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:48}}>
              <Logo size={26}/>
              <button onClick={()=>setOpen(false)} style={{width:44,height:44,borderRadius:'50%',background:'var(--bg3)',border:'1px solid var(--line2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-mid)',transition:'all .3s'}}
                onMouseEnter={e=>{e.currentTarget.style.color='var(--sand)';e.currentTarget.style.borderColor='var(--sand)'}}
                onMouseLeave={e=>{e.currentTarget.style.color='var(--text-mid)';e.currentTarget.style.borderColor='var(--line2)'}}
              ><X size={20}/></button>
            </div>
            {FULL_NAV.map((item,i)=>(
              <a key={item.label} href="#"
                onMouseEnter={()=>setHov(item.label)} onMouseLeave={()=>setHov(null)}
                onClick={()=>setOpen(false)}
                style={{
                  display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'20px 0',borderBottom:'1px solid var(--line)',textDecoration:'none',
                  animation:`staggerFade .5s ${.1+i*.08}s cubic-bezier(.16,1,.3,1) both`,
                }}
              >
                <div>
                  <p style={{fontFamily:'var(--serif)',fontSize:hov===item.label?36:30,fontWeight:700,color:hov===item.label?'var(--sand)':'var(--text)',transition:'all .3s',lineHeight:1.1}}>{item.label}</p>
                  <p style={{fontFamily:'var(--sans)',fontSize:13,color:'var(--text-dim)',marginTop:4,opacity:hov===item.label?1:.5,transition:'opacity .3s'}}>{item.sub}</p>
                </div>
                <ArrowRight size={20} style={{color:'var(--sand)',opacity:hov===item.label?1:0,transform:hov===item.label?'translateX(0)':'translateX(-8px)',transition:'all .3s'}}/>
              </a>
            ))}
          </div>
          {/* Right — ambient image */}
          <div style={{position:'relative',overflow:'hidden'}}>
            <img src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1000&q=80" alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:.3}}/>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to right,var(--bg),transparent 40%)'}}/>
            {/* Bottom contact info */}
            <div style={{position:'absolute',bottom:'8%',right:'8%',textAlign:'right',animation:'staggerFade .6s .5s both'}}>
              <p style={{fontFamily:'var(--mono)',fontSize:10,letterSpacing:'.15em',color:'var(--sand)',textTransform:'uppercase',marginBottom:12}}>Contact</p>
              <p style={{fontFamily:'var(--sans)',fontSize:14,color:'var(--text-dim)',marginBottom:6}}>hello@ariviavillas.com</p>
              <p style={{fontFamily:'var(--sans)',fontSize:14,color:'var(--text-dim)',marginBottom:16}}>+30 210 123 4567</p>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                {[Instagram,Twitter].map((Icon,i)=>(<div key={i} style={{width:32,height:32,borderRadius:'50%',border:'1px solid var(--line2)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-dim)'}}><Icon size={14}/></div>))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER 8: CONTEXTUAL STRIP
   Trend: Ultra-thin color strip, morphing between states (default,
   search, scrolled), progressive disclosure, minimal footprint
   ═══════════════════════════════════════════════════════════════════════════ */
const Header8Strip = () => {
  const [scrolled,setScrolled]=useState(false);
  const [mode,setMode]=useState('nav'); // nav | search
  const [hov,setHov]=useState(null);
  const [query,setQuery]=useState('');
  const searchRef=useRef(null);
  useEffect(()=>{const f=()=>setScrolled(window.scrollY>60);window.addEventListener('scroll',f);return()=>window.removeEventListener('scroll',f)},[]);
  useEffect(()=>{if(mode==='search')setTimeout(()=>searchRef.current?.focus(),100)},[mode]);

  return(
    <header style={{position:'fixed',top:0,left:0,right:0,zIndex:100}}>
      {/* Color accent strip */}
      <div style={{height:3,background:'linear-gradient(90deg,var(--sand),var(--coral),var(--sea),var(--sky),var(--sand))',backgroundSize:'300% 100%'}}/>

      <div style={{
        padding:scrolled?'8px 5%':'12px 5%',
        background:'rgba(10,10,15,.94)',backdropFilter:'blur(16px)',
        borderBottom:'1px solid var(--line)',transition:'all .4s',
      }}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          {mode==='nav'?(
            <>
              <div style={{display:'flex',alignItems:'center',gap:32}}>
                <Logo size={scrolled?18:22} style={{transition:'all .4s'}}/>
                <nav style={{display:'flex',gap:4}}>
                  {NAV.map(t=>(
                    <a key={t} href="#" onMouseEnter={()=>setHov(t)} onMouseLeave={()=>setHov(null)}
                      style={{
                        padding:'6px 14px',borderRadius:6,fontFamily:'var(--sans)',fontSize:12,textDecoration:'none',
                        color:hov===t?'var(--sand)':'var(--text-mid)',background:hov===t?'var(--sand-glow)':'transparent',
                        transition:'all .25s',cursor:'pointer',fontWeight:hov===t?700:400,
                      }}
                    >{t}</a>
                  ))}
                </nav>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <button onClick={()=>setMode('search')} style={{width:34,height:34,borderRadius:8,background:'var(--bg3)',border:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-dim)',transition:'all .3s'}}
                  onMouseEnter={e=>{e.currentTarget.style.color='var(--sand)';e.currentTarget.style.borderColor='var(--sand)'}}
                  onMouseLeave={e=>{e.currentTarget.style.color='var(--text-dim)';e.currentTarget.style.borderColor='var(--line)'}}
                ><Search size={14}/></button>
                <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--sea)',display:'flex',alignItems:'center',gap:5}}>
                  <span style={{width:5,height:5,borderRadius:'50%',background:'var(--sea)',animation:'pulse-dot 2s infinite'}}/>Online
                </div>
                <Btn primary small>Book</Btn>
              </div>
            </>
          ):(
            /* Search mode — header morphs into search bar */
            <div style={{display:'flex',alignItems:'center',gap:12,width:'100%',animation:'fadeIn .2s ease'}}>
              <Search size={18} style={{color:'var(--sand)',flexShrink:0}}/>
              <input ref={searchRef} placeholder="Search villas, destinations, experiences..." value={query} onChange={e=>setQuery(e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontFamily:'var(--sans)',fontSize:15,color:'var(--text)'}}/>
              <button onClick={()=>{setMode('nav');setQuery('')}} style={{padding:'6px 14px',background:'var(--bg3)',border:'1px solid var(--line)',borderRadius:6,fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                <X size={12}/>Close
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


/* ═══════════════════════════════════════════════════════════════════════════
   MAIN SHOWCASE
   ═══════════════════════════════════════════════════════════════════════════ */
const HEADERS = [
  { id:1, name:'Floating Glass', desc:'Pill-shaped glassmorphic, scroll-morph', Comp:Header1Glass, accent:'var(--sand)' },
  { id:2, name:'Split Center', desc:'Logo centered, nav split left/right', Comp:Header2Split, accent:'var(--warm)' },
  { id:3, name:'Mega Menu', desc:'Rich hover-reveal dropdown panels', Comp:Header3Mega, accent:'var(--sea)' },
  { id:4, name:'Ticker Bar', desc:'Announcement ribbon + clean nav', Comp:Header4Ticker, accent:'var(--coral)' },
  { id:5, name:'Command ⌘K', desc:'Spotlight search overlay', Comp:Header5Command, accent:'var(--sky)' },
  { id:6, name:'Dock Nav', desc:'macOS-style magnifying dock', Comp:Header6Dock, accent:'var(--gold)' },
  { id:7, name:'Full Overlay', desc:'Hamburger → cinematic reveal', Comp:Header7Overlay, accent:'var(--coral)' },
  { id:8, name:'Context Strip', desc:'Color strip + morphing states', Comp:Header8Strip, accent:'var(--sea)' },
];

export default function HeaderShowcase() {
  const [active,setActive]=useState(0);
  const ActiveHeader=HEADERS[active].Comp;

  return(
    <div style={{background:'var(--bg)',color:'var(--text)',minHeight:'200vh',fontFamily:'var(--sans)'}}>
      <style>{STYLE}</style>
      <ActiveHeader/>

      {/* Selector — positioned below header area */}
      <div style={{paddingTop:140,maxWidth:1100,margin:'0 auto',padding:'140px 5% 40px',textAlign:'center'}}>
        <p style={{fontFamily:'var(--mono)',fontSize:10,letterSpacing:'.2em',color:'var(--sand)',textTransform:'uppercase',marginBottom:14}}>Choose a Style</p>
        <h1 style={{fontFamily:'var(--serif)',fontSize:'clamp(28px,4vw,44px)',fontWeight:700,color:'var(--text)',lineHeight:1.1,marginBottom:32}}>8 Header <em style={{fontWeight:400,color:'var(--warm)'}}>Designs</em></h1>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:32}}>
          {HEADERS.map((h,i)=>(
            <button key={h.id} onClick={()=>setActive(i)} style={{
              padding:'16px 12px',borderRadius:12,cursor:'pointer',transition:'all .4s',textAlign:'center',
              background:active===i?'var(--card)':'var(--bg2)',
              border:`2px solid ${active===i?h.accent:'var(--line)'}`,
              transform:active===i?'translateY(-2px)':'none',
            }}>
              <p style={{fontFamily:'var(--serif)',fontSize:28,fontWeight:700,color:active===i?h.accent:'var(--text-dim)',lineHeight:1,marginBottom:6,transition:'color .3s'}}>0{h.id}</p>
              <p style={{fontFamily:'var(--sans)',fontSize:12,fontWeight:700,color:active===i?'var(--text)':'var(--text-mid)',marginBottom:2}}>{h.name}</p>
              <p style={{fontFamily:'var(--sans)',fontSize:10,color:'var(--text-dim)',lineHeight:1.3}}>{h.desc}</p>
            </button>
          ))}
        </div>

        <p style={{fontFamily:'var(--sans)',fontSize:13,color:'var(--text-dim)',maxWidth:500,margin:'0 auto',lineHeight:1.6}}>
          Scroll the page to see scroll-based behaviors. Try hovering nav items, clicking search triggers, and opening menus. Header 6 has a dock at the bottom of the screen.
        </p>
      </div>

      {/* Dummy content for scrolling */}
      <div style={{maxWidth:700,margin:'0 auto',padding:'60px 5% 200px'}}>
        {[...Array(6)].map((_,i)=>(
          <div key={i} style={{marginBottom:40}}>
            <div style={{width:80,height:4,background:'var(--sand)',opacity:.15,borderRadius:2,marginBottom:16}}/>
            <div style={{height:12,background:'var(--line)',borderRadius:4,marginBottom:10,width:`${70+Math.random()*30}%`}}/>
            <div style={{height:12,background:'var(--line)',borderRadius:4,marginBottom:10,width:`${50+Math.random()*40}%`}}/>
            <div style={{height:12,background:'var(--line)',borderRadius:4,width:`${40+Math.random()*30}%`}}/>
          </div>
        ))}
      </div>
    </div>
  );
}
