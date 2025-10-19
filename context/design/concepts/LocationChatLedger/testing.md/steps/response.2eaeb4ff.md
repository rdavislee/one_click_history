---
timestamp: 'Sun Oct 19 2025 17:29:52 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251019_172952.917ec925.md]]'
content_id: 2eaeb4ffc99fb81542ff784982ca5a3a884c3bcee9937269c859cc17fa25afad
---

# response:

```typescript
import { assertEquals, assertArrayIncludes, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LocationChatLedgerConcept from "./LocationChatLedger.ts";

// Define dummy data for testing
interface Coordinates {
  lat: number;
  lng: number;
}

const userAlice: ID = "user:Alice" as ID;
const userBob: ID = "user:Bob" as ID;

const sessionId1: ID = "session:abc123" as ID;
const sessionId2: ID = "session:def456" as ID;
const sessionId3: ID = "session:ghi789" as ID;

const locationA: Coordinates = { lat: 34.0522, lng: -118.2437 }; // Los Angeles
const locationB: Coordinates = { lat: 40.7128, lng: -74.0060 }; // New York

const radiusSmall = 1000; // 1 km
const radiusLarge = 5000; // 5 km

Deno.test("recordChat: should record a new chat entry", async () => {
  const [db, client] = await testDb();
  const concept = new LocationChatLedgerConcept(db);

  try {
    console.log("Test: recordChat - record a new chat entry");
    const result = await concept.recordChat({
      sessionId: sessionId1,
      user: userAlice,
      location: locationA,
      radius: radiusSmall,
      mainLocation: "Downtown Los Angeles",
    });

    assertEquals("error" in result, false, "recordChat should not return an error");
    assertEquals(Object.keys(result).length, 0, "recordChat should return empty object on success");
    console.log(`- Chat entry recorded with session ID: ${sessionId1}`);

    // Verify state using _getChat (as a query)
    const retrievedChats = await concept._getChat({ sessionId: sessionId1, user: userAlice });
    assertEquals("error" in retrievedChats, false, "Chat entry should be retrievable");
    const chatsArray = retrievedChats as Array<{ chat: any }>;
    assertEquals(chatsArray.length, 1, "Should retrieve exactly one chat entry");
    const retrievedChat = chatsArray[0].chat;

    assertEquals(retrievedChat._id, sessionId1, "Session ID should match");
    assertEquals(retrievedChat.user, userAlice, "Chat user should match Alice");
    assertEquals(retrievedChat.centerLocation, locationA, "Chat location should match locationA");
    assertEquals(retrievedChat.radius, radiusSmall, "Chat radius should match small radius");
    assertEquals(retrievedChat.mainLocation, "Downtown Los Angeles", "Main location should match");
    assertExists(retrievedChat.createdAt, "createdAt timestamp should be set");
    console.log("- Chat entry details verified in state.");
  } finally {
    await client.close();
  }
});

Deno.test("recordChat: should return an error if sessionId already exists", async () => {
  const [db, client] = await testDb();
  const concept = new LocationChatLedgerConcept(db);

  try {
    console.log("Test: recordChat - duplicate sessionId");
    await concept.recordChat({
      sessionId: sessionId1,
      user: userAlice,
      location: locationA,
      radius: radiusSmall,
      mainLocation: "Downtown Los Angeles",
    });
    console.log(`- First chat entry recorded with session ID: ${sessionId1}`);

    // Try to record again with same sessionId
    const result = await concept.recordChat({
      sessionId: sessionId1,
      user: userAlice,
      location: locationB,
      radius: radiusLarge,
      mainLocation: "Manhattan",
    });

    assertEquals("error" in result, true, "Should return an error for duplicate sessionId");
    console.log("- Correctly returned error for duplicate sessionId.");
  } finally {
    await client.close();
  }
});

Deno.test("_getUserChats: should return all chat entries for a specific user, sorted by creation time", async () => {
  const [db, client] = await testDb();
  const concept = new LocationChatLedgerConcept(db);

  try {
    console.log("Test: _getUserChats - retrieve chat entries for a user");
    // Record multiple chats for userAlice and one for userBob
    await concept.recordChat({
      sessionId: sessionId1,
      user: userAlice,
      location: locationA,
      radius: radiusSmall,
      mainLocation: "Downtown Los Angeles",
    });
    await new Promise((resolve) => setTimeout(resolve, 10)); // Ensure different creation times
    
    await concept.recordChat({
      sessionId: sessionId2,
      user: userAlice,
      location: locationB,
      radius: radiusLarge,
      mainLocation: "Manhattan, New York",
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    
    await concept.recordChat({
      sessionId: sessionId3,
      user: userBob,
      location: locationA,
      radius: radiusSmall,
      mainLocation: "Hollywood",
    });
    console.log(`- Recorded 2 chat entries for Alice (${sessionId1}, ${sessionId2}) and 1 for Bob (${sessionId3}).`);

    const aliceChatsResult = await concept._getUserChats({ user: userAlice });
    assertEquals("error" in aliceChatsResult, false, "Should not return an error for getUserChats");
    const aliceChats = aliceChatsResult as Array<{ chat: any }>;
    assertEquals(aliceChats.length, 2, "Alice should have 2 chat entries");
    assertEquals(aliceChats[0].chat._id, sessionId2, "Chats should be sorted by createdAt descending (chat2 first)");
    assertEquals(aliceChats[1].chat._id, sessionId1, "Chats should be sorted by createdAt descending (chat1 second)");
    assertEquals(aliceChats[0].chat.user, userAlice, "Chat 1 should belong to Alice");
    assertEquals(aliceChats[1].chat.user, userAlice, "Chat 2 should belong to Alice");
    console.log("- Alice's chat entries retrieved and sorted correctly.");

    const bobChatsResult = await concept._getUserChats({ user: userBob });
    const bobChats = bobChatsResult as Array<{ chat: any }>;
    assertEquals(bobChats.length, 1, "Bob should have 1 chat entry");
    assertEquals(bobChats[0].chat.user, userBob, "Chat should belong to Bob");
    assertEquals(bobChats[0].chat._id, sessionId3, "Should be Bob's chat entry");
    console.log("- Bob's chat entries retrieved correctly.");

    const noUserChatsResult = await concept._getUserChats({ user: "nonExistentUser" as ID });
    const noUserChats = noUserChatsResult as Array<{ chat: any }>;
    assertEquals(noUserChats.length, 0, "Non-existent user should have 0 chat entries");
    console.log("- No chat entries found for non-existent user, as expected.");
  } finally {
    await client.close();
  }
});

Deno.test("_getChat: should return a specific chat entry by sessionId and user", async () => {
  const [db, client] = await testDb();
  const concept = new LocationChatLedgerConcept(db);

  try {
    console.log("Test: _getChat - retrieve a specific chat entry");
    await concept.recordChat({
      sessionId: sessionId1,
      user: userAlice,
      location: locationA,
      radius: radiusSmall,
      mainLocation: "Downtown Los Angeles",
    });
    console.log(`- Recorded chat entry with session ID: ${sessionId1}`);

    const retrievedChatResult = await concept._getChat({ sessionId: sessionId1, user: userAlice });
    assertEquals("error" in retrievedChatResult, false, "Should not return an error for existing chat");
    const chatsArray = retrievedChatResult as Array<{ chat: any }>;
    assertEquals(chatsArray.length, 1, "Should retrieve exactly one chat entry");
    const retrievedChat = chatsArray[0].chat;

    assertEquals(retrievedChat._id, sessionId1, "Retrieved chat session ID should match");
    assertEquals(retrievedChat.user, userAlice, "Retrieved chat user should match");
    assertEquals(retrievedChat.centerLocation, locationA, "Retrieved location should match");
    assertEquals(retrievedChat.radius, radiusSmall, "Retrieved radius should match");
    assertEquals(retrievedChat.mainLocation, "Downtown Los Angeles", "Retrieved mainLocation should match");
    console.log("- Specific chat entry retrieved and verified.");
  } finally {
    await client.close();
  }
});

Deno.test("_getChat: should return an error if sessionId does not exist for the user", async () => {
  const [db, client] = await testDb();
  const concept = new LocationChatLedgerConcept(db);

  try {
    console.log("Test: _getChat - non-existent sessionId for user");
    await concept.recordChat({
      sessionId: sessionId1,
      user: userAlice,
      location: locationA,
      radius: radiusSmall,
      mainLocation: "Downtown Los Angeles",
    });
    console.log(`- Recorded chat entry with session ID: ${sessionId1} for Alice.`);

    const nonExistentSessionId: ID = "session:nonExistent" as ID;
    const errorResult1 = await concept._getChat({ sessionId: nonExistentSessionId, user: userAlice });
    assertEquals("error" in errorResult1, true, "Should return error for non-existent session ID");
    assertEquals(
      (errorResult1 as { error: string }).error,
      `Chat entry with session ID ${nonExistentSessionId} for user ${userAlice} not found.`
    );
    console.log("- Correctly returned error for non-existent session ID.");

    // Test with wrong user
    const errorResult2 = await concept._getChat({ sessionId: sessionId1, user: userBob });
    assertEquals("error" in errorResult2, true, "Should return error for wrong user");
    assertEquals(
      (errorResult2 as { error: string }).error,
      `Chat entry with session ID ${sessionId1} for user ${userBob} not found.`
    );
    console.log("- Correctly returned error for chat entry belonging to a different user.");
  } finally {
    await client.close();
  }
});

Deno.test("Principle Test: Track location-based chat sessions for future retrieval", async () => {
  const [db, client] = await testDb();
  const concept = new LocationChatLedgerConcept(db);

  try {
    // principle: After creating a chat session for a location, user can retrieve the session reference later 
    //            to access the full conversation from the chat agent.
    console.log("Test: Principle - full trace of user interaction");

    // 1. User Alice creates a chat session for a location with a radius (this happens in the chat agent)
    //    The ledger records this session
    const mainLocation = "Manhattan, New York";
    const recordResult = await concept.recordChat({
      sessionId: sessionId1,
      user: userAlice,
      location: locationB,
      radius: radiusLarge,
      mainLocation: mainLocation,
    });
    assertEquals(Object.keys(recordResult).length, 0, "Principle: Recording chat session should succeed.");
    console.log(`- Alice's chat session for ${mainLocation} (${JSON.stringify(locationB)}) with radius ${radiusLarge}m was recorded. Session ID: ${sessionId1}`);

    // 2. User retrieves the chat entry later to access the session
    const retrievedChats = await concept._getChat({ sessionId: sessionId1, user: userAlice });
    const chatsArray = retrievedChats as Array<{ chat: any }>;
    assertEquals(chatsArray.length, 1, "Principle: Chat entry should be retrievable by sessionId and user.");
    const retrievedChat = chatsArray[0].chat;

    assertEquals(retrievedChat._id, sessionId1, "Principle: Retrieved session ID matches.");
    assertEquals(retrievedChat.user, userAlice, "Principle: Retrieved user matches.");
    assertEquals(retrievedChat.centerLocation, locationB, "Principle: Retrieved location matches.");
    assertEquals(retrievedChat.radius, radiusLarge, "Principle: Retrieved radius matches.");
    assertEquals(retrievedChat.mainLocation, mainLocation, "Principle: Retrieved mainLocation matches.");
    assertExists(retrievedChat.createdAt, "Principle: Creation timestamp exists.");
    console.log("- Alice successfully retrieved the chat entry, confirming session metadata is preserved.");

    // 3. Check _getUserChats to see all sessions
    const allAliceChatsResult = await concept._getUserChats({ user: userAlice });
    const allAliceChats = allAliceChatsResult as Array<{ chat: any }>;
    assertArrayIncludes(allAliceChats.map(c => c.chat._id), [sessionId1], "Principle: Chat entry is present in user's list.");
    assertEquals(allAliceChats.length, 1, "Principle: Alice should only have one chat entry in this trace.");
    console.log("- The chat entry is also listed when retrieving all of Alice's chats.");
    console.log("Principle successfully demonstrated: Session metadata is preserved and retrievable for accessing the full conversation.");
  } finally {
    await client.close();
  }
});
```
