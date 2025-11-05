# Authentication Setup Summary

This document describes the authentication and synchronization setup for the One Click History application.

## Files Created/Modified

### 1. **src/concepts/Requesting/passthrough.ts** (Modified)
Updated to configure which routes are publicly accessible vs. require authentication:

**Inclusions** (Public routes):
- `/api/UserAuthentication/register` - Public registration
- `/api/UserAuthentication/login` - Public login

**Exclusions** (Protected/Internal routes):
- **Requesting internal actions:**
  - `request`, `respond`, `_awaitResponse` - Should never be directly accessible
  
- **UserAuthentication:**
  - `changePassword` - Requires authentication
  
- **AIHistoricalContextAgent:**
  - All actions require authentication: `generateContext`, `answerQuestion`, `clearSession`, `_getChat`
  - All internal helper methods excluded: `createContextPrompt`, `createQuestionPrompt`, `validateContextResponse`, etc.
  
- **LocationChatLedger:**
  - All actions require authentication: `recordChat`, `_getUserChats`, `_getChat`

### 2. **src/utils/llm.ts** (Created)
Global LLM instance for AI-powered features:
- Loads Gemini API configuration from environment variables
- Initializes a single `GeminiLLM` instance to be shared across the application
- Required environment variable: `GEMINI_API_KEY`
- Optional environment variable: `GEMINI_MODEL` (defaults to "gemini-2.0-flash-exp")

### 3. **src/syncs/authenticated.sync.ts** (Created)
Comprehensive synchronizations for all authenticated actions:

#### AIHistoricalContextAgent Syncs:
- **GenerateContextRequest/Response**: Routes requests to generate historical context
- **RecordChatAfterGenerate**: Automatically records chat in the ledger after successful context generation
- **AnswerQuestionRequest/Response**: Routes follow-up questions
- **ClearSessionRequest/Response**: Routes session cleanup
- **GetChatRequest/Response**: Routes chat retrieval queries

#### LocationChatLedger Syncs:
- **GetUserChatsRequest/Response**: Routes requests to get all user's chats
- **GetLedgerChatRequest/Response**: Routes requests to get specific chat

## How It Works

### Authentication Flow
1. **Registration/Login**: Public passthrough routes allow users to register and login
2. **Authenticated Requests**: All other actions require a `userId` parameter
3. **Request Routing**: When a request comes in with a `userId`, the sync:
   - Matches the request path
   - Passes the `userId` as the `user` parameter to the concept action
   - Returns the response back to the client

### Example Request Flow

**Generate Context Request:**
```
Client → POST /api/AIHistoricalContextAgent/generateContext
Body: { userId: "user123", location: {lat: 42.3, lng: -71.0}, radius: 5000 }

1. Requesting.request triggered with path and parameters
2. GenerateContextRequest sync matches and triggers AIHistoricalContextAgent.generateContext
3. generateContext executes with llm, user, location, radius
4. GenerateContextResponse sync captures result and calls Requesting.respond
5. RecordChatAfterGenerate sync also triggers to save chat in ledger
6. Response sent back to client
```

## Frontend Integration

The frontend should:

1. **For Registration/Login**: 
   - POST directly to `/api/UserAuthentication/register` or `/api/UserAuthentication/login`
   - Store the returned `userId` for authenticated requests

2. **For Authenticated Actions**:
   - Include `userId` in every request body
   - Example:
   ```javascript
   fetch('/api/AIHistoricalContextAgent/generateContext', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       userId: storedUserId,
       location: { lat: 42.3, lng: -71.0 },
       radius: 5000
     })
   })
   ```

## API Endpoints

### Public Endpoints (No authentication required)
- `POST /api/UserAuthentication/register` - Register new user
- `POST /api/UserAuthentication/login` - Login existing user

### Protected Endpoints (Require userId)
- `POST /api/UserAuthentication/changePassword` - Change password
- `POST /api/AIHistoricalContextAgent/generateContext` - Generate historical context
- `POST /api/AIHistoricalContextAgent/answerQuestion` - Ask follow-up question
- `POST /api/AIHistoricalContextAgent/clearSession` - Clear session
- `POST /api/AIHistoricalContextAgent/getChat` - Get chat by location
- `POST /api/LocationChatLedger/getUserChats` - Get all user chats
- `POST /api/LocationChatLedger/getChat` - Get specific chat

## Environment Variables Required

Add these to your `.env` file:
```bash
# Required for AI features
GEMINI_API_KEY=your_api_key_here

# Optional configurations
GEMINI_MODEL=gemini-2.0-flash-exp  # Default model
PORT=8000                           # Server port
REQUESTING_BASE_URL=/api            # API base path
REQUESTING_TIMEOUT=10000            # Request timeout in ms
```

## Testing

To test the setup:

1. Start the server:
   ```bash
   deno task start
   ```

2. You should see no "UNVERIFIED ROUTE" warnings - only the two included routes:
   ```
   -> /api/UserAuthentication/register
   -> /api/UserAuthentication/login
   ```

3. Test registration:
   ```bash
   curl -X POST http://localhost:8000/api/UserAuthentication/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"testpass"}'
   ```

4. Test authenticated endpoint (with userId from registration):
   ```bash
   curl -X POST http://localhost:8000/api/LocationChatLedger/getUserChats \
     -H "Content-Type: application/json" \
     -d '{"userId":"returned_user_id"}'
   ```

## Notes

- **Session Management**: Currently, authentication is based on including the `userId` in requests. For production, consider implementing:
  - Session tokens with expiration
  - JWT authentication
  - Refresh tokens
  
- **Authorization**: The current setup verifies that a userId is provided but doesn't verify ownership (e.g., User A could access User B's chats if they know User B's ID). Consider adding authorization checks in syncs.

- **Password Security**: The current `UserAuthentication` concept uses a simple mock hashing function. Replace with bcrypt or similar for production.


