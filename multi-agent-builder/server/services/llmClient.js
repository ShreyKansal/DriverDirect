import { OpenAICompatModel } from "./llmProviders/openaiCompat.js";
import { AnthropicModel }    from "./llmProviders/anthropicModel.js";
import { GoogleModel }       from "./llmProviders/googleModel.js";
import { getProvider }       from "../config/providers.js";
import { resolveKey }        from "./keyStore.js";


// agentConfig : { provider, model, temperature, maxTokens }
// projectKeys : { [providerId]: apiKey } — from keyStore.getProjectKeys()
export function createChatModel(agentConfig = {}, projectKeys = {}) {
  const providerId = agentConfig.provider || "groq";
  const provider   = getProvider(providerId);

  if (!provider) throw new Error(`Unknown provider: "${providerId}"`);

  const apiKey = resolveKey(projectKeys, providerId);
  if (!apiKey) {
    throw new Error(
      `No API key configured for ${provider.name}. Add it in Project Settings → AI Providers.`
    );
  }

  const model       = agentConfig.model       || provider.models[0]?.id || "";
  const temperature = Number(agentConfig.temperature ?? 0.3);
  const maxTokens   = Number(agentConfig.maxTokens   ?? 1024);

  switch (provider.sdkType) {
    case "openai-compat":
      return new OpenAICompatModel({ apiKey, model, temperature, maxTokens, baseURL: provider.baseUrl });

    case "openai":
      return new OpenAICompatModel({ apiKey, model, temperature, maxTokens, baseURL: null });

    case "anthropic":
      return new AnthropicModel({ apiKey, model, temperature, maxTokens });

    case "google":
      return new GoogleModel({ apiKey, model, temperature, maxTokens });

    default:
      throw new Error(`Unsupported SDK type "${provider.sdkType}" for provider "${providerId}"`);
  }
}
