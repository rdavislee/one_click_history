# API Specification: AIHistoricalContextAgent Concept

**Purpose:** Generate location-aware historical narratives and preserve them for future reference.

---

## API Endpoints

### POST /api/AIHistoricalContextAgent/generateContext

**Description:** Generates a historical narrative for a specific geographic location and radius, creating a new conversation session.

**Requirements:**
- user is authenticated
- valid coordinates (lat, lng are numbers)
- positive radius (in meters)
- llm parameter must be provided (GeminiLLM instance for server-side use)

**Effects:**
- AI generates narrative context about the location
- Identifies most significant location as mainLocation
- Creates new Context c with c.user=user, c.centerLocation=location, c.radius=radius
- Generates unique sessionId
- Sets c.createdAt to current time
- Adds initial prompt/response to conversationHistory
- Returns context narrative, main location name, and session id

**Request Body:**
```json
{
  "llm": "object (GeminiLLM)",
  "user": "string",
  "location": {
    "lat": "number",
    "lng": "number"
  },
  "radius": "number"
}
```

**Success Response Body (Action):**
```json
{
  "context": "string",
  "mainLocation": "string",
  "sessionId": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

**Possible Error Messages:**
- "Invalid coordinates provided"
- "Radius must be a positive number"
- "All {maxRetries} attempts failed. Last error: {error}"
- "Failed to generate context after {maxRetries} attempts. Last error: {error}"

---

### POST /api/AIHistoricalContextAgent/answerQuestion

**Description:** Answers a follow-up question about a location based on previously generated historical context.

**Requirements:**
- Context exists with sessionId
- context.user=user
- llm parameter must be provided (GeminiLLM instance for server-side use)

**Effects:**
- AI generates answer based on context and question
- Appends new Exchange(prompt, response) to context.conversationHistory
- Returns answer grounded in historical context

**Request Body:**
```json
{
  "llm": "object (GeminiLLM)",
  "sessionId": "string",
  "user": "string",
  "question": "string"
}
```

**Success Response Body (Action):**
```json
{
  "answer": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

**Possible Error Messages:**
- "No active context found for session {sessionId}"
- Error messages from LLM execution failures

---

### POST /api/AIHistoricalContextAgent/clearSession

**Description:** Deletes a historical context session for a user.

**Requirements:**
- Context exists with sessionId
- context.user=user

**Effects:**
- Removes Context from set

**Request Body:**
```json
{
  "sessionId": "string",
  "user": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

**Possible Error Messages:**
- "No active context found for session {sessionId}"

---

### POST /api/AIHistoricalContextAgent/_getChat

**Description:** Retrieves the most recent historical context session for a user at a specific main location.

**Requirements:**
- user is authenticated

**Effects:**
- Returns the most recent Context where context.user=user and context.mainLocation=mainLocation

**Request Body:**
```json
{
  "user": "string",
  "mainLocation": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "context": {
      "_id": "string",
      "user": "string",
      "centerLocation": {
        "lat": "number",
        "lng": "number"
      },
      "radius": "number",
      "mainLocation": "string",
      "createdAt": "Date",
      "conversationHistory": [
        {
          "prompt": "string",
          "response": "string"
        }
      ]
    }
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

**Possible Error Messages:**
- "No context found for user {user} and location {mainLocation}"

---

## Notes

**Important:** The `llm` parameter in `generateContext` and `answerQuestion` requires a GeminiLLM instance. This is typically handled server-side and may require additional configuration or a wrapper endpoint for client applications. The GeminiLLM object handles:
- Validation and retry logic (up to 3 attempts)
- Hallucination checking via secondary AI agent
- JSON response parsing and validation
- Integration with Google's Gemini AI service

**Context Validation:** The `generateContext` endpoint includes sophisticated validation:
- Hemisphere verification (ensures location names match coordinate hemispheres)
- Oceanic location detection
- Distance verification
- Content quality checks (minimum length requirements)
- Retry with feedback mechanism if validation fails

