export type QuizStatus = 'draft' | 'published' | 'live' | 'completed';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  timerSeconds: number;
  points: number;
  order: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  hostId: string;
  questions: Question[];
  status: QuizStatus;
  quizCode?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Participant {
  id: string; // Document ID
  sessionId: string;
  name: string;
  score: number;
  questionsAttempted: number;
  correctAnswers: number;
  joinedAt: number;
  status: 'waiting' | 'playing' | 'completed';
}

export interface QuizSession {
  id: string;
  quizId: string;
  hostId: string;
  quizCode: string;
  status: 'waiting' | 'question_active' | 'question_ended' | 'completed';
  currentQuestionIndex: number;
  startedAt?: number;
  endedAt?: number;
}

export interface Response {
  id: string;
  sessionId: string;
  participantId: string;
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  pointsEarned: number;
  responseTime: number;
  submittedAt: number;
}
