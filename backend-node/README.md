# Chatbot Spline - Node.js Backend

This is the **Active** backend service for the Chatbot Spline application, built with Node.js, Express, and TypeScript. It handles the core logic, RAG (Retrieval-Augmented Generation) pipeline, and API endpoints.

## Features

- **Multi-Hop RAG**: Iterative retrieval that decomposes complex queries into sub-queries for comprehensive context gathering.
- **Hybrid Search**: Combines semantic vector search (Pinecone) with keyword-based filtering for precise results.
- **RAG Pipeline**: Integrates with Pinecone for vector search and Xenova transformers for local embeddings.
- **Streaming (SSE)**: Server-Sent Events for real-time progressive response delivery.
- **Context Window**: Rolling conversation history for multi-turn dialogue coherence.
- **TypeScript**: Fully typed codebase for maintainability and reliability.

## Setup

### Prerequisites

- Node.js (v18+)
- Pinecone Account & API Key

### Installation

1. Navigate to the `backend-node` directory:
   ```bash
   cd backend-node
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

Create a `.env` file in the `backend-node` directory with the following variables:

```env
PORT=3000
PINECONE_API_KEY=your_pinecone_api_key
OPENAI_API_KEY=your_openai_api_key (if used)
# Add other necessary keys
```

### Running the Server

- **Development Mode**:
  ```bash
  npm run dev
  ```
  Runs with `nodemon` for hot-reloading.

- **Production Build**:
  ```bash
  npm run build
  npm start
  ```

## API Documentation

- `POST /api/chat`: Main endpoint for sending messages. expects standard JSON payload.
- `POST /api/chat/stream`: Streaming endpoint using Server-Sent Events (SSE). Returns chunks of generated text.
- `GET /health`: Health check endpoint.

## Project Structure

- `src/`: Source code.
  - `services/`: Core services — `multihop.service.ts`, `rag.service.ts`, `hybrid.service.ts`, `embedding.service.ts`, `llm.service.ts`, `pinecone.service.ts`
  - `routes/`: API route definitions (`chatHelper.routes.ts`)
  - `utils/`: Prompts, formatters, context window, keyword extraction
  - `types/`: TypeScript interfaces
