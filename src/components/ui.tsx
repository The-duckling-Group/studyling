"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
export function Button({ children, variant="primary", className="", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary"|"secondary"|"ghost"; }) { return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>; }
export function Card({ children, className="" }: { children: ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section>; }
export function ProgressBar({ value, label }: { value:number; label?:string }) { return <div className="progress-wrap" aria-label={label ?? `${value} Prozent`}><div className="progress-track"><span style={{width:`${Math.min(value,100)}%`}} /></div>{label && <span className="progress-label">{label}</span>}</div>; }
export function Pill({ children, tone="neutral" }: { children:ReactNode; tone?:"neutral"|"mint"|"violet"|"gold" }) { return <span className={`pill pill-${tone}`}>{children}</span>; }
export function SectionHeading({ title, action, onAction }: { title:string; action?:string; onAction?:()=>void }) { return <div className="section-heading"><h2>{title}</h2>{action && <button onClick={onAction}>{action}<ArrowRight size={16}/></button>}</div>; }
export function EmptyState({ title, text, action, onAction }: { title:string; text:string; action:string; onAction:()=>void }) { return <div className="empty-state"><div className="empty-mark">＋</div><h3>{title}</h3><p>{text}</p><Button onClick={onAction}>{action}</Button></div>; }
