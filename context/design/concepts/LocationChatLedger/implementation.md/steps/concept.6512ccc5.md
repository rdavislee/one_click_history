---
timestamp: 'Sun Oct 19 2025 15:07:18 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251019_150718.0f2c3e58.md]]'
content_id: 6512ccc5c4daea70c430650c88add1882f847cf820c36526b2b78f6cb8badb1c
---

# concept: LocationChatLedger

* **concept**: LocationChatLedger \[User]
* **purpose**: To preserve location-based historical explorations for future reference.
* **principle**: After creating a chat for a location with radius, user can retrieve it later to continue exploration or review past discoveries.
* **state**:
  * A set of `Chats` with
    * an `id` of type `String`
    * a `user` of type `User`
    * a `centerLocation` of type `Coordinates` (lat, lng)
    * a `radius` of type `Number` (in meters)
    * a `mainLocation` of type `String` (descriptive name)
    * a `createdAt` of type `DateTime`
    * a `context` of type `String` (initial historical context)
    * a `messages` of type `List<Message>` (question/answer pairs)
* **actions**:
  * `createChat (user: User, location: Coordinates, radius: Number): (chatId: String)`
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
