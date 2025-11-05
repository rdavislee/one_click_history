/**
 * Global LLM instance for use across the application
 */

import { GeminiLLM, Config } from "../gemini-llm.ts";
import "jsr:@std/dotenv/load";

/**
 * Load Gemini LLM configuration
 */
function loadGeminiConfig(): Config {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash-exp";
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  // Load additional configuration from geminiConfig.json (optional)
  let additionalConfig = {};
  try {
    const configPath = "./geminiConfig.json";
    additionalConfig = JSON.parse(Deno.readTextFileSync(configPath));
  } catch {
    // geminiConfig.json is optional
  }

  return {
    apiKey,
    model,
    ...additionalConfig
  };
}

// Initialize and export the global LLM instance
const geminiConfig = loadGeminiConfig();
export const llm = new GeminiLLM(geminiConfig);

console.log(`✅ Initialized Gemini LLM with model: ${geminiConfig.model}`);


