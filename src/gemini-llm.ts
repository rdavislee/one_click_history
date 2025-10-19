/**
 * Gemini LLM wrapper for AIHistoricalContextAgent
 * 
 * Provides a simple interface to interact with Google's Gemini API
 */

import { GoogleGenAI } from "npm:@google/genai";

export interface Config {
    apiKey: string;
    model: string;
    thinkingConfig?: {
        includeThoughts?: boolean;
    };
    temperature?: number;
    maxOutputTokens?: number;
}

export class GeminiLLM {
    private ai: GoogleGenAI;
    private model: string;
    private config: any;

    constructor(config: Config) {
        if (!config.apiKey) {
            throw new Error("API key is required");
        }
        if (!config.model) {
            throw new Error("Model name is required");
        }

        this.ai = new GoogleGenAI({ apiKey: config.apiKey });
        this.model = config.model;
        
        // Extract generation config (exclude apiKey and model)
        const { apiKey, model, ...generationConfig } = config;
        this.config = generationConfig;
    }

    /**
     * Execute LLM with the given prompt and return the full response text
     */
    async executeLLM(prompt: string): Promise<string> {
        try {
            const result = await this.ai.models.generateContent({
                model: this.model,
                contents: prompt,
                config: this.config,
            });

            // Extract text from response
            let fullText = '';
            const candidates = result.candidates?.[0]?.content?.parts;
            
            if (!candidates || candidates.length === 0) {
                throw new Error('No response generated from LLM');
            }

            for (const part of candidates) {
                if (part.text) {
                    fullText += part.text;
                }
            }

            if (!fullText) {
                throw new Error('Empty response from LLM');
            }

            return fullText;

        } catch (error) {
            console.error('Error calling Gemini API:', (error as Error).message);
            throw error;
        }
    }
}

