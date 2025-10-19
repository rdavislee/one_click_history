---
timestamp: 'Sun Oct 19 2025 18:09:18 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251019_180918.b71254c0.md]]'
content_id: fef83ac155ac475481619a40a6e30cecadc1061eab51a141fe79a7a998e3871d
---

# test: HistoricalContextAgent

```typescript
/**
 * AIHistoricalContextAgent Test Cases
 * 
 * Demonstrates generating historical context and asking follow-up questions
 */

import AIHistoricalContextAgentConcept from './AIHistoricalContextAgent.ts';
import { GeminiLLM, Config } from '../../gemini-llm.ts';
import { testDb } from '@utils/database.ts';
import { ID } from '@utils/types.ts';
import "jsr:@std/dotenv/load";

/**
 * Load configuration from environment variables and geminiConfig.json
 */
function loadConfig(): Config {
    // Load API key and model from environment variables
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
        // geminiConfig.json is optional, so we continue without it
        console.log('ℹ️  Note: geminiConfig.json not found, using default configuration');
    }

    return {
        apiKey,
        model,
        ...additionalConfig
    };
}

/**
 * Test case 1: Boston Historical Context
 * Tests generating context for Boston and asking follow-up questions
 */
Deno.test("Principle Test: Boston Historical Context: generate context and ask follow-up questions", async () => {
    console.log('\n🧪 Principle Test: Boston Historical Context');
    console.log('=================================================');
    
    const [db, client] = await testDb();
    
    try {
        const agent = new AIHistoricalContextAgentConcept(db);
        const config = loadConfig();
        const llm = new GeminiLLM(config);
        
        // Use a test user ID
        const testUser = "test-user-boston" as ID;
        
        // Boston coordinates
        const bostonCoords = { lat: 42.3601, lng: -71.0589 };
        const radius = 5000; // 5km radius
        
        console.log(`📍 Testing location: Boston (${bostonCoords.lat}, ${bostonCoords.lng})`);
        console.log(`📏 Radius: ${radius}m\n`);
        
        // Step 1: Generate historical context
        console.log('Step 1: Generating historical context...');
        const result = await agent.generateContext({ llm, user: testUser, location: bostonCoords, radius });
        
        if ('error' in result) {
            throw new Error(`Failed to generate context: ${result.error}`);
        }
        
        console.log('\n📖 Generated Context:');
        console.log('=====================');
        console.log(`Main Location: ${result.mainLocation}`);
        console.log(`\n${result.context}\n`);
        
        // Validate that Boston is mentioned
        const contextLower = result.context.toLowerCase();
        const bostonMentioned = contextLower.includes('boston');
        console.log(`✓ Validation: Boston mentioned in context? ${bostonMentioned ? '✅ YES' : '❌ NO'}`);
        
        if (!bostonMentioned) {
            throw new Error('❌ TEST FAILED: Boston was not mentioned in the generated context');
        }
        
        // Step 2: Ask about top schools in Boston
        console.log('\n\nStep 2: Asking about top schools in Boston...');
        const schoolQuestion = 'What are the top schools in Boston?';
        console.log(`Question: "${schoolQuestion}"`);
        
        const schoolAnswerResult = await agent.answerQuestion({ 
            llm, 
            sessionId: result.sessionId as ID, 
            user: testUser, 
            question: schoolQuestion 
        });
        
        if ('error' in schoolAnswerResult) {
            throw new Error(`Failed to answer question: ${schoolAnswerResult.error}`);
        }
        
        const schoolAnswer = schoolAnswerResult.answer;
        console.log('\n💬 Answer:');
        console.log('==========');
        console.log(schoolAnswer);
        
        // Validate that Harvard is mentioned
        const schoolAnswerLower = schoolAnswer.toLowerCase();
        const harvardMentioned = schoolAnswerLower.includes('harvard');
        console.log(`\n✓ Validation: Harvard mentioned in answer? ${harvardMentioned ? '✅ YES' : '❌ NO'}`);
        
        if (!harvardMentioned) {
            throw new Error('❌ TEST FAILED: Harvard was not mentioned when asked about top schools');
        }
        
        // Step 3: Ask about body of water
        console.log('\n\nStep 3: Asking about body of water...');
        const waterQuestion = 'What body of water is Boston on?';
        console.log(`Question: "${waterQuestion}"`);
        
        const waterAnswerResult = await agent.answerQuestion({ 
            llm, 
            sessionId: result.sessionId as ID, 
            user: testUser, 
            question: waterQuestion 
        });
        
        if ('error' in waterAnswerResult) {
            throw new Error(`Failed to answer question: ${waterAnswerResult.error}`);
        }
        
        const waterAnswer = waterAnswerResult.answer;
        console.log('\n💬 Answer:');
        console.log('==========');
        console.log(waterAnswer);
        
        // Validate that Atlantic is mentioned
        const waterAnswerLower = waterAnswer.toLowerCase();
        const atlanticMentioned = waterAnswerLower.includes('atlantic');
        console.log(`\n✓ Validation: Atlantic mentioned in answer? ${atlanticMentioned ? '✅ YES' : '❌ NO'}`);
        
        if (!atlanticMentioned) {
            throw new Error('❌ TEST FAILED: Atlantic was not mentioned when asked about body of water');
        }
        
        // Clean up
        const clearResult = await agent.clearSession({ sessionId: result.sessionId as ID, user: testUser });
        if (!('error' in clearResult)) {
            console.log('✓ Session cleared successfully');
        }
        
        console.log('\n✅ All validations passed!');
        
    } finally {
        await client.close();
    }
});

/**
 * Variant Test 1: Test _getChat method
 * Tests retrieving chat history for a specific location
 */
Deno.test("Variant Test 1: Retrieve chat history using _getChat", async () => {
    console.log('\n🧪 Variant Test 1: Retrieve chat history using _getChat');
    console.log('=================================================');
    
    const [db, client] = await testDb();
    
    try {
        const agent = new AIHistoricalContextAgentConcept(db);
        const config = loadConfig();
        const llm = new GeminiLLM(config);
        
        const testUser = "test-user-getchat" as ID;
        const testCoords = { lat: 40.7128, lng: -74.0060 }; // New York City
        const radius = 10000;
        
        console.log('Step 1: Creating a session with context...');
        const result = await agent.generateContext({ llm, user: testUser, location: testCoords, radius });
        
        if ('error' in result) {
            throw new Error(`Failed to generate context: ${result.error}`);
        }
        
        console.log(`✓ Created session for: ${result.mainLocation}`);
        
        // Step 2: Retrieve chat using _getChat
        console.log('\nStep 2: Testing _getChat query...');
        const getChatResult = await agent._getChat({ user: testUser, mainLocation: result.mainLocation });
        
        if ('error' in getChatResult) {
            throw new Error(`Failed to get chat: ${getChatResult.error}`);
        }
        
        console.log(`✓ Retrieved ${getChatResult.length} chat(s) for "${result.mainLocation}"`);
        console.log(`✓ Chat has ${getChatResult[0].context.conversationHistory.length} exchange(s)`);
        console.log(`✓ Session ID: ${getChatResult[0].context._id}`);
        
        // Validate the retrieved chat
        if (getChatResult.length !== 1) {
            throw new Error('Expected exactly 1 chat to be retrieved');
        }
        
        if (getChatResult[0].context.user !== testUser) {
            throw new Error('Retrieved chat does not belong to the correct user');
        }
        
        if (getChatResult[0].context.mainLocation !== result.mainLocation) {
            throw new Error('Retrieved chat does not have the correct mainLocation');
        }
        
        // Step 3: Test retrieving non-existent chat
        console.log('\nStep 3: Testing _getChat with non-existent location...');
        const nonExistentResult = await agent._getChat({ 
            user: testUser, 
            mainLocation: "NonExistentLocation12345" 
        });
        
        if (!('error' in nonExistentResult)) {
            throw new Error('Expected error for non-existent location');
        }
        
        console.log(`✓ Correctly returned error: "${nonExistentResult.error}"`);
        
        // Clean up
        await agent.clearSession({ sessionId: result.sessionId as ID, user: testUser });
        console.log('✓ Session cleared successfully');
        
        console.log('\n✅ All _getChat validations passed!');
        
    } finally {
        await client.close();
    }
});

/**
 * Variant Test 2: Test clearSession method
 * Tests clearing existing and non-existing sessions
 */
Deno.test("Variant Test 2: Clear session functionality", async () => {
    console.log('\n🧪 Variant Test 2: Clear session functionality');
    console.log('=================================================');
    
    const [db, client] = await testDb();
    
    try {
        const agent = new AIHistoricalContextAgentConcept(db);
        const config = loadConfig();
        const llm = new GeminiLLM(config);
        
        const testUser = "test-user-clear" as ID;
        const testCoords = { lat: 51.5074, lng: -0.1278 }; // London
        const radius = 8000;
        
        console.log('Step 1: Creating a session...');
        const result = await agent.generateContext({ llm, user: testUser, location: testCoords, radius });
        
        if ('error' in result) {
            throw new Error(`Failed to generate context: ${result.error}`);
        }
        
        console.log(`✓ Created session ${result.sessionId}`);
        
        // Step 2: Clear the session
        console.log('\nStep 2: Clearing the session...');
        const clearResult = await agent.clearSession({ 
            sessionId: result.sessionId as ID, 
            user: testUser 
        });
        
        if ('error' in clearResult) {
            throw new Error(`Failed to clear session: ${clearResult.error}`);
        }
        
        console.log('✓ Session cleared successfully');
        
        // Step 3: Try to clear the same session again (should fail)
        console.log('\nStep 3: Attempting to clear already-cleared session...');
        const clearAgainResult = await agent.clearSession({ 
            sessionId: result.sessionId as ID, 
            user: testUser 
        });
        
        if (!('error' in clearAgainResult)) {
            throw new Error('Expected error when clearing non-existent session');
        }
        
        console.log(`✓ Correctly returned error: "${clearAgainResult.error}"`);
        
        // Step 4: Test clearing with wrong user
        console.log('\nStep 4: Testing clearSession with wrong user...');
        const result2 = await agent.generateContext({ llm, user: testUser, location: testCoords, radius });
        
        if ('error' in result2) {
            throw new Error(`Failed to generate context: ${result2.error}`);
        }
        
        const wrongUser = "wrong-user" as ID;
        const clearWrongUserResult = await agent.clearSession({ 
            sessionId: result2.sessionId as ID, 
            user: wrongUser 
        });
        
        if (!('error' in clearWrongUserResult)) {
            throw new Error('Expected error when clearing with wrong user');
        }
        
        console.log(`✓ Correctly returned error for wrong user: "${clearWrongUserResult.error}"`);
        
        // Clean up the second session with correct user
        await agent.clearSession({ sessionId: result2.sessionId as ID, user: testUser });
        
        console.log('\n✅ All clearSession validations passed!');
        
    } finally {
        await client.close();
    }
});

/**
 * Variant Test 3: Test error handling
 * Tests invalid inputs to methods
 */
Deno.test("Variant Test 3: Error handling with invalid inputs", async () => {
    console.log('\n🧪 Variant Test 3: Error handling with invalid inputs');
    console.log('=================================================');
    
    const [db, client] = await testDb();
    
    try {
        const agent = new AIHistoricalContextAgentConcept(db);
        const config = loadConfig();
        const llm = new GeminiLLM(config);
        
        const testUser = "test-user-errors" as ID;
        
        // Test 1: Invalid coordinates
        console.log('Step 1: Testing generateContext with invalid coordinates...');
        const invalidCoordsResult = await agent.generateContext({ 
            llm, 
            user: testUser, 
            location: { lat: NaN, lng: -74.0060 } as any, 
            radius: 5000 
        });
        
        // Accept either an error response OR a "No significant historical location" response
        if ('error' in invalidCoordsResult) {
            console.log(`✓ Correctly returned error: "${invalidCoordsResult.error}"`);
        } else if ('mainLocation' in invalidCoordsResult && 
                   (invalidCoordsResult.mainLocation === 'No significant historical location' || 
                    invalidCoordsResult.mainLocation.toLowerCase().includes('no significant'))) {
            console.log(`✓ Correctly handled invalid coordinates with: "${invalidCoordsResult.mainLocation}"`);
            // Clean up the session created
            await agent.clearSession({ sessionId: invalidCoordsResult.sessionId as ID, user: testUser });
        } else {
            throw new Error('Expected error or "No significant historical location" response for invalid coordinates');
        }
        
        // Test 2: Invalid radius (negative)
        console.log('\nStep 2: Testing generateContext with negative radius...');
        const invalidRadiusResult = await agent.generateContext({ 
            llm, 
            user: testUser, 
            location: { lat: 40.7128, lng: -74.0060 }, 
            radius: -1000 
        });
        
        if (!('error' in invalidRadiusResult)) {
            throw new Error('Expected error for negative radius');
        }
        
        console.log(`✓ Correctly returned error: "${invalidRadiusResult.error}"`);
        
        // Test 3: Invalid radius (zero)
        console.log('\nStep 3: Testing generateContext with zero radius...');
        const zeroRadiusResult = await agent.generateContext({ 
            llm, 
            user: testUser, 
            location: { lat: 40.7128, lng: -74.0060 }, 
            radius: 0 
        });
        
        if (!('error' in zeroRadiusResult)) {
            throw new Error('Expected error for zero radius');
        }
        
        console.log(`✓ Correctly returned error: "${zeroRadiusResult.error}"`);
        
        // Test 4: Answer question with non-existent session
        console.log('\nStep 4: Testing answerQuestion with non-existent session...');
        const nonExistentSessionResult = await agent.answerQuestion({ 
            llm, 
            sessionId: "non-existent-session-123" as ID, 
            user: testUser, 
            question: "What is the history?" 
        });
        
        if (!('error' in nonExistentSessionResult)) {
            throw new Error('Expected error for non-existent session');
        }
        
        console.log(`✓ Correctly returned error: "${nonExistentSessionResult.error}"`);
        
        // Test 5: Answer question with wrong user
        console.log('\nStep 5: Testing answerQuestion with wrong user...');
        const result = await agent.generateContext({ 
            llm, 
            user: testUser, 
            location: { lat: 48.8566, lng: 2.3522 }, // Paris
            radius: 6000 
        });
        
        if ('error' in result) {
            throw new Error(`Failed to generate context: ${result.error}`);
        }
        
        const wrongUser = "wrong-user-123" as ID;
        const wrongUserQuestionResult = await agent.answerQuestion({ 
            llm, 
            sessionId: result.sessionId as ID, 
            user: wrongUser, 
            question: "What is the history?" 
        });
        
        if (!('error' in wrongUserQuestionResult)) {
            throw new Error('Expected error when wrong user asks question');
        }
        
        console.log(`✓ Correctly returned error: "${wrongUserQuestionResult.error}"`);
        
        // Clean up
        await agent.clearSession({ sessionId: result.sessionId as ID, user: testUser });
        
        console.log('\n✅ All error handling validations passed!');
        
    } finally {
        await client.close();
    }
});

```
