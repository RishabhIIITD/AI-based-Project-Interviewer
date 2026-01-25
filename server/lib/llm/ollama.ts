import { Message } from "@shared/schema";
import { LLMProvider, AnalysisResult, SummaryJSON } from "./types";
import { parseJson } from "./utils";

const OLLAMA_BASE_URL = "http://localhost:11434";
const OLLAMA_MODEL = "gemma3:4b";

export class OllamaProvider implements LLMProvider {
  
  private async callOllama(prompt: string, formatJson: boolean = false): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          format: formatJson ? "json" : undefined
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
             throw new Error(`Model '${OLLAMA_MODEL}' not found. Please run 'ollama pull ${OLLAMA_MODEL}'`);
        }
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error("Ollama request timed out.");
      }
      if (err.cause?.code === 'ECONNREFUSED') {
         throw new Error("Ollama is not running. Please start Ollama app.");
      }
      // Check for fetch errors (connection refused)
      if (err.message.includes("fetch failed") || err.message.includes("ECONNREFUSED")) {
        throw new Error("Could not connect to Ollama. Is it running at http://localhost:11434?");
      }
      throw err;
    }
  }

  async generateInterviewQuestions(systemPrompt: string): Promise<string> {
    return this.callOllama(`${systemPrompt}\n\nStart the interview by asking the first question.`);
  }

  async analyzeResponse(history: Message[], currentAnswer: string, projectContext: string): Promise<AnalysisResult> {
    const prompt = `You are an expert technical interviewer.
${projectContext}

History:
${history.map(m => `${m.role}: ${m.content}`).join('\n')}
Candidate: ${currentAnswer}

Analyze the candidate's last answer.
Provide output in JSON format ONLY:
{
  "feedback": {
    "rating": number (0-10),
    "explanation": "constructive feedback",
    "sample_answer": "better way to answer",
    "common_mistakes": "what to avoid"
  },
  "next_question": "the next question to ask"
}

Adapt difficulty based on the answer quality.
If the answer is weak, ask probing questions.
If strong, ask about trade-offs, scalability, or edge cases.
Cover topics: Architecture, Database, Security, Testing, Performance.`;

    const responseText = await this.callOllama(prompt, true);

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

    const responseText = await this.callOllama(prompt, true);

    return parseJson<SummaryJSON>(responseText, {
      overall_score: 70,
      strengths: ["Participation"],
      weaknesses: ["Technical depth"],
      revision_topics: ["Core concepts"],
      project_improvements: ["Review basics"]
    });
  }
}
