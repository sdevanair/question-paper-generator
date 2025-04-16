export type Subject = 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics';
export type Grade = 11 | 12;
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'mcq' | 'short' | 'long';

export interface Question {
  id: string;
  text: string;
  marks: number;
  topic: string;
  difficulty: Difficulty;
  type?: QuestionType;    // Optional for backward compatibility
  section?: string;       // Optional for backward compatibility
}

export interface QuestionType {
  type: QuestionType;
  count: number;
  marksEach: number;
}

export interface Section {
  name: string;
  questionTypes: QuestionType[];
}

export interface PaperPattern {
  sections: Section[];
  totalMarks: number;
}

export interface QuestionPaperConfig {
  subject: Subject;
  grade: Grade;
  difficulty: Difficulty;
  totalMarks: number;
  pattern?: PaperPattern;  // Optional for backward compatibility
}

export interface Syllabus {
  id: string;
  topic: string;
  subtopics: string[];
  description?: string;
}

export interface CustomSubject {
  id: string;
  name: string;
  syllabus: Syllabus[];
}