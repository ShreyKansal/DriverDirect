export const PROVIDERS = {
  groq: {
    id: "groq",
    name: "Groq",
    description: "Ultra-fast inference for open-source models",
    sdkType: "openai-compat",
    baseUrl: "https://api.groq.com/openai/v1",
    envKey: "GROQ_API_KEY",
    keyHint: "gsk_...",
    docsUrl: "https://console.groq.com",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile" },
      { id: "llama-3.1-8b-instant",    name: "Llama 3.1 8B Instant" },
      { id: "compound-beta",           name: "Compound Beta (agentic)" },
      { id: "compound-beta-mini",      name: "Compound Beta Mini" },
      { id: "llama3-70b-8192",         name: "Llama 3 70B" },
      { id: "llama3-8b-8192",          name: "Llama 3 8B" },
      { id: "gemma2-9b-it",            name: "Gemma 2 9B" },
      { id: "mixtral-8x7b-32768",      name: "Mixtral 8x7B" }
    ]
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, o3-mini, and other OpenAI models",
    sdkType: "openai",
    baseUrl: null,
    envKey: "OPENAI_API_KEY",
    keyHint: "sk-...",
    docsUrl: "https://platform.openai.com",
    models: [
      { id: "gpt-4o",       name: "GPT-4o" },
      { id: "gpt-4o-mini",  name: "GPT-4o Mini" },
      { id: "gpt-4-turbo",  name: "GPT-4 Turbo" },
      { id: "gpt-4",        name: "GPT-4" },
      { id: "gpt-3.5-turbo",name: "GPT-3.5 Turbo" },
      { id: "o3-mini",      name: "o3-mini (reasoning)" },
      { id: "o1-mini",      name: "o1-mini (reasoning)" }
    ]
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude Opus, Sonnet, and Haiku models",
    sdkType: "anthropic",
    baseUrl: null,
    envKey: "ANTHROPIC_API_KEY",
    keyHint: "sk-ant-...",
    docsUrl: "https://console.anthropic.com",
    models: [
      { id: "claude-opus-4-7",              name: "Claude Opus 4.7" },
      { id: "claude-sonnet-4-6",            name: "Claude Sonnet 4.6" },
      { id: "claude-haiku-4-5-20251001",    name: "Claude Haiku 4.5" },
      { id: "claude-3-5-sonnet-20241022",   name: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-20241022",    name: "Claude 3.5 Haiku" },
      { id: "claude-3-opus-20240229",       name: "Claude 3 Opus" }
    ]
  },
  google: {
    id: "google",
    name: "Google Gemini",
    description: "Gemini 2.0 Flash, 1.5 Pro, and other Gemini models",
    sdkType: "google",
    baseUrl: null,
    envKey: "GOOGLE_AI_API_KEY",
    keyHint: "AIza...",
    docsUrl: "https://aistudio.google.com",
    models: [
      { id: "gemini-2.0-flash",          name: "Gemini 2.0 Flash" },
      { id: "gemini-2.0-flash-lite",     name: "Gemini 2.0 Flash Lite" },
      { id: "gemini-1.5-pro",            name: "Gemini 1.5 Pro" },
      { id: "gemini-1.5-flash",          name: "Gemini 1.5 Flash" },
      { id: "gemini-1.5-flash-8b",       name: "Gemini 1.5 Flash 8B" }
    ]
  }
};

export function getProvider(providerId) {
  return PROVIDERS[providerId] || null;
}

export function getAllProviders() {
  return Object.values(PROVIDERS);
}
