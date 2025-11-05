/**
 * Synchronizations for authenticated actions
 */

import { AIHistoricalContextAgent, LocationChatLedger, Requesting, UserAuthentication } from "@concepts";
import { actions, Sync } from "@engine";
import { llm } from "../utils/llm.ts";

// ============================================================================
// AIHistoricalContextAgent - generateContext
// ============================================================================

/**
 * When a request comes in to generate context, verify user is authenticated
 * and then call the generateContext action
 */
export const GenerateContextRequest: Sync = (
  { request, user, location, radius },
) => ({
  when: actions([
    Requesting.request,
    { path: "/AIHistoricalContextAgent/generateContext", user, location, radius },
    { request },
  ]),
  then: actions([
    AIHistoricalContextAgent.generateContext,
    { llm, user, location, radius },
  ]),
});

/**
 * When both the request and generateContext have completed,
 * send the response back
 */
export const GenerateContextResponse: Sync = ({ request, context, mainLocation, sessionId }) => ({
  when: actions(
    [Requesting.request, { path: "/AIHistoricalContextAgent/generateContext" }, { request }],
    [AIHistoricalContextAgent.generateContext, {}, { context, mainLocation, sessionId }],
  ),
  then: actions([Requesting.respond, { request, context, mainLocation, sessionId }]),
});

/**
 * When generateContext completes successfully, record the chat in the ledger
 */
export const RecordChatAfterGenerate: Sync = ({ user, sessionId, location, radius, mainLocation }) => ({
  when: actions([
    AIHistoricalContextAgent.generateContext,
    { user, location, radius },
    { sessionId, mainLocation },
  ]),
  then: actions([
    LocationChatLedger.recordChat,
    { sessionId, user, location, radius, mainLocation },
  ]),
});

// ============================================================================
// AIHistoricalContextAgent - answerQuestion
// ============================================================================

/**
 * When a request comes in to answer a question, verify user is authenticated
 * and then call the answerQuestion action
 */
export const AnswerQuestionRequest: Sync = (
  { request, user, sessionId, question },
) => ({
  when: actions([
    Requesting.request,
    { path: "/AIHistoricalContextAgent/answerQuestion", user, sessionId, question },
    { request },
  ]),
  then: actions([
    AIHistoricalContextAgent.answerQuestion,
    { llm, user, sessionId, question },
  ]),
});

/**
 * When both the request and answerQuestion have completed,
 * send the response back
 */
export const AnswerQuestionResponse: Sync = ({ request, answer }) => ({
  when: actions(
    [Requesting.request, { path: "/AIHistoricalContextAgent/answerQuestion" }, { request }],
    [AIHistoricalContextAgent.answerQuestion, {}, { answer }],
  ),
  then: actions([Requesting.respond, { request, answer }]),
});

// ============================================================================
// AIHistoricalContextAgent - clearSession
// ============================================================================

/**
 * When a request comes in to clear a session, verify user is authenticated
 * and then call the clearSession action
 */
export const ClearSessionRequest: Sync = (
  { request, user, sessionId },
) => ({
  when: actions([
    Requesting.request,
    { path: "/AIHistoricalContextAgent/clearSession", user, sessionId },
    { request },
  ]),
  then: actions([
    AIHistoricalContextAgent.clearSession,
    { user, sessionId },
  ]),
});

/**
 * When both the request and clearSession have completed,
 * send the response back
 */
export const ClearSessionResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/AIHistoricalContextAgent/clearSession" }, { request }],
    [AIHistoricalContextAgent.clearSession, {}, {}],
  ),
  then: actions([Requesting.respond, { request, success: true }]),
});

// ============================================================================
// AIHistoricalContextAgent - getChat
// ============================================================================

/**
 * When a request comes in to get a chat, verify user is authenticated
 * and then call the getChat action
 */
export const GetChatRequest: Sync = (
  { request, user, mainLocation },
) => ({
  when: actions([
    Requesting.request,
    { path: "/AIHistoricalContextAgent/getChat", user, mainLocation },
    { request },
  ]),
  then: actions([
    AIHistoricalContextAgent.getChat,
    { user, mainLocation },
  ]),
});

/**
 * When both the request and getChat have completed,
 * send the response back
 */
export const GetChatResponse: Sync = ({ request, context }) => ({
  when: actions(
    [Requesting.request, { path: "/AIHistoricalContextAgent/getChat" }, { request }],
    [AIHistoricalContextAgent.getChat, {}, { context }],
  ),
  then: actions([Requesting.respond, { request, context }]),
});

// ============================================================================
// AIHistoricalContextAgent - _getChat (query)
// ============================================================================

/**
 * When a request comes in to query a chat, verify user is authenticated
 * and then call the getChatForQuery action (which returns array format)
 */
export const GetChatQueryRequest: Sync = (
  { request, user, mainLocation },
) => ({
  when: actions([
    Requesting.request,
    { path: "/AIHistoricalContextAgent/_getChat", user, mainLocation },
    { request },
  ]),
  then: actions([
    AIHistoricalContextAgent.getChatForQuery,
    { user, mainLocation },
  ]),
});

/**
 * When both the request and getChatForQuery have completed,
 * send the response back (context is already in the correct array format)
 */
export const GetChatQueryResponse: Sync = ({ request, context }) => ({
  when: actions(
    [Requesting.request, { path: "/AIHistoricalContextAgent/_getChat" }, { request }],
    [AIHistoricalContextAgent.getChatForQuery, {}, { context }],
  ),
  then: actions([Requesting.respond, { request, context }]),
});

// ============================================================================
// LocationChatLedger - getUserChats
// ============================================================================

/**
 * When a request comes in to get user chats, verify user is authenticated
 * and then call the getUserChats action
 */
export const GetUserChatsRequest: Sync = (
  { request, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/LocationChatLedger/getUserChats", user },
    { request },
  ]),
  then: actions([
    LocationChatLedger.getUserChats,
    { user },
  ]),
});

/**
 * When both the request and getUserChats have completed,
 * send the response back
 */
export const GetUserChatsResponse: Sync = ({ request, chats }) => ({
  when: actions(
    [Requesting.request, { path: "/LocationChatLedger/getUserChats" }, { request }],
    [LocationChatLedger.getUserChats, {}, { chats }],
  ),
  then: actions([Requesting.respond, { request, chats }]),
});

// ============================================================================
// LocationChatLedger - getChat
// ============================================================================

/**
 * When a request comes in to get a specific chat, verify user is authenticated
 * and then call the getChat action
 */
export const GetLedgerChatRequest: Sync = (
  { request, user, sessionId },
) => ({
  when: actions([
    Requesting.request,
    { path: "/LocationChatLedger/getChat", user, sessionId },
    { request },
  ]),
  then: actions([
    LocationChatLedger.getChat,
    { user, sessionId },
  ]),
});

/**
 * When both the request and getChat have completed,
 * send the response back
 */
export const GetLedgerChatResponse: Sync = ({ request, chat }) => ({
  when: actions(
    [Requesting.request, { path: "/LocationChatLedger/getChat" }, { request }],
    [LocationChatLedger.getChat, {}, { chat }],
  ),
  then: actions([Requesting.respond, { request, chat }]),
});

// ============================================================================
// LocationChatLedger - _getChat (query)
// ============================================================================

/**
 * When a request comes in to query a specific chat, verify user is authenticated
 * and then call the getChat action (queries wrap actions)
 */
export const GetLedgerChatQueryRequest: Sync = (
  { request, user, sessionId },
) => ({
  when: actions([
    Requesting.request,
    { path: "/LocationChatLedger/_getChat", user, sessionId },
    { request },
  ]),
  then: actions([
    LocationChatLedger.getChat,
    { user, sessionId },
  ]),
});

/**
 * When both the request and getChat have completed,
 * send the response back (wrapping in array format for query response)
 */
export const GetLedgerChatQueryResponse: Sync = ({ request, chat }) => ({
  when: actions(
    [Requesting.request, { path: "/LocationChatLedger/_getChat" }, { request }],
    [LocationChatLedger.getChat, {}, { chat }],
  ),
  then: actions([Requesting.respond, { request, chat: [{ chat }] }]),
});

// ============================================================================
// LocationChatLedger - _getUserChats (query)
// ============================================================================

/**
 * When a request comes in to query user chats, verify user is authenticated
 * and then call the getUserChats action (queries wrap actions)
 */
export const GetUserChatsQueryRequest: Sync = (
  { request, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/LocationChatLedger/_getUserChats", user },
    { request },
  ]),
  then: actions([
    LocationChatLedger.getUserChats,
    { user },
  ]),
});

/**
 * When both the request and getUserChats have completed,
 * send the response back (the action returns { chats: ChatEntry[] })
 */
export const GetUserChatsQueryResponse: Sync = ({ request, chats }) => ({
  when: actions(
    [Requesting.request, { path: "/LocationChatLedger/_getUserChats" }, { request }],
    [LocationChatLedger.getUserChats, {}, { chats }],
  ),
  then: actions([Requesting.respond, { request, chats }]),
});

