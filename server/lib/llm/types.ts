import { Message } from "@shared/schema";

export interface FeedbackJSON {
  rating: number;
  explanation: string;
  sample_answer: string;
  common_mistakes: string;
}

export interface AnalysisResult {
  feedback: FeedbackJSON;
  next_question: string;
}

export interface SummaryJSON {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  revision_topics: string[];
  project_improvements: string[];
  response_count?: number;
}

export interface LLMProvider {
  generateInterviewQuestions(systemPrompt: string): Promise<string>;
  analyzeResponse(history: Message[], currentAnswer: string, projectContext: string): Promise<AnalysisResult>;
  generateSummary(history: Message[]): Promise<SummaryJSON>;
}
