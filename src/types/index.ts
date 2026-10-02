export type SubjectId = "math" | "german" | "english" | "biology" | "history" | "physics" | "chemistry" | "geography";
export type Grade = "5" | "6" | "7" | "8" | "9" | "10" | "Oberstufe";
export type ContentStatus = "draft" | "review" | "published" | "archived";
export type ExerciseType = "explanation" | "multiple-choice" | "multiple-select" | "text" | "fill-gap" | "matching" | "ordering" | "true-false" | "flashcard" | "example";
export interface Subject { id: SubjectId; name: string; icon: string; color: string; soft: string; }
export interface Exercise { id: string; type: ExerciseType; prompt: string; options?: string[]; answer: string | string[]; explanation: string; xp: number; }
export interface Lesson { id: string; title: string; type: "Lernen" | "Üben" | "Quiz"; duration: number; exercises: Exercise[]; }
export interface Level { id: string; title: string; description: string; lessons: Lesson[]; }
export interface LearningPath { id: string; title: string; description: string; subjectId: SubjectId; gradeMin: number; gradeMax: number; difficulty: "Leicht" | "Mittel" | "Anspruchsvoll"; minutes: number; xp: number; status: ContentStatus; progress: number; levels: Level[]; }
export interface AppProgress { xp: number; streak: number; minutesToday: number; dailyGoal: number; completedLessons: string[]; correctAnswers: number; totalAnswers: number; selectedSubjects: SubjectId[]; grade: Grade; onboardingDone: boolean; }
