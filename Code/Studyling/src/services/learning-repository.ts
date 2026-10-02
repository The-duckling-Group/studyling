import { paths, subjects } from "@/data/demo";
import type { LearningPath, Subject } from "@/types";
export interface LearningRepository { listSubjects(): Promise<Subject[]>; listPaths(): Promise<LearningPath[]>; }
export const demoLearningRepository: LearningRepository = { async listSubjects(){ return subjects; }, async listPaths(){ return paths; } };
