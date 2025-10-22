import { Hono } from "jsr:@hono/hono";
import { getDb } from "@utils/database.ts";
import { walk } from "jsr:@std/fs";
import { parseArgs } from "jsr:@std/cli/parse-args";
import { toFileUrl } from "jsr:@std/path/to-file-url";
import { GeminiLLM, Config } from "./gemini-llm.ts";
import "jsr:@std/dotenv/load";

// Parse command-line arguments for port and base URL
const flags = parseArgs(Deno.args, {
  string: ["port", "baseUrl"],
  default: {
    port: "8000",
    baseUrl: "/api",
  },
});

const PORT = parseInt(flags.port, 10);
const BASE_URL = flags.baseUrl;
const CONCEPTS_DIR = "src/concepts";

/**
 * Load Gemini LLM configuration
 */
function loadGeminiConfig(): Config {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash-exp";
  
  if (!apiKey) {
    console.warn('⚠️  Warning: GEMINI_API_KEY not set. AIHistoricalContextAgent endpoints will not work.');
    return { apiKey: "", model };
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

/**
 * Main server function to initialize DB, load concepts, and start the server.
 */
async function main() {
  const [db] = await getDb();
  const app = new Hono();
  
  // Initialize Gemini LLM for AI-powered concepts
  const geminiConfig = loadGeminiConfig();
  const llm = geminiConfig.apiKey ? new GeminiLLM(geminiConfig) : null;
  
  if (llm) {
    console.log(`✅ Initialized Gemini LLM with model: ${geminiConfig.model}`);
  }

  app.get("/", (c) => c.text("Concept Server is running."));

  // --- Dynamic Concept Loading and Routing ---
  console.log(`Scanning for concepts in ./${CONCEPTS_DIR}...`);

  for await (
    const entry of walk(CONCEPTS_DIR, {
      maxDepth: 1,
      includeDirs: true,
      includeFiles: false,
    })
  ) {
    if (entry.path === CONCEPTS_DIR) continue; // Skip the root directory

    const conceptName = entry.name;
    const conceptFilePath = `${entry.path}/${conceptName}Concept.ts`;

    try {
      const modulePath = toFileUrl(Deno.realPathSync(conceptFilePath)).href;
      const module = await import(modulePath);
      const ConceptClass = module.default;

      if (
        typeof ConceptClass !== "function" ||
        !ConceptClass.name.endsWith("Concept")
      ) {
        console.warn(
          `! No valid concept class found in ${conceptFilePath}. Skipping.`,
        );
        continue;
      }

      const instance = new ConceptClass(db);
      const conceptApiName = conceptName;
      console.log(
        `- Registering concept: ${conceptName} at ${BASE_URL}/${conceptApiName}`,
      );

      const methodNames = Object.getOwnPropertyNames(
        Object.getPrototypeOf(instance),
      )
        .filter((name) => {
          // Only include constructor and methods
          if (name === "constructor" || typeof instance[name] !== "function") {
            return false;
          }
          // Exclude private helper methods (common patterns)
          const privateHelperPatterns = [
            /^create.*Prompt$/,  // createContextPrompt, createQuestionPrompt, etc.
            /^parse.*Response$/,  // parseContextResponse, parseHallucinationCheckResponse
            /^validate.*Response$/,  // validateContextResponse
            /^create.*Check/,  // createHallucinationCheckPrompt
          ];
          return !privateHelperPatterns.some(pattern => pattern.test(name));
        });

      for (const methodName of methodNames) {
        const actionName = methodName;
        const route = `${BASE_URL}/${conceptApiName}/${actionName}`;

        app.post(route, async (c) => {
          try {
            const body = await c.req.json().catch(() => ({})); // Handle empty body
            
            // Inject LLM for methods that require it
            if (llm && (methodName === 'generateContext' || methodName === 'answerQuestion')) {
              body.llm = llm;
            }
            
            const result = await instance[methodName](body);
            return c.json(result);
          } catch (e) {
            console.error(`Error in ${conceptName}.${methodName}:`, e);
            return c.json({ error: "An internal server error occurred." }, 500);
          }
        });
        console.log(`  - Endpoint: POST ${route}`);
      }
    } catch (e) {
      console.error(
        `! Error loading concept from ${conceptFilePath}:`,
        e,
      );
    }
  }

  console.log(`\nServer listening on http://localhost:${PORT}`);
  Deno.serve({ port: PORT }, app.fetch);
}

// Run the server
main();
