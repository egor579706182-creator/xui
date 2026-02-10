
export interface Question {
  id: number;
  text: string;
  placeholder: string;
}

export interface UserAnswer {
  questionId: number;
  questionText: string;
  answer: string;
}

export interface AnalysisResult {
  title: string;
  verdict: string;
  techStack: string[];
  monetization: string;
  risks: string[];
  nextSteps: string[];
  sarcasticComment: string;
}
