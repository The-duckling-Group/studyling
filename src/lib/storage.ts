import type { AppProgress } from "@/types";
import { defaultProgress } from "@/data/demo";
const KEY = "studyling-progress-v1";
export const progressStore = {
  load(): AppProgress { if (typeof window === "undefined") return { ...defaultProgress, selectedSubjects:[...defaultProgress.selectedSubjects] }; try { const raw = localStorage.getItem(KEY); return raw ? { ...defaultProgress, ...JSON.parse(raw) } : { ...defaultProgress, selectedSubjects:[...defaultProgress.selectedSubjects] }; } catch { return { ...defaultProgress, selectedSubjects:[...defaultProgress.selectedSubjects] }; } },
  save(value: AppProgress) { localStorage.setItem(KEY, JSON.stringify(value)); }
};
