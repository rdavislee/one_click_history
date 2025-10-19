---
timestamp: 'Sun Oct 19 2025 17:26:05 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251019_172605.16f251b6.md]]'
content_id: c16089d30e239849161f396c2b8984b98609864f0867e2f6b0c6090d0826f80e
---

# implement: AIHistoricalContextAgent

**concept**: AIHistoricalContextAgent \[User]

**purpose**: generate location-aware historical narratives and preserve them for future reference

**principle**: after generating historical context for a location with radius, user can retrieve it later by main location name to continue exploration or review past discoveries; user can also ask follow-up questions grounded in that context

**state**:

* A set of `Contexts` with
  * an `id` of type `String` (sessionId)
  * a `user` of type `User`
  * a `centerLocation` of type `Coordinates` (lat, lng)
  * a `radius` of type `Number` (in meters)
  * a `mainLocation` of type `String` (descriptive name of most significant location)
  * a `createdAt` of type `DateTime`
  * a `conversationHistory` of type `List<Exchange>` (prompt/response pairs)

**actions**:

* `generateContext (user: User, location: Coordinates, radius: Number): (context: String, mainLocation: String, sessionId: String)`
  * **requires**: user is authenticated, valid coordinates and positive radius
  * **effects**: AI generates narrative context, identifies most significant location as mainLocation, creates new Context c with c.user=user, c.centerLocation=location, c.radius=radius, generates unique sessionId, sets c.createdAt to current time, adds initial prompt/response to conversationHistory. Returns context narrative, main location name, and session id.

* `answerQuestion (sessionId: String, user: User, question: String): (answer: String)`
  * **requires**: Context exists with sessionId and context.user=user
  * **effects**: AI generates answer based on context and question, appends new Exchange(prompt, response) to context.conversationHistory. Returns answer grounded in historical context.

* `clearSession (sessionId: String, user: User)`
  * **requires**: Context exists with sessionId and context.user=user
  * **effects**: Removes Context from set

* `getChat (user: User, mainLocation: String): (context: Context)`
  * **requires**: user is authenticated
  * **effects**: Returns the most recent Context where context.user=user and context.mainLocation=mainLocation

NOTE: No context tool used for this, I used my implementation from assignment 3.
