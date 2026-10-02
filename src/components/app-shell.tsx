"use client";
import { BarChart3, BookOpen, Compass, Home, Search, UserRound, Flame, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
const nav = [{id:"home",label:"Home",icon:Home},{id:"learn",label:"Lernen",icon:BookOpen},{id:"discover",label:"Entdecken",icon:Compass},{id:"progress",label:"Fortschritt",icon:BarChart3},{id:"profile",label:"Profil",icon:UserRound}];
export function AppShell({ page, navigate, children, dark, toggleDark, onSearch }: { page:string; navigate:(id:string)=>void; children:ReactNode; dark:boolean; toggleDark:()=>void; onSearch:()=>void }) {
 return <div className={dark ? "app dark" : "app"}>
  <aside className="sidebar">
   <button className="brand" onClick={()=>navigate("home")} aria-label="Zur Startseite"><span className="brand-mark">S</span><span>studyling</span></button>
   <nav aria-label="Hauptnavigation">{nav.map(item=><button key={item.id} className={page===item.id?"nav-item active":"nav-item"} onClick={()=>navigate(item.id)}><item.icon size={20}/><span>{item.label}</span></button>)}</nav>
   <div className="sidebar-foot"><div className="streak-note"><Flame size={19}/><span><b>7 Tage</b><small>Ruhig weiter so.</small></span></div><button className="nav-item" onClick={toggleDark}>{dark?<Sun size={20}/>:<Moon size={20}/>}<span>{dark?"Heller Modus":"Dunkler Modus"}</span></button><div className="demo-chip">Demo-Modus</div></div>
  </aside>
  <header className="mobile-header"><button className="brand" onClick={()=>navigate("home")}><span className="brand-mark">S</span><span>studyling</span></button><button className="icon-button" onClick={onSearch} aria-label="Suche öffnen"><Search size={21}/></button></header>
  <main className="main"><div className="topbar"><button className="search-trigger" onClick={onSearch}><Search size={18}/><span>Themen, Fächer und Lernpfade suchen</span><kbd>⌘ K</kbd></button><div className="top-actions"><span className="xp-badge">✦ 1.240 XP</span><button className="avatar" onClick={()=>navigate("profile")} aria-label="Profil öffnen">E</button></div></div>{children}</main>
  <nav className="bottom-nav" aria-label="Mobile Navigation">{nav.map(item=><button key={item.id} className={page===item.id?"active":""} onClick={()=>navigate(item.id)}><item.icon size={21}/><span>{item.label}</span></button>)}</nav>
 </div>;
}
