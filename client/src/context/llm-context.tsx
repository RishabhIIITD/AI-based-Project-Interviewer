import React, { createContext, useContext, useState, useEffect } from "react";

type LLMProviderType = "gemini" | "ollama";

interface LLMContextType {
  provider: LLMProviderType;
  setProvider: (provider: LLMProviderType) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

const LLMContext = createContext<LLMContextType | undefined>(undefined);

export function LLMProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProviderState] = useState<LLMProviderType>("gemini");
  const [apiKey, setApiKeyState] = useState<string>("");

  useEffect(() => {
    const storedProvider = sessionStorage.getItem("llm_provider") as LLMProviderType;
    const storedKey = sessionStorage.getItem("llm_api_key");
    if (storedProvider) setProviderState(storedProvider);
    if (storedKey) setApiKeyState(storedKey);
  }, []);

  const setProvider = (p: LLMProviderType) => {
    setProviderState(p);
    sessionStorage.setItem("llm_provider", p);
  };

  const setApiKey = (k: string) => {
    setApiKeyState(k);
    sessionStorage.setItem("llm_api_key", k);
  };

  return (
    <LLMContext.Provider value={{ provider, setProvider, apiKey, setApiKey }}>
      {children}
    </LLMContext.Provider>
  );
}

export function useLLM() {
  const context = useContext(LLMContext);
  if (!context) {
    throw new Error("useLLM must be used within an LLMProvider");
  }
  return context;
}
