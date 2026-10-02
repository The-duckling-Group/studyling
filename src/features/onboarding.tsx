"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import type { Grade, SubjectId } from "@/types";
import { subjects } from "@/data/demo";
import { Button, ProgressBar } from "@/components/ui";
export function Onboarding({ finish }: { finish:(grade:Grade, selected:SubjectId[], goal:number)=>void }) {
 const [step,setStep]=useState(0); const [grade,setGrade]=useState<Grade>("6"); const [selected,setSelected]=useState<SubjectId[]>(["math","german","english"]); const [goal,setGoal]=useState(10);
 const toggle=(id:SubjectId)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
 const screens=[
  <div className="welcome-visual" key="welcome"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="welcome-book"><span>÷</span><span>Aa</span><span>Hi</span></div><h1>Willkommen bei Studyling.</h1><p>Lernen, das sich deinem Tempo anpasst.</p></div>,
  <div key="grade"><h1>In welcher Klasse bist du?</h1><p>So zeigen wir dir Inhalte, die gerade zu dir passen.</p><div className="choice-grid grades">{(["5","6","7","8","9","10","Oberstufe"] as Grade[]).map(g=><button className={grade===g?"choice selected":"choice"} onClick={()=>setGrade(g)} key={g}>{g==="Oberstufe"?g:`Klasse ${g}`}{grade===g&&<Check size={18}/>}</button>)}</div></div>,
  <div key="subjects"><h1>Was möchtest du lernen?</h1><p>Wähle mehrere Fächer aus. Du kannst das später ändern.</p><div className="choice-grid subjects">{subjects.map(s=><button className={selected.includes(s.id)?"subject-choice selected":"subject-choice"} style={{"--subject":s.color,"--subject-soft":s.soft} as React.CSSProperties} onClick={()=>toggle(s.id)} key={s.id}><span>{s.icon}</span>{s.name}{selected.includes(s.id)&&<Check size={17}/>}</button>)}</div></div>,
  <div key="goal"><h1>Wie viel möchtest du täglich lernen?</h1><p>Ein kleines Ziel, das auch an vollen Tagen erreichbar bleibt.</p><div className="goal-list">{[[5,"Entspannt"],[10,"Normal"],[20,"Fokussiert"],[30,"Intensiv"]].map(([min,label])=><button key={min} className={goal===min?"goal-choice selected":"goal-choice"} onClick={()=>setGoal(min as number)}><span><b>{label}</b><small>{min} Minuten</small></span><span className="radio">{goal===min&&<i/>}</span></button>)}</div></div>,
  <div className="ready" key="ready"><div className="ready-icon"><Sparkles size={34}/></div><h1>Alles bereit.</h1><p>Dein erster Lernpfad wartet schon. Du kannst sofort loslegen – ganz ohne Konto.</p><div className="ready-summary"><span>Klasse {grade}</span><span>{selected.length} Fächer</span><span>{goal} Min. pro Tag</span></div></div>
 ];
 return <main className="onboarding"><div className="onboarding-card"><div className="onboarding-top"><div className="brand"><span className="brand-mark">S</span><span>studyling</span></div><span>{step+1} von 5</span></div><ProgressBar value={(step+1)*20}/><div className="onboarding-content">{screens[step]}</div><div className="onboarding-actions">{step>0?<Button variant="ghost" onClick={()=>setStep(step-1)}><ArrowLeft size={18}/>Zurück</Button>:<span/>}<Button disabled={step===2&&selected.length===0} onClick={()=>step<4?setStep(step+1):finish(grade,selected,goal)}>{step===0?"Los geht’s":step===4?"Studyling starten":"Weiter"}<ArrowRight size={18}/></Button></div></div></main>;
}
