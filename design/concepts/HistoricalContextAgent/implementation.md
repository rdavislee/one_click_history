[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

# implement: AIHistoricalContextAgent

**concept**: AIHistoricalContextAgent [User]

**purpose**: generate location-aware historical narratives and preserve them for future reference

**principle**: after generating historical context for a location with radius, user can retrieve it later by main location name to continue exploration or review past discoveries; user can also ask follow-up questions grounded in that context

**state**:
*   A set of `Contexts` with
    *   an `id` of type `String` (sessionId)
    *   a `user` of type `User`
    *   a `centerLocation` of type `Coordinates` (lat, lng)
    *   a `radius` of type `Number` (in meters)
    *   a `mainLocation` of type `String` (descriptive name of most significant location)
    *   a `createdAt` of type `DateTime`
    *   a `conversationHistory` of type `List<Exchange>` (prompt/response pairs)

**actions**:
*   `generateContext (user: User, location: Coordinates, radius: Number): (context: String, mainLocation: String, sessionId: String)`
    *   **requires**: user is authenticated, valid coordinates and positive radius
    *   **effects**: AI generates narrative context, identifies most significant location as mainLocation, creates new Context c with c.user=user, c.centerLocation=location, c.radius=radius, generates unique sessionId, sets c.createdAt to current time, adds initial prompt/response to conversationHistory. Returns context narrative, main location name, and session id.

*   `answerQuestion (sessionId: String, user: User, question: String): (answer: String)`
    *   **requires**: Context exists with sessionId and context.user=user
    *   **effects**: AI generates answer based on context and question, appends new Exchange(prompt, response) to context.conversationHistory. Returns answer grounded in historical context.

*   `clearSession (sessionId: String, user: User)`
    *   **requires**: Context exists with sessionId and context.user=user
    *   **effects**: Removes Context from set

*   `getChat (user: User, mainLocation: String): (context: Context)`
    *   **requires**: user is authenticated
    *   **effects**: Returns the most recent Context where context.user=user and context.mainLocation=mainLocation


NOTE: No context tool used for this, I used my implementation from assignment 3.

```typescript
/**
 * concept: AIHistoricalContextAgent [User]
 * purpose: generate location-aware historical narratives and preserve them for future reference
 * principle: after generating historical context for a location with radius, user can retrieve it later by main location name 
 *            to continue exploration or review past discoveries; user can also ask follow-up questions grounded in that context
 */

import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM } from '../../gemini-llm.ts';

/**
 * Represents geographical coordinates.
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Represents a prompt/response exchange in a conversation.
 */
interface Exchange {
  prompt: string;
  response: string;
}

/**
 * Represents a context document in the database.
 * A set of Contexts with
 *   an id of type String (sessionId)
 *   a user of type User
 *   a centerLocation of type Coordinates (lat, lng)
 *   a radius of type Number (in meters)
 *   a mainLocation of type String (descriptive name of most significant location)
 *   a createdAt of type DateTime
 *   a conversationHistory of type List<Exchange> (prompt/response pairs)
 */
interface Context {
  _id: ID; // sessionId
  user: ID;
  centerLocation: Coordinates;
  radius: number;
  mainLocation: string;
  createdAt: Date;
  conversationHistory: Exchange[];
}

export default class AIHistoricalContextAgentConcept {
  // Declare collection prefix, use concept name
  private static readonly PREFIX = "AIHistoricalContextAgent" + ".";

  private contexts: Collection<Context>;
  private maxRetries: number = 3; // Maximum number of retry attempts

  constructor(private readonly db: Db) {
    this.contexts = this.db.collection(AIHistoricalContextAgentConcept.PREFIX + "contexts");
  }

  /**
   * generateContext (user: User, location: Coordinates, radius: Number): (context: String, mainLocation: String, sessionId: String)
   *
   * **requires**: user is authenticated, valid coordinates and positive radius
   *
   * **effects**: AI generates narrative context, identifies most significant location as mainLocation, creates new Context c with 
   *              c.user=user, c.centerLocation=location, c.radius=radius, generates unique sessionId, sets c.createdAt to current time, 
   *              adds initial prompt/response to conversationHistory. Returns context narrative, main location name, and session id.
   */
  async generateContext({
    llm,
    user,
    location,
    radius,
  }: {
    llm: GeminiLLM;
    user: ID;
    location: Coordinates;
    radius: number;
  }): Promise<{ context: string; mainLocation: string; sessionId: string } | { error: string }> {
    // Validate inputs
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return { error: 'Invalid coordinates provided' };
    }
    if (!radius || radius <= 0) {
      return { error: 'Radius must be a positive number' };
    }

    console.log(`🌍 Generating historical context for location (${location.lat}, ${location.lng}) with radius ${radius}m...`);

    let basePrompt = this.createContextPrompt(location, radius);
    
    // Retry loop with validation
    let lastError: string = '';
    let validationFeedback: string[] = [];
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`\n🔄 Attempt ${attempt}/${this.maxRetries}...`);
        
        // Add validation feedback from previous attempts to the prompt
        let prompt = basePrompt;
        if (validationFeedback.length > 0) {
          prompt = basePrompt + `\n\nIMPORTANT - PREVIOUS ATTEMPT(S) FAILED VALIDATION:
${validationFeedback.map((feedback, idx) => `Attempt ${idx + 1}: ${feedback}`).join('\n')}

Please correct these issues in your response. Pay special attention to the validation feedback above.`;
          console.log('📝 Including validation feedback from previous attempts in prompt');
        }
        
        const response = await llm.executeLLM(prompt);
        
        console.log('✅ Received response from Gemini AI!');
        console.log('\n🤖 RAW GEMINI RESPONSE');
        console.log('======================');
        console.log(response);
        console.log('======================\n');

        // Validate the response
        const validationResult = await this.validateContextResponse(llm, response, location, radius);
        
        if (!validationResult.isValid) {
          lastError = validationResult.reason || 'Validation failed';
          validationFeedback.push(lastError); // Store feedback for next attempt
          console.log(`❌ Attempt ${attempt} failed validation: ${lastError}`);
          
          if (attempt < this.maxRetries) {
            console.log('🔄 Retrying with validation feedback...\n');
            continue;
          } else {
            return { error: `All ${this.maxRetries} attempts failed. Last error: ${lastError}` };
          }
        }

        // Parse the response to extract mainLocation and context
        const parsed = this.parseContextResponse(response);
        
        // Create a new context in MongoDB
        const sessionId = freshID() as ID;
        const newContext: Context = {
          _id: sessionId,
          user,
          centerLocation: location,
          radius,
          mainLocation: parsed.mainLocation,
          createdAt: new Date(),
          conversationHistory: [
            {
              prompt: prompt,
              response: response
            }
          ]
        };
        
        await this.contexts.insertOne(newContext);
        
        console.log(`✅ Created session ${sessionId} with main location: ${parsed.mainLocation}`);
        console.log(`✅ Successfully generated context after ${attempt} attempt(s)\n`);
        
        return {
          context: parsed.context,
          mainLocation: parsed.mainLocation,
          sessionId: sessionId as string
        };
        
      } catch (error) {
        lastError = (error as Error).message;
        validationFeedback.push(lastError); // Store error feedback for next attempt
        console.error(`❌ Attempt ${attempt} error:`, lastError);
        
        if (attempt >= this.maxRetries) {
          console.error('❌ Error generating historical context after all retries:', lastError);
          return { error: lastError };
        }
        
        console.log('🔄 Retrying with error feedback...\n');
      }
    }
    
    return { error: `Failed to generate context after ${this.maxRetries} attempts. Last error: ${lastError}` };
  }

  /**
   * answerQuestion (sessionId: String, user: User, question: String): (answer: String)
   *
   * **requires**: Context exists with sessionId and context.user=user
   *
   * **effects**: AI generates answer based on context and question, appends new Exchange(prompt, response) to context.conversationHistory. 
   *              Returns answer grounded in historical context.
   */
  async answerQuestion({
    llm,
    sessionId,
    user,
    question,
  }: {
    llm: GeminiLLM;
    sessionId: ID;
    user: ID;
    question: string;
  }): Promise<{ answer: string } | { error: string }> {
    // Validate session exists
    const context = await this.contexts.findOne({ _id: sessionId, user });
    if (!context) {
      return { error: `No active context found for session ${sessionId}` };
    }

    console.log(`💬 Answering question for session ${sessionId}...`);
    console.log(`   Question: "${question}"`);

    const prompt = this.createQuestionPrompt(context, question);
    
    try {
      const answer = await llm.executeLLM(prompt);
      
      console.log('✅ Received answer from Gemini AI!');
      console.log(`   Answer: "${answer.substring(0, 100)}${answer.length > 100 ? '...' : ''}"`);

      // Add prompt/response pair to conversation history
      await this.contexts.updateOne(
        { _id: sessionId },
        { $push: { conversationHistory: { prompt, response: answer } } }
      );
      
      return { answer };
      
    } catch (error) {
      console.error('❌ Error answering question:', (error as Error).message);
      return { error: (error as Error).message };
    }
  }

  /**
   * clearSession (sessionId: String, user: User)
   *
   * **requires**: Context exists with sessionId and context.user=user
   *
   * **effects**: Removes Context from set
   */
  async clearSession({
    sessionId,
    user,
  }: {
    sessionId: ID;
    user: ID;
  }): Promise<Empty | { error: string }> {
    const deleteResult = await this.contexts.deleteOne({ _id: sessionId, user });
    
    if (deleteResult.deletedCount === 0) {
      return { error: `No active context found for session ${sessionId}` };
    }
    
    console.log(`🗑️  Cleared session ${sessionId}`);
    return {};
  }

  /**
   * _getChat (user: User, mainLocation: String): (context: Context)
   *
   * **requires**: user is authenticated
   *
   * **effects**: Returns the most recent Context where context.user=user and context.mainLocation=mainLocation
   */
  async _getChat({
    user,
    mainLocation,
  }: {
    user: ID;
    mainLocation: string;
  }): Promise<Array<{ context: Context }> | { error: string }> {
    const context = await this.contexts
      .find({ user, mainLocation })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    if (!context || context.length === 0) {
      return {
        error: `No context found for user ${user} and location ${mainLocation}`,
      };
    }
    
    // Queries always return an array of dictionaries
    return [{ context: context[0] }];
  }

  /**
   * Create the prompt for generating historical context
   */
  private createContextPrompt(location: Coordinates, radius: number): string {
    const radiusKm = (radius / 1000).toFixed(2);
    
    // Determine the appropriate scale for the main location based on radius
    let scaleGuidance = '';
    if (radius < 1000) { // Less than 1km
      scaleGuidance = 'Since the radius is very small (< 1km), the "mainLocation" should be a SPECIFIC LANDMARK, BUILDING, or STREET NAME within this area, NOT a city or region name.';
    } else if (radius < 50000) { // 1km to 50km
      scaleGuidance = 'Since the radius is moderate (1-50km), the "mainLocation" should be a CITY, NEIGHBORHOOD, or DISTRICT NAME that best represents this area.';
    } else { // 50km or more
      scaleGuidance = 'Since the radius is large (> 50km), the "mainLocation" should be a REGION, STATE, or LARGE GEOGRAPHICAL AREA NAME (like "New England", "The Bay Area", "Southern California"), NOT a specific city name.';
    }
    
    return `You are a knowledgeable local historian who provides engaging, accurate historical context about locations.

TASK:
Generate a rich historical narrative about the area around coordinates (${location.lat}, ${location.lng}) within a radius of ${radius} meters (${radiusKm} km).

CRITICAL REQUIREMENT FOR MAIN LOCATION:
${scaleGuidance}

REQUIREMENTS:
1. Identify the most historically significant location within this area at the APPROPRIATE SCALE for the radius
2. Provide 2-4 paragraphs of engaging historical context about this area
3. Include:
   - Historical events that occurred in this area
   - Significant buildings, landmarks, or natural features and their history
   - Cultural or social significance of the location
   - How the area has changed over time
4. Write in an accessible, engaging style that makes history come alive
5. Be specific and grounded in real historical facts
6. If this is a less historically documented area (rural, wilderness, etc.), discuss:
   - Indigenous peoples who lived there
   - Natural history and geological features
   - How the land was used historically
   - Any relevant regional history
7. Scale your narrative appropriately:
   - Small radius (< 1km): Focus on specific landmarks and immediate surroundings
   - Medium radius (1-50km): Focus on city/district history and development
   - Large radius (> 50km): Focus on regional history, broader patterns, and major developments

IMPORTANT EXCEPTION - DESOLATE OR INSIGNIFICANT LOCATIONS:
If these coordinates fall in a truly desolate location with no historical significance (e.g., middle of an ocean, uninhabited desert, remote wilderness) AND the radius is not large enough to capture any historically significant areas, then:
- Set "mainLocation" to "No significant historical location"
- Set "context" to a brief statement (1-2 sentences) explaining that there is no notable historical context for this location, such as: "This location does not contain any significant historical landmarks or documented historical events. The area is geographically remote/oceanic/uninhabited with no recorded human historical significance."

Return your response as a JSON object with this exact structure:
{
  "mainLocation": "Name of the location at the appropriate scale for the radius OR 'No significant historical location'",
  "context": "Your engaging historical narrative (2-4 paragraphs) OR brief no-context statement (1-2 sentences)"
}

Return ONLY the JSON object, no additional text.`;
  }

  /**
   * Create the prompt for answering a follow-up question
   */
  private createQuestionPrompt(context: Context, question: string): string {
    const radiusKm = (context.radius / 1000).toFixed(2);
    
    // Get the initial context from the first conversation entry
    const initialContextResponse = context.conversationHistory[0]?.response || '';
    
    // Parse the initial context to get the narrative text
    let historicalNarrative = '';
    try {
      const jsonMatch = initialContextResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        historicalNarrative = parsed.context || '';
      }
    } catch {
      // If parsing fails, use the raw response
      historicalNarrative = initialContextResponse;
    }
    
    // Include previous Q&A exchanges (skip the first entry which is the initial context)
    const previousQA = context.conversationHistory.slice(1);
    const conversationContext = previousQA.length > 0
      ? `\n\nPREVIOUS CONVERSATION:\n${previousQA
          .map((exchange, index) => {
            // Extract the question from the prompt (after "USER QUESTION:")
            const questionMatch = exchange.prompt.match(/USER QUESTION:\s*(.+?)(?:\n|$)/s);
            const extractedQuestion = questionMatch ? questionMatch[1].trim() : 'Question';
            return `Q: ${extractedQuestion}\nA: ${exchange.response}`;
          })
          .join('\n\n')}`
      : '';
    
    return `You are a knowledgeable local historian answering questions about a specific location and its surrounding area.

LOCATION CONTEXT:
You are discussing the area around coordinates (${context.centerLocation.lat}, ${context.centerLocation.lng}) within a radius of ${context.radius} meters (${radiusKm} km).
Main Location: ${context.mainLocation}

HISTORICAL CONTEXT PROVIDED EARLIER:
${historicalNarrative}${conversationContext}

USER QUESTION:
${question}

REQUIREMENTS:
1. Answer the question using your knowledge about this location and the surrounding area
2. You may use information beyond the historical context provided above, as long as it's relevant to this location
3. Be conversational and engaging
4. Provide specific, accurate details about the area
5. When possible, connect your answer to the historical context or previous discussion
6. If the question is about something in this general area (like schools, landmarks, geography, etc.), answer based on your knowledge of the region

Return ONLY your answer as plain text, no additional formatting or labels.`;
  }

  /**
   * Validate the LLM response for correctness and hallucinations
   * Returns true if valid, false if should retry
   */
  private async validateContextResponse(
    llm: GeminiLLM,
    responseText: string,
    location: Coordinates,
    radius: number
  ): Promise<{ isValid: boolean; reason?: string }> {
    console.log('🔍 Validating LLM response...');
    
    // Step 1: Validate JSON structure
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { isValid: false, reason: 'No JSON found in response' };
      }

      const response = JSON.parse(jsonMatch[0]);
      
      if (!response.mainLocation || typeof response.mainLocation !== 'string') {
        return { isValid: false, reason: 'Missing or invalid mainLocation field' };
      }
      
      if (!response.context || typeof response.context !== 'string') {
        return { isValid: false, reason: 'Missing or invalid context field' };
      }

      // Check if it's a "no context" response - these are valid and don't need hallucination check
      const isNoContextResponse = response.mainLocation === "No significant historical location" ||
                                  response.mainLocation.toLowerCase().includes("no significant");
      
      if (isNoContextResponse) {
        console.log('✅ Valid "no context" response - skipping hallucination check');
        return { isValid: true };
      }

      // Step 2: Use secondary agent to check for hallucinations
      console.log('🤖 Running secondary agent hallucination check...');
      const hallucinationCheckPrompt = this.createHallucinationCheckPrompt(
        location,
        radius,
        response.mainLocation,
        response.context
      );
      
      const hallucinationCheckResponse = await llm.executeLLM(hallucinationCheckPrompt);
      
      console.log('📝 Hallucination check result:', hallucinationCheckResponse.substring(0, 100));
      
      // Parse the hallucination check response
      const checkResult = this.parseHallucinationCheckResponse(hallucinationCheckResponse);
      
      if (!checkResult.isValid) {
        console.log(`⚠️  Hallucination detected: ${checkResult.reason}`);
        return { isValid: false, reason: checkResult.reason };
      }
      
      console.log('✅ Response passed all validation checks');
      return { isValid: true };
      
    } catch (error) {
      return { isValid: false, reason: `Validation error: ${(error as Error).message}` };
    }
  }

  /**
   * Create prompt for hallucination checking by secondary agent
   */
  private createHallucinationCheckPrompt(
    location: Coordinates,
    radius: number,
    mainLocation: string,
    context: string
  ): string {
    const radiusKm = (radius / 1000).toFixed(2);
    
    return `You are a fact-checking AI assistant. Your job is to review historical information for accuracy and detect hallucinations or fabrications.

LOCATION INFORMATION:
Coordinates: (${location.lat}, ${location.lng})
Radius: ${radius} meters (${radiusKm} km)

CLAIMED MAIN LOCATION:
"${mainLocation}"

HISTORICAL CONTEXT PROVIDED:
${context}

YOUR TASK:
You MUST determine if the claimed location matches the given coordinates. Be EXTREMELY STRICT.

CRITICAL CHECKS (in order):

1. HEMISPHERE CHECK (MOST IMPORTANT):
   - Latitude ${location.lat} is ${location.lat >= 0 ? 'POSITIVE (Northern Hemisphere)' : 'NEGATIVE (Southern Hemisphere)'}
   - Does "${mainLocation}" exist in the ${location.lat >= 0 ? 'Northern' : 'Southern'} Hemisphere?
   - If the claimed location is actually in the opposite hemisphere, this is a HALLUCINATION
   - Examples:
     * Boston, MA is at +42.3° (Northern), NOT -42.3° (Southern)  
     * Olympia, WA is at +47.0° (Northern), NOT -48.0° (Southern)
     * Victoria, BC is at +48.4° (Northern), NOT -48.4° (Southern)

2. OCEANIC LOCATION CHECK:
   - If |latitude| > 45° AND the radius is < 50km, check if this could be in open ocean
   - Coordinates near (-48, -123) with small radius are in the MIDDLE OF THE PACIFIC OCEAN
   - If coordinates are in an ocean with small radius, claiming any land-based location is a HALLUCINATION

3. DISTANCE VERIFICATION:
   - Is the claimed location actually within ${(radius / 1000).toFixed(0)}km of (${location.lat}, ${location.lng})?
   - If not, this is a HALLUCINATION

4. FABRICATED LOCATIONS:
   - Does the location actually exist where claimed?

IMPORTANT: If the coordinates are in the wrong hemisphere from the claimed location, you MUST mark it as invalid. This is a severe hallucination.

Return your response as a JSON object with this exact structure:
{
  "isValid": true/false,
  "reason": "Brief explanation of your determination (1-2 sentences). If valid, explain why. If invalid, explain what hallucination was detected."
}

Return ONLY the JSON object, no additional text.`;
  }

  /**
   * Parse the hallucination check response
   */
  private parseHallucinationCheckResponse(responseText: string): { isValid: boolean; reason: string } {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // If we can't parse the response, assume valid to avoid blocking legitimate responses
        return { isValid: true, reason: 'Could not parse hallucination check response' };
      }

      const response = JSON.parse(jsonMatch[0]);
      
      return {
        isValid: response.isValid === true,
        reason: response.reason || 'No reason provided'
      };
    } catch (error) {
      // If parsing fails, assume valid to avoid blocking legitimate responses
      return { isValid: true, reason: 'Error parsing hallucination check response' };
    }
  }

  /**
   * Parse the LLM response for context generation
   */
  private parseContextResponse(responseText: string): { context: string; mainLocation: string } {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const response = JSON.parse(jsonMatch[0]);
      
      // Validate response structure
      if (!response.mainLocation || typeof response.mainLocation !== 'string') {
        throw new Error('Response missing valid mainLocation field');
      }
      
      if (!response.context || typeof response.context !== 'string') {
        throw new Error('Response missing valid context field');
      }

      // Validate content quality
      const isNoContextResponse = response.mainLocation === "No significant historical location" ||
                                  response.mainLocation.toLowerCase().includes("no significant");
      
      if (!isNoContextResponse && response.context.length < 100) {
        throw new Error('Historical context is too short (minimum 100 characters expected)');
      }

      if (response.mainLocation.trim().length === 0) {
        throw new Error('Main location cannot be empty');
      }

      if (isNoContextResponse) {
        console.log('✅ Successfully validated response (no historical context at this location)');
      } else {
        console.log('✅ Successfully validated historical context response');
      }
      
      return {
        context: response.context.trim(),
        mainLocation: response.mainLocation.trim()
      };
      
    } catch (error) {
      console.error('❌ Error parsing LLM response:', (error as Error).message);
      console.log('Response was:', responseText);
      throw error;
    }
  }
}
```