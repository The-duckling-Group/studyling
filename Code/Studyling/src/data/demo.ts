import type { Exercise, LearningPath, Subject } from "@/types";
export const subjects: Subject[] = [
  { id:"math", name:"Mathematik", icon:"÷", color:"#6257e7", soft:"#eeecff" }, { id:"german", name:"Deutsch", icon:"Aa", color:"#db6b55", soft:"#fff0ec" },
  { id:"english", name:"Englisch", icon:"Hi", color:"#16856f", soft:"#e2f7f1" }, { id:"biology", name:"Biologie", icon:"⌁", color:"#4c8d49", soft:"#eaf6e8" },
  { id:"history", name:"Geschichte", icon:"⌛", color:"#a56a2d", soft:"#faeedf" }, { id:"physics", name:"Physik", icon:"⚡", color:"#3876b7", soft:"#e7f2ff" },
  { id:"chemistry", name:"Chemie", icon:"⚗", color:"#9b55a6", soft:"#f6eafb" }, { id:"geography", name:"Geografie", icon:"◎", color:"#267c94", soft:"#e2f4f8" }
];
const fractionExercises: Exercise[] = [
  { id:"f1", type:"explanation", prompt:"Ein Bruch beschreibt einen oder mehrere gleich große Teile eines Ganzen. Bei ¾ wurde das Ganze in vier Teile geteilt und drei davon sind gemeint.", answer:"", explanation:"Der Nenner zeigt alle gleich großen Teile, der Zähler die ausgewählten Teile.", xp:5 },
  { id:"f2", type:"multiple-choice", prompt:"Welcher Bruch zeigt drei von vier gleich großen Teilen?", options:["¾","⅓","⁴⁄₃","¼"], answer:"¾", explanation:"Die 3 ist der Zähler, die 4 der Nenner: drei von vier Teilen.", xp:5 },
  { id:"f3", type:"true-false", prompt:"Beim Bruch ⅖ ist 5 der Nenner.", options:["Richtig","Nicht richtig"], answer:"Richtig", explanation:"Genau: Die Zahl unter dem Bruchstrich heißt Nenner.", xp:5 },
  { id:"f4", type:"multiple-select", prompt:"Welche Brüche sind kleiner als ein Ganzes?", options:["½","⁷⁄₄","⅜","⁵⁄₅"], answer:["½","⅜"], explanation:"Ein Bruch ist kleiner als 1, wenn der Zähler kleiner als der Nenner ist.", xp:10 },
  { id:"f5", type:"fill-gap", prompt:"Ergänze: Beim Bruch ⅗ heißt die obere Zahl ___.", answer:"Zähler", explanation:"Oben steht der Zähler, unten der Nenner.", xp:5 }
];
const makeLessons = (level: number, title: string) => [
  { id:`fractions-${level}-intro`, title:`${title} verstehen`, type:"Lernen" as const, duration:5, exercises:fractionExercises.slice(0,3) },
  { id:`fractions-${level}-practice`, title:`${title} üben`, type:"Üben" as const, duration:7, exercises:fractionExercises.slice(1) },
  { id:`fractions-${level}-quiz`, title:"Mini-Quiz", type:"Quiz" as const, duration:4, exercises:fractionExercises.slice(1,5) }
];
export const paths: LearningPath[] = [
  { id:"fractions", title:"Brüche verstehen", description:"Vom ersten Anteil bis zum sicheren Rechnen mit Brüchen.", subjectId:"math", gradeMin:5, gradeMax:6, difficulty:"Leicht", minutes:45, xp:300, status:"published", progress:65, levels:[
    {id:"fl1",title:"Brüche kennenlernen",description:"Zähler, Nenner und Anteile",lessons:makeLessons(1,"Brüche")},{id:"fl2",title:"Brüche vergleichen",description:"Größer, kleiner oder gleich",lessons:makeLessons(2,"Vergleichen")},{id:"fl3",title:"Erweitern und kürzen",description:"Gleichwertige Brüche erkennen",lessons:makeLessons(3,"Umformen")},{id:"fl4",title:"Brüche addieren",description:"Gleichnamige Brüche berechnen",lessons:makeLessons(4,"Addieren")},{id:"fl5",title:"Abschluss-Challenge",description:"Zeig, was du verstanden hast",lessons:makeLessons(5,"Challenge")}
  ]},
  { id:"prepositions", title:"Prepositions Basics", description:"Sicher mit in, on, at und den wichtigsten Ortsangaben.", subjectId:"english", gradeMin:5, gradeMax:7, difficulty:"Leicht", minutes:35, xp:220, status:"published", progress:20, levels:[{id:"pl1",title:"Place & position",description:"Orte richtig beschreiben",lessons:makeLessons(6,"Prepositions")}] },
  { id:"grammar", title:"Grammatik Grundlagen", description:"Wortarten, Satzbau und Satzglieder verständlich erklärt.", subjectId:"german", gradeMin:5, gradeMax:7, difficulty:"Mittel", minutes:55, xp:340, status:"published", progress:0, levels:[{id:"gl1",title:"Wortarten",description:"Nomen, Verben und Adjektive",lessons:makeLessons(7,"Wortarten")}] },
  { id:"percent", title:"Prozentrechnung", description:"Prozente im Alltag verstehen und sicher berechnen.", subjectId:"math", gradeMin:7, gradeMax:8, difficulty:"Mittel", minutes:60, xp:400, status:"published", progress:0, levels:[{id:"pc1",title:"Prozent verstehen",description:"Hundertstel und Anteile",lessons:makeLessons(8,"Prozente")}] },
  { id:"cells", title:"Die Zelle", description:"Bausteine des Lebens entdecken und unterscheiden.", subjectId:"biology", gradeMin:6, gradeMax:8, difficulty:"Mittel", minutes:40, xp:260, status:"published", progress:0, levels:[{id:"cl1",title:"Zellaufbau",description:"Organellen und ihre Aufgaben",lessons:makeLessons(9,"Zellen")}] }
];
export const defaultProgress = { xp:1240, streak:7, minutesToday:8, dailyGoal:10, completedLessons:["fractions-1-intro","fractions-1-practice"], correctAnswers:86, totalAnswers:108, selectedSubjects:["math","german","english"] as const, grade:"6" as const, onboardingDone:false };
