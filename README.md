# Chatbot Spline - Neo Agent

A modern chatbot application featuring a **React + TypeScript + Vite** frontend and a dual-backend architecture (Node.js active, Python legacy).

## Project Structure

This repository contains the following main components:

- **`src/`**: The Frontend application built with React, TypeScript, and Vite.
- **`backend-node/`**: The **Active** Backend implementation using Node.js, Express, and Pinecone.
- **`backend/`**: The **Legacy** Backend implementation using Python (FastAPI).

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Frontend Setup
1. Navigate to the root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will run at `http://localhost:5173` (or similar).

### Backend Setup
Please refer to the specific README files for each backend:

- [Node.js Backend Documentation](./backend-node/README.md) (Recommended)
- [Python Backend Documentation](./backend/README.md) (Legacy)

## Development

This project uses **Vite** for the frontend build tooling.

- `npm run build`: Build the frontend for production.
- `npm run lint`: Run ESLint checks.
- `npm run preview`: Preview the production build locally.

## License

Private Repository.
