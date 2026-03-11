import { COURSE_1_LESSONS } from "./course-1-content";
import { COURSE_2_LESSONS } from "./course-2-content";
import { COURSE_3_LESSONS } from "./course-3-content";
import { COURSE_4_LESSONS } from "./course-4-content";
import { COURSE_5_LESSONS } from "./course-5-content";
import { COURSE_6_LESSONS } from "./course-6-content";
import { COURSE_7_LESSONS } from "./course-7-content";

export interface LessonContent {
  title: string;
  readTime?: string;
  content: React.ReactNode;
}

export const COURSE_CONTENT_MAP: Record<number, LessonContent[]> = {
  1: COURSE_1_LESSONS,
  2: COURSE_2_LESSONS,
  3: COURSE_3_LESSONS,
  4: COURSE_4_LESSONS,
  5: COURSE_5_LESSONS,
  6: COURSE_6_LESSONS,
  7: COURSE_7_LESSONS,
};
