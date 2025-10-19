/**
 * Historical Context Agent CLI
 * 
 * Interactive CLI for generating historical context from coordinates and radius
 */

import { AIHistoricalContextAgent } from './concepts/HistoricalContextAgent/AIHistoricalContextAgent.ts';
import { GeminiLLM, Config } from './gemini-llm.ts';
import "jsr:@std/dotenv/load";

/**
 * Load configuration from environment variables and geminiConfig.json
 */
function loadConfig(): Config {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash-exp";
    
    if (!apiKey) {
        console.error('❌ Error: GEMINI_API_KEY environment variable not set.');
        console.error('Please create a .env file with: GEMINI_API_KEY=your_api_key_here');
        Deno.exit(1);
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
 * Prompt for user input
 */
async function prompt(message: string): Promise<string> {
    const buf = new Uint8Array(1024);
    await Deno.stdout.write(new TextEncoder().encode(message));
    const n = await Deno.stdin.read(buf);
    if (n === null) return '';
    return new TextDecoder().decode(buf.subarray(0, n)).trim();
}

/**
 * Parse coordinate input (supports various formats)
 */
function parseCoordinate(input: string): { lat: number; lng: number } | null {
    // Remove any spaces
    input = input.trim();
    
    // Try to match various formats:
    // 1. "42.3601, -71.0589"
    // 2. "42.3601,-71.0589"
    // 3. "lat: 42.3601, lng: -71.0589"
    
    const patterns = [
        /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/,  // "42.3601, -71.0589"
        /lat:\s*(-?\d+\.?\d*)\s*,?\s*lng:\s*(-?\d+\.?\d*)/i,  // "lat: 42.3601, lng: -71.0589"
    ];
    
    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            
            if (isNaN(lat) || isNaN(lng)) continue;
            if (lat < -90 || lat > 90) continue;
            if (lng < -180 || lng > 180) continue;
            
            return { lat, lng };
        }
    }
    
    return null;
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
    console.log('🌍 Historical Context Agent CLI');
    console.log('================================\n');
    
    // Initialize
    const agent = new AIHistoricalContextAgent();
    const config = loadConfig();
    const llm = new GeminiLLM(config);
    
    console.log('✅ Initialized with model:', config.model);
    console.log('\nExamples of coordinates:');
    console.log('  - Boston: 42.3601, -71.0589');
    console.log('  - Paris: 48.8566, 2.3522');
    console.log('  - Tokyo: 35.6762, 139.6503\n');
    
    try {
        // Get coordinates
        const coordInput = await prompt('Enter coordinates (latitude, longitude): ');
        if (!coordInput) {
            console.log('No input provided. Exiting.');
            return;
        }
        
        const coords = parseCoordinate(coordInput);
        if (!coords) {
            console.error('❌ Invalid coordinate format. Please use format: latitude, longitude');
            console.error('   Example: 42.3601, -71.0589');
            Deno.exit(1);
        }
        
        console.log(`✅ Parsed coordinates: (${coords.lat}, ${coords.lng})`);
        
        // Get radius
        const radiusInput = await prompt('\nEnter radius in meters (e.g., 1000 for 1km): ');
        const radius = parseFloat(radiusInput);
        
        if (isNaN(radius) || radius <= 0) {
            console.error('❌ Invalid radius. Please enter a positive number.');
            Deno.exit(1);
        }
        
        console.log(`✅ Using radius: ${radius}m (${(radius / 1000).toFixed(2)}km)\n`);
        
        // Generate context
        console.log('🔄 Generating historical context...\n');
        const result = await agent.generateContext(llm, coords, radius);
        
        // Display results
        console.log('\n' + '='.repeat(80));
        console.log('📍 MAIN LOCATION');
        console.log('='.repeat(80));
        console.log(result.mainLocation);
        
        console.log('\n' + '='.repeat(80));
        console.log('📖 HISTORICAL CONTEXT');
        console.log('='.repeat(80));
        console.log(result.context);
        console.log('='.repeat(80));
        
        // Ask if user wants follow-up questions
        console.log('\n💬 You can now ask follow-up questions about this location.');
        const askQuestion = await prompt('Would you like to ask a question? (y/n): ');
        
        if (askQuestion.toLowerCase() === 'y' || askQuestion.toLowerCase() === 'yes') {
            while (true) {
                const question = await prompt('\nYour question (or "quit" to exit): ');
                
                if (question.toLowerCase() === 'quit' || question.toLowerCase() === 'exit' || !question) {
                    break;
                }
                
                console.log('\n🔄 Getting answer...\n');
                const answer = await agent.answerQuestion(llm, result.sessionId, question);
                
                console.log('='.repeat(80));
                console.log('💬 ANSWER');
                console.log('='.repeat(80));
                console.log(answer);
                console.log('='.repeat(80));
            }
        }
        
        // Clean up
        agent.clearSession(result.sessionId);
        console.log('\n✅ Session completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Error:', (error as Error).message);
        Deno.exit(1);
    }
}

// Run the CLI
if (import.meta.main) {
    main();
}

