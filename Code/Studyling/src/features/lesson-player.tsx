"use client";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Lightbulb, RotateCcw, Sparkles, X } from "lucide-react";
import { paths } from "@/data/demo";
import { Button, ProgressBar } from "@/components/ui";

export function LessonPlayer({ lessonId, close, complete }: { lessonId:string; close:()=>void; complete:(xp:number)=>void }) {
  const lesson=useMemo(()=>paths.flatMap(p=>p.levels).flatMap(l=>l.lessons).find(l=>l.id===lessonId) ?? paths[0].levels[0].lessons[0],[lessonId]);
  const [index,setIndex]=useState(0); const [selected,setSelected]=useState<string[]>([]); const [text,setText]=useState("");
  const [checked,setChecked]=useState(false); const [correct,setCorrect]=useState(false); const [help,setHelp]=useState(false); const [earned,setEarned]=useState(0);
  const exercise=lesson.exercises[index]; const isInfo=exercise.type==="explanation"||exercise.type==="example";
  const submit=()=>{ if(isInfo){next();return;} const given=exercise.type==="multiple-select"?[...selected].sort().join("|"):(text||selected[0]||"").trim().toLowerCase(); const expected=Array.isArray(exercise.answer)?[...exercise.answer].sort().join("|"):exercise.answer.toLowerCase(); const ok=given===expected.toLowerCase(); setCorrect(ok);setChecked(true);if(ok)setEarned(x=>x+exercise.xp); };
  const next=()=>{ if(index===lesson.exercises.length-1){complete(earned+(correct?exercise.xp:0));return;} setIndex(i=>i+1);setSelected([]);setText("");setChecked(false);setCorrect(false);setHelp(false); };
  const toggle=(option:string)=>setSelected(s=>exercise.type==="multiple-select"?(s.includes(option)?s.filter(x=>x!==option):[...s,option]):[option]);
  return <div className="lesson-player">
    <header><button className="icon-button" onClick={close} aria-label="Lektion verlassen"><X size={22}/></button><div><span>{lesson.title}</span><ProgressBar value={(index/lesson.exercises.length)*100}/></div><span className="lesson-count">{index+1}/{lesson.exercises.length}</span></header>
    <main><div className="exercise-type">{isInfo?"Kurz erklärt":exercise.type==="multiple-select"?"Wähle alle richtigen Antworten":"Deine Aufgabe"}</div><h1>{exercise.prompt}</h1>
      {isInfo&&<div className="explanation-visual"><div className="fraction-demo"><span>3</span><i/><span>4</span></div><div className="parts"><i/><i/><i/><i/></div></div>}
      {exercise.options&&<div className="answer-list">{exercise.options.map((option,i)=><button disabled={checked} onClick={()=>toggle(option)} className={`${selected.includes(option)?"selected":""} ${checked&&((Array.isArray(exercise.answer)?exercise.answer.includes(option):exercise.answer===option))?"correct":""}`} key={option}><span>{String.fromCharCode(65+i)}</span>{option}{selected.includes(option)&&<Check size={19}/>}</button>)}</div>}
      {["text","fill-gap"].includes(exercise.type)&&<label className="text-answer"><span>Deine Antwort</span><input autoFocus disabled={checked} value={text} onChange={e=>setText(e.target.value)} placeholder="Antwort eingeben …"/></label>}
      {checked&&<div className={correct?"feedback correct":"feedback retry"}><div className="feedback-icon">{correct?<Check size={24}/>:<RotateCcw size={22}/>}</div><div><h3>{correct?"Richtig! 🎉":"Fast."}</h3><p>{exercise.explanation}</p>{!correct&&<button onClick={()=>setHelp(true)}><Sparkles size={16}/>{help?"Merksatz: Nenner = alle Teile":"Noch einmal erklären"}</button>}</div>{correct&&<span>+{exercise.xp} XP</span>}</div>}
    </main>
    <footer>{!checked&&!isInfo?<span className="hint"><Lightbulb size={17}/>Denk in kleinen Schritten.</span>:<span/>}<Button disabled={!isInfo&&!text&&!selected.length} onClick={checked?next:submit}>{isInfo?"Verstanden":checked?(index===lesson.exercises.length-1?"Lektion abschließen":"Weiter"):"Antwort prüfen"}<ArrowRight size={18}/></Button></footer>
  </div>;
}
