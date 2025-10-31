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
            let thinkingText = '';
            let responseText = '';
            const candidates = result.candidates?.[0]?.content?.parts;
            
            if (!candidates || candidates.length === 0) {
                throw new Error('No response generated from LLM');
            }

            for (const part of candidates) {
                // Check if this part is thinking/reasoning
                if (part.thought) {
                    thinkingText += part.text || '';
                } else if (part.text) {
                    responseText += part.text;
                }
            }

            // Log thinking to console if present (for debugging)
            if (thinkingText) {
                console.log('🤔 LLM Thinking:', thinkingText.substring(0, 200) + '...');
            }

            // Return only the actual response, not the thinking
            const finalText = responseText || thinkingText;
            
            if (!finalText) {
                throw new Error('Empty response from LLM');
            }

            return finalText;

        } catch (error) {
            console.error('Error calling Gemini API:', (error as Error).message);
            throw error;
        }
    }
}


