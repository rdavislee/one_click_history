# Design Changes

## Since Assignment 2

### New Concepts

#### User Authentication
- Unique user identification and management
- Support for different user types
- Secure access control

### Enhanced Concepts

#### HistoricalContextAgent
- **Integrated location validation**: Secondary checker agent validates locations in real-time
- **Retry mechanism**: Invalid locations trigger automatic retry requests
- **State persistence**: Complete agent state saved to database
- **Session resumption**: Agents reactivate using user + location pair from ledger

#### LocationChatLedger
- **Focused responsibility**: Now stores chat metadata only (not content)
- **Reference system**: Users browse chat history without loading full conversations
- **Modular design**: Clear separation between chat storage (agent) and references (ledger)

### Benefits
- **Modularity**: Separation of authentication, storage, and references
- **Performance**: Efficient chat browsing without memory overhead
- **Validation**: Real-time location integrity checking
- **State Management**: Seamless pause and resume

## Since Assignment 4b

### Frontend Development
- **Three-page application**:
  - Login/registration page
  - Home page for chat management (access existing or create new)
  - Chat page for historical context learning
- **Location handling**: Frontend captures coordinates and passes to backend