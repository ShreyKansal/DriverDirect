import { OpenAICompatModel }      from "./llmProviders/openaiCompat.js";
import { AnthropicModel }          from "./llmProviders/anthropicModel.js";
import { GoogleModel }             from "./llmProviders/googleModel.js";
import { CustomOpenAICompatModel, CustomHTTPModel } from "./llmProviders/customModel.js";
import { getProvider }             from "../config/providers.js";
import { resolveKey }              from "./keyStore.js";


// agentConfig    : { provider, model, temperature, maxTokens }
// projectKeys    : { [providerId]: apiKey }   — from keyStore.getProjectKeys()
// customProviders: { [uuid]: customProviderRow } — from customProviderStore.getCustomProviders()
export function createChatModel(agentConfig = {}, projectKeys = {}, customProviders = {}) {
  const providerId = agentConfig.provider || "groq";

  // ── Built-in provider ─────────────────────────────────────────────────────
  const builtIn = getProvider(providerId);
  if (builtIn) {
    const apiKey = resolveKey(projectKeys, providerId);
    if (!apiKey) {
      throw new Error(
        `No API key configured for ${builtIn.name}. Add it in Project Settings → AI Providers.`
      );
    }
    const model       = agentConfig.model       || builtIn.models[0]?.id || "";
    const temperature = Number(agentConfig.temperature ?? 0.3);
    const maxTokens   = Number(agentConfig.maxTokens   ?? 1024);

    switch (builtIn.sdkType) {
      case "openai-compat":
        return new OpenAICompatModel({ apiKey, model, temperature, maxTokens, baseURL: builtIn.baseUrl });
      case "openai":
        return new OpenAICompatModel({ apiKey, model, temperature, maxTokens, baseURL: null });
      case "anthropic":
        return new AnthropicModel({ apiKey, model, temperature, maxTokens });
      case "google":
        return new GoogleModel({ apiKey, model, temperature, maxTokens });
      default:
        throw new Error(`Unsupported SDK type "${builtIn.sdkType}" for provider "${providerId}"`);
    }
  }

  // ── Custom provider ───────────────────────────────────────────────────────
  const custom = customProviders[providerId];
  if (!custom) {
    throw new Error(`Unknown provider: "${providerId}". Configure it in Project Settings → AI Providers.`);
  }

  const apiKey      = resolveKey(projectKeys, providerId);
  const model       = agentConfig.model       || custom.models?.[0]?.id || "";
  const temperature = Number(agentConfig.temperature ?? 0.3);
  const maxTokens   = Number(agentConfig.maxTokens   ?? 1024);

  switch (custom.type) {
    case "openai-compat":
    case "local":
      return new CustomOpenAICompatModel({
        apiKey,
        model,
        temperature,
        maxTokens,
        baseURL: custom.baseUrl
      });

    case "custom-http":
      return new CustomHTTPModel({
        apiKey,
        model,
        temperature,
        maxTokens,
        baseURL:          custom.baseUrl,
        authHeaderName:   custom.authHeaderName,
        requestTemplate:  custom.requestTemplate,
        responsePath:     custom.responsePath
      });

    default:
      throw new Error(`Unsupported custom provider type "${custom.type}"`);
  }
}
