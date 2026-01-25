import { LLMProvider } from "./types";
import { GeminiProvider } from "./gemini";
import { OllamaProvider } from "./ollama";

export function getLLMProvider(provider: "gemini" | "ollama", apiKey?: string): LLMProvider {
  if (provider === "ollama") {
    return new OllamaProvider();
  }
  
  // Default to Gemini
  if (!apiKey) {
    throw new Error("API Key is required for Gemini Provider");
  }
  return new GeminiProvider(apiKey);
}
