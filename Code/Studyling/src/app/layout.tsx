import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Studyling – Lernen, das zu dir passt", description: "Dein ruhiger Ort zum Verstehen, Üben und Wiederholen.", applicationName: "Studyling" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="de" suppressHydrationWarning><body>{children}</body></html>; }
