/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  "/api/UserAuthentication/register": "public action - anyone can create an account",
  "/api/UserAuthentication/login": "public action - anyone can log in",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  // Requesting - internal actions, should not be directly accessible
  "/api/Requesting/request",
  "/api/Requesting/respond",
  "/api/Requesting/_awaitResponse",
  
  // UserAuthentication - requires authentication
  "/api/UserAuthentication/changePassword",
  
  // AIHistoricalContextAgent - all require authentication or are internal methods
  "/api/AIHistoricalContextAgent/generateContext",
  "/api/AIHistoricalContextAgent/answerQuestion",
  "/api/AIHistoricalContextAgent/clearSession",
  "/api/AIHistoricalContextAgent/getChat",
  "/api/AIHistoricalContextAgent/_getChat",
  "/api/AIHistoricalContextAgent/createContextPrompt",
  "/api/AIHistoricalContextAgent/createQuestionPrompt",
  "/api/AIHistoricalContextAgent/validateContextResponse",
  "/api/AIHistoricalContextAgent/createHallucinationCheckPrompt",
  "/api/AIHistoricalContextAgent/parseHallucinationCheckResponse",
  "/api/AIHistoricalContextAgent/parseContextResponse",
  "/api/AIHistoricalContextAgent/getChatForQuery",
  
  // LocationChatLedger - all require authentication
  "/api/LocationChatLedger/recordChat",
  "/api/LocationChatLedger/getUserChats",
  "/api/LocationChatLedger/getChat",
  "/api/LocationChatLedger/_getUserChats",
  "/api/LocationChatLedger/_getChat",
];
