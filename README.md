# One Click History

A location-aware historical context application that brings history to life through AI-powered narratives. Users can explore the historical significance of any location by simply providing coordinates and a radius, then engage in an interactive conversation to learn more about the area's past.

## Project Overview

One Click History is a full-stack application built using concept-oriented design principles. The backend exposes location-based historical context generation through a REST API, while the frontend (in a separate repository) provides an intuitive interface for users to explore history through their device's GPS.

### Core Features

- **Location-Based Historical Narratives**: Generate rich, contextual historical information for any geographic location
- **Interactive Q&A**: Ask follow-up questions grounded in the location's historical context
- **Session Management**: Save and resume conversations about specific locations
- **User Authentication**: Secure user accounts with unique profiles
- **Chat History**: Browse previous explorations without loading full conversation data

## Architecture

Built using **concept-oriented design**, the application is structured around three core concepts:

### Concepts

1. **UserAuthentication**: Manages user registration, login, and profile identification
2. **AIHistoricalContextAgent**: Generates location-aware historical narratives with built-in validation to prevent hallucinations
3. **LocationChatLedger**: Stores chat metadata as a reference system for browsing past conversations

### Technology Stack

- **Backend**: TypeScript with Deno runtime
- **Database**: MongoDB Atlas
- **LLM**: Google Gemini 2.5 Flash
- **Framework**: Custom concept engine with synchronizations
- **Design Tool**: Context (markdown-based LLM collaboration)

## Key Documents

- **[Design Changes](design-changes.md)**: Evolution of the concept architecture from Assignment 2 through Assignment 4b
- **[Reflection](reflection.md)**: Personal reflections on the development process, challenges, and insights about LLM-assisted software development
- **[Trace Log](trace.md)**: Example server execution trace showing the system in action
- **[Final Video](finalvideo)**: Demonstration of the complete application *(link to be added)*

## Setup & Installation

### Prerequisites

- [Deno](https://deno.com) installed
- MongoDB Atlas account (free tier)
- Google Gemini API key

### Quick Start

1. Clone the repository
```bash
git clone <repository-url>
cd one_click_history
```

2. Configure environment variables in `.env`:
```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
MONGODB_URL=your_mongodb_connection_string
DB_NAME=your_database_name
```

3. Compile Context tool (optional):
```bash
deno compile -A --output ctx .ctx/context.ts
```

4. Run the server:
```bash
deno task concepts
```

The API server will start on `http://localhost:8000`

## API Documentation

Complete API documentation is available in [`design/API-DOCUMENTATION.md`](design/API-DOCUMENTATION.md), including:

- Endpoint specifications for each concept
- Request/response formats
- Example workflows with curl commands
- Error handling details

Individual concept specifications:
- [UserAuthentication API](design/concepts/UserAuthentication/api-spec.md)
- [LocationChatLedger API](design/concepts/LocationChatLedger/api-spec.md)
- [AIHistoricalContextAgent API](design/concepts/HistoricalContextAgent/api-spec.md)

## Testing

Run all tests:
```bash
deno test -A
```

## Design Process

This project was developed using the Context tool, a markdown-based framework for design-driven development with LLM collaboration. All design decisions, iterations, and LLM interactions are preserved in the `context/` directory.

Key design artifacts:
- `design/background/`: Concept design principles and implementation guides
- `design/concepts/`: Individual concept specifications and implementation notes
- `context/`: Complete version history of all design documents

## Project Structure

```
src/
├── concepts/           # Core concept implementations
│   ├── UserAuthentication/
│   ├── AIHistoricalContextAgent/
│   └── LocationChatLedger/
├── syncs/             # Synchronization rules between concepts
├── engine/            # Concept engine framework
└── main.ts            # Application entry point

design/
├── concepts/          # Concept specifications
├── background/        # Design principles and guides
└── API-DOCUMENTATION.md

context/               # Complete design history (preserved)
```

## Notable Implementation Details

### LLM Hallucination Prevention

The AIHistoricalContextAgent implements a sophisticated validation system:
- **Secondary checker agent** validates location claims before accepting responses
- **Hemisphere verification** prevents geographic mismatches
- **Retry mechanism with feedback** allows the LLM to correct mistakes
- **Up to 3 attempts** with cumulative validation feedback

### Modular Separation of Concerns

- **LocationChatLedger** stores only metadata (location, timestamp, main location name)
- **AIHistoricalContextAgent** manages full conversation history and state
- This separation enables efficient chat browsing without loading entire conversation histories

## Course Information

Developed for **MIT 6.104: Software Studio** (Fall 2025)

Assignment series exploring concept-oriented design, LLM-assisted development, and full-stack application architecture.

## Author

Davis Lee

