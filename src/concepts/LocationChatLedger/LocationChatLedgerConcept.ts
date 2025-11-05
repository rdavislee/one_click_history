/**
 * concept: LocationChatLedger [User]
 * purpose: To track location-based chat sessions so users can find and resume their historical explorations.
 * principle: After creating a chat session for a location, user can retrieve the session reference later to access 
 *            the full conversation from the chat agent.
 */

import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";

/**
 * Represents geographical coordinates.
 */
interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Represents a chat entry in the ledger.
 * A set of ChatEntries with
 *   an id of type String (sessionId from chat agent)
 *   a user of type User
 *   a centerLocation of type Coordinates (lat, lng)
 *   a radius of type Number (in meters)
 *   a mainLocation of type String (descriptive name)
 *   a createdAt of type DateTime
 */
interface ChatEntry {
  _id: ID; // sessionId from AIHistoricalContextAgent
  user: ID;
  centerLocation: Coordinates;
  radius: number;
  mainLocation: string;
  createdAt: Date;
}

export default class LocationChatLedgerConcept {
  // Declare collection prefix, use concept name
  private static readonly PREFIX = "LocationChatLedger" + ".";

  private chatEntries: Collection<ChatEntry>;

  constructor(private readonly db: Db) {
    this.chatEntries = this.db.collection(LocationChatLedgerConcept.PREFIX + "chatEntries");
  }

  /**
   * recordChat (sessionId: String, user: User, location: Coordinates, radius: Number, mainLocation: String)
   *
   * **requires**: user is authenticated, sessionId is valid
   *
   * **effects**: Creates new chat entry c with c.id=sessionId, c.user=user, c.centerLocation=location, 
   *              c.radius=radius, c.mainLocation=mainLocation, sets c.createdAt to current time.
   */
  async recordChat({
    sessionId,
    user,
    location,
    radius,
    mainLocation,
  }: {
    sessionId: ID;
    user: ID;
    location: Coordinates;
    radius: number;
    mainLocation: string;
  }): Promise<Empty | { error: string }> {
    const newEntry: ChatEntry = {
      _id: sessionId,
      user,
      centerLocation: location,
      radius,
      mainLocation,
      createdAt: new Date(),
    };

    try {
      await this.chatEntries.insertOne(newEntry);
      return {};
    } catch (e) {
      console.error("Failed to record chat:", e);
      return { error: "Failed to record chat" };
    }
  }

  /**
   * getUserChats (user: User): (chats: List<ChatEntry>)
   *
   * **requires**: user is authenticated
   *
   * **effects**: Returns all chat entries where chat.user=user, sorted by createdAt descending.
   */
  async getUserChats({
    user,
  }: {
    user: ID;
  }): Promise<{ chats: ChatEntry[] } | { error: string }> {
    const chats = await this.chatEntries
      .find({ user })
      .sort({ createdAt: -1 })
      .toArray();

    if (!chats) {
      return { error: "Failed to retrieve chats" };
    }

    return { chats };
  }

  /**
   * getChat (sessionId: String, user: User): (chat: ChatEntry)
   *
   * **requires**: chat entry exists with sessionId and chat.user=user
   *
   * **effects**: Returns the chat entry matching the sessionId and user.
   */
  async getChat({
    sessionId,
    user,
  }: {
    sessionId: ID;
    user: ID;
  }): Promise<{ chat: ChatEntry } | { error: string }> {
    const chat = await this.chatEntries.findOne({ _id: sessionId, user });

    if (!chat) {
      return {
        error: `Chat entry with session ID ${sessionId} for user ${user} not found.`,
      };
    }
    return { chat };
  }

  /**
   * _getUserChats (user: User): (chat: List<ChatEntry>)
   *
   * **requires**: user is authenticated (implicitly handled)
   *
   * **effects**: Returns all chat entries where chat.user=user, sorted by createdAt descending.
   */
  async _getUserChats({
    user,
  }: {
    user: ID;
  }): Promise<Array<{ chat: ChatEntry }> | { error: string }> {
    const result = await this.getUserChats({ user });
    if ('error' in result) {
      return result;
    }
    return result.chats.map((c) => ({ chat: c }));
  }

  /**
   * _getChat (sessionId: String, user: User): (chat: ChatEntry)
   *
   * **requires**: chat entry exists with sessionId and chat.user=user
   *
   * **effects**: Returns the chat entry matching the sessionId and user.
   */
  async _getChat({
    sessionId,
    user,
  }: {
    sessionId: ID;
    user: ID;
  }): Promise<Array<{ chat: ChatEntry }> | { error: string }> {
    const result = await this.getChat({ sessionId, user });
    if ('error' in result) {
      return result;
    }
    return [result];
  }
}
