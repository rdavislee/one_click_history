# One Click History - API Documentation

This document provides an overview of the REST API exposed by the Concept Server.

## Running the Server

To start the API server, run:

```bash
deno task concepts
```

The server will listen on **http://localhost:8000** with the base URL `/api`.

---

## Architecture

The API is built using a concept-oriented design pattern where each concept represents a distinct behavioral concern. All concepts are exposed as REST endpoints following these conventions:

- **Base URL:** `/api`
- **Endpoint Pattern:** `/api/{ConceptName}/{actionOrQueryName}`
- **HTTP Method:** All endpoints use `POST`
- **Content Type:** `application/json` for both requests and responses
- **Authentication:** User IDs are passed in request bodies (stateless)

---

## Available Concepts

### 1. UserAuthentication

Handles user registration, login, and password management.

**Endpoints:**
- `POST /api/UserAuthentication/register` - Create a new user account
- `POST /api/UserAuthentication/login` - Authenticate and get user ID
- `POST /api/UserAuthentication/changePassword` - Update user password

[View Full Specification →](./concepts/UserAuthentication/api-spec.md)

---

### 2. LocationChatLedger

Tracks location-based chat sessions for organizing historical explorations.

**Endpoints:**
- `POST /api/LocationChatLedger/recordChat` - Record a new chat session
- `POST /api/LocationChatLedger/_getUserChats` - Get all chats for a user
- `POST /api/LocationChatLedger/_getChat` - Get a specific chat by session ID

[View Full Specification →](./concepts/LocationChatLedger/api-spec.md)

---

### 3. AIHistoricalContextAgent

Generates and manages AI-powered historical narratives for geographic locations.

**Endpoints:**
- `POST /api/AIHistoricalContextAgent/generateContext` - Generate historical context for a location
- `POST /api/AIHistoricalContextAgent/answerQuestion` - Ask follow-up questions about a location
- `POST /api/AIHistoricalContextAgent/clearSession` - Delete a context session
- `POST /api/AIHistoricalContextAgent/_getChat` - Retrieve context by location name

[View Full Specification →](./concepts/HistoricalContextAgent/api-spec.md)

---

## General Response Format

### Success Responses

**Actions** return a JSON object with result fields:
```json
{
  "result1": "value",
  "result2": "value"
}
```

Empty success responses return:
```json
{}
```

**Queries** (methods starting with `_`) return a JSON array:
```json
[
  {
    "field1": "value",
    "field2": "value"
  }
]
```

### Error Responses

All errors return a JSON object with a single `error` field:
```json
{
  "error": "Descriptive error message"
}
```

---

## Type Definitions

### ID Type
- Represented as a `string`
- Generated using UUID v7
- Used for user IDs, session IDs, and other entity identifiers

### Coordinates
```json
{
  "lat": "number",
  "lng": "number"
}
```

### DateTime
- Represented as ISO 8601 date strings
- Generated server-side with `new Date()`

---

## Example Workflows

### 1. User Registration and Login

```bash
# Register a new user
curl -X POST http://localhost:8000/api/UserAuthentication/register \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "secret123"}'

# Response: {"userId": "01932e9c-..."}

# Login
curl -X POST http://localhost:8000/api/UserAuthentication/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "secret123"}'

# Response: {"userId": "01932e9c-..."}
```

### 2. Exploring Historical Locations

```bash
# Generate historical context (Note: requires server-side LLM configuration)
curl -X POST http://localhost:8000/api/AIHistoricalContextAgent/generateContext \
  -H "Content-Type: application/json" \
  -d '{
    "user": "01932e9c-...",
    "location": {"lat": 42.3601, "lng": -71.0589},
    "radius": 1000
  }'

# Response: {
#   "context": "Historical narrative...",
#   "mainLocation": "Boston Common",
#   "sessionId": "01932ea1-..."
# }

# Record the chat session
curl -X POST http://localhost:8000/api/LocationChatLedger/recordChat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "01932ea1-...",
    "user": "01932e9c-...",
    "location": {"lat": 42.3601, "lng": -71.0589},
    "radius": 1000,
    "mainLocation": "Boston Common"
  }'

# Ask a follow-up question
curl -X POST http://localhost:8000/api/AIHistoricalContextAgent/answerQuestion \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "01932ea1-...",
    "user": "01932e9c-...",
    "question": "What events happened here during the American Revolution?"
  }'

# Response: {"answer": "Detailed historical answer..."}
```

### 3. Retrieving Past Explorations

```bash
# Get all chat sessions for a user
curl -X POST http://localhost:8000/api/LocationChatLedger/_getUserChats \
  -H "Content-Type: application/json" \
  -d '{"user": "01932e9c-..."}'

# Get a specific chat
curl -X POST http://localhost:8000/api/LocationChatLedger/_getChat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "01932ea1-...",
    "user": "01932e9c-..."
  }'
```

---

## Configuration

The server requires MongoDB connection configuration via environment variables:

```bash
# .env file
MONGODB_URL=mongodb://localhost:27017
DB_NAME=one_click_history
```

For AIHistoricalContextAgent endpoints, additional Gemini AI configuration is required (see `geminiConfig.json`).

---

## Development

### Server Configuration

The server can be configured via command-line flags:

```bash
deno run src/concept_server.ts --port 8000 --baseUrl /api
```

### Testing Individual Concepts

```bash
deno task test:user-auth
deno task test:location-chat
deno task test:historical
```

---

## Notes

- **Stateless Design:** User authentication is handled via user IDs passed in request bodies
- **No Sessions:** Each request must include necessary authentication/authorization data
- **Queries vs Actions:** Query methods (starting with `_`) return arrays; actions return objects
- **Error Handling:** All normal errors are returned as `{error: "message"}` objects, not thrown exceptions
- **LLM Integration:** Some endpoints require server-side LLM configuration and may have longer response times

---

## Additional Resources

- [Concept Specifications](./background/concept-specifications.md) - Understanding the concept design pattern
- [Implementation Guide](./background/implementing-concepts.md) - How concepts are implemented
- [Testing Guide](./background/testing-concepts.md) - Testing approach for concepts

