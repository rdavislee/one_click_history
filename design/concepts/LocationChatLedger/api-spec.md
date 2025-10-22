# API Specification: LocationChatLedger Concept

**Purpose:** To track location-based chat sessions so users can find and resume their historical explorations.

---

## API Endpoints

### POST /api/LocationChatLedger/recordChat

**Description:** Records a new chat session entry linking a user to a location-based historical exploration.

**Requirements:**
- user is authenticated
- sessionId is valid

**Effects:**
- Creates new chat entry c with c.id=sessionId
- Sets c.user=user
- Sets c.centerLocation=location
- Sets c.radius=radius
- Sets c.mainLocation=mainLocation
- Sets c.createdAt to current time

**Request Body:**
```json
{
  "sessionId": "string",
  "user": "string",
  "location": {
    "lat": "number",
    "lng": "number"
  },
  "radius": "number",
  "mainLocation": "string"
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
- "Failed to record chat"

---

### POST /api/LocationChatLedger/_getUserChats

**Description:** Retrieves all chat sessions for a specific user, sorted by creation date (most recent first).

**Requirements:**
- user is authenticated

**Effects:**
- Returns all chat entries where chat.user=user, sorted by createdAt descending

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "chat": {
      "_id": "string",
      "user": "string",
      "centerLocation": {
        "lat": "number",
        "lng": "number"
      },
      "radius": "number",
      "mainLocation": "string",
      "createdAt": "Date"
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
- "Failed to retrieve chats"

---

### POST /api/LocationChatLedger/_getChat

**Description:** Retrieves a specific chat session by session ID for a given user.

**Requirements:**
- chat entry exists with sessionId
- chat.user=user

**Effects:**
- Returns the chat entry matching the sessionId and user

**Request Body:**
```json
{
  "sessionId": "string",
  "user": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "chat": {
      "_id": "string",
      "user": "string",
      "centerLocation": {
        "lat": "number",
        "lng": "number"
      },
      "radius": "number",
      "mainLocation": "string",
      "createdAt": "Date"
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
- "Chat entry with session ID {sessionId} for user {user} not found."

---

