---
timestamp: 'Sun Oct 19 2025 17:29:52 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251019_172952.917ec925.md]]'
content_id: c3b3cc2fa3f5013ef328f1cf6b07179ac86465d5777c741a20da673e400f4177
---

# concept: LocationChatLedger

* **concept**: LocationChatLedger \[User]
* **purpose**: To preserve location-based historical explorations for future reference.
* **principle**: After creating a chat for a location with radius, user can retrieve it later to continue exploration or review past discoveries.
* **state**:
  * A set of `ChatEntries` with
    * an `id` of type `String` (sessionId from chat agent)
    * a `user` of type `User`
    * a `centerLocation` of type `Coordinates` (lat, lng)
    * a `radius` of type `Number` (in meters)
    * a `mainLocation` of type `String` (descriptive name)
    * a `createdAt` of type `DateTime`
* **actions**:
  * `recordChat (sessionId: String, user: User, location: Coordinates, radius: Number, mainLocation: String)`
    * **requires**: user is authenticated, sessionId is valid
    * **effects**: Creates new chat entry c with c.id=sessionId, c.user=user, c.centerLocation=location, c.radius=radius, c.mainLocation=mainLocation, sets c.createdAt to current time.
  * `getUserChats (user: User): (chats: List<ChatEntry>)`
    * **requires**: user is authenticated
    * **effects**: Creates new chat c with c.user=user, c.centerLocation=location, c.radius=radius, generates unique id, sets c.createdAt to current time, initializes empty messages list. Returns chat id.
  * `setContext (chatId: String, context: String, mainLocation: String)`
    * **requires**: chat with chatId exists
    * **effects**: Sets chat.context=context and chat.mainLocation=mainLocation
  * `addMessage (chatId: String, question: String, answer: String)`
    * **requires**: chat with chatId exists
    * **effects**: Appends new Message(question, answer) to chat.messages
  * `getUserChats (user: User): (chats: List<Chat>)`
    * **requires**: user is authenticated
    * **effects**: Returns all chats where chat.user=user, sorted by createdAt descending
  * `getChat (chatId: String, user: User): (chat: Chat)`
    * **requires**: chat exists with chatId and chat.user=user
    * **effects**: Returns the chat
