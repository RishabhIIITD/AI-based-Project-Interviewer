import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "@shared/schema";
import { LLMProvider, AnalysisResult, SummaryJSON } from "./types";
import { parseJson } from "./utils";

export class GeminiProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Google API Key is required for Gemini Provider");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  async generateInterviewQuestions(systemPrompt: string): Promise<string> {
    const result = await this.model.generateContent(`${systemPrompt}\n\nStart the interview by asking the first question.`);
    const response = await result.response;
    return response.text();
  }

  async analyzeResponse(history: Message[], currentAnswer: string, projectContext: string): Promise<AnalysisResult> {
    const prompt = `You are an expert technical interviewer.
${projectContext}

History of the interview so far:
${history.map(m => `${m.role}: ${m.content}`).join('\n')}

Candidate's most recent answer: ${currentAnswer}

TASK:
1. Analyze the candidate's answer.
2. Generate the NEXT question.

CRITICAL INSTRUCTION - NO DUPLICATES:
Review the "History" above. You MUST NOT ask any question that is similar or identical to questions already asked by the interviewer.
If you are about to ask a question that is already in the history, choose a DIFFERENT topic or a follow-up question instead.

Output in JSON format ONLY:
{
  "feedback": {
    "rating": number (0-10),
    "explanation": "constructive feedback",
    "sample_answer": "better way to answer",
    "common_mistakes": "what to avoid"
  },
  "next_question": "the next question to ask"
}

Other Instructions:
1. Adapt difficulty based on the answer quality.
2. If the answer is weak, ask probing questions.
3. If strong, ask about trade-offs, scalability, or edge cases.
4. Cover topics: Architecture, Database, Security, Testing, Performance.`;

    const result = await this.model.generateContent(prompt);
    const responseText = result.response.text();

    return parseJson<AnalysisResult>(responseText, {
      feedback: {
        rating: 5,
        explanation: "Could not parse AI feedback.",
        sample_answer: "N/A",
        common_mistakes: "N/A"
      },
      next_question: "Could you elaborate on that?"
    });
  }

  async generateSummary(history: Message[]): Promise<SummaryJSON> {
    const prompt = `Generate a final interview summary in JSON format ONLY based on this history:
${history.map(m => `${m.role}: ${m.content}`).join('\n')}

JSON Structure:
{
  "overall_score": number (0-100),
  "strengths": ["list"],
  "weaknesses": ["list"],
  "revision_topics": ["list"],
  "project_improvements": ["list"]
}`;

    const result = await this.model.generateContent(prompt);
    const responseText = result.response.text();

    return parseJson<SummaryJSON>(responseText, {
      overall_score: 70,
      strengths: ["Participation"],
      weaknesses: ["Technical depth"],
      revision_topics: ["Core concepts"],
      project_improvements: ["Review basics"]
    });
  }
}
