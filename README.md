# Neo - Mental Health AI Agent

A next-generation AI agent designed to provide intelligent, context-aware mental health support. **Neo** combines a stunning, high-performance frontend with a powerful Multi-Hop RAG backend to deliver accurate and empathetic responses.

![Neo Banner](https://placehold.co/1200x400/101010/ffffff?text=Neo+Mental+Health+AI)

## ✨ Key Features

- **🧠 Multi-Hop RAG System**: Decomposes complex user queries into sub-questions, iteratively retrieving context to build a complete answer.
- **⚡ Real-time Streaming**: Utilizes Server-Sent Events (SSE) for instant, typewriter-style responses.
- **🔍 Hybrid Search**: Merges semantic vector search (Pinecone) with keyword-based filtering for high-precision retrieval.
- **🔄 Rolling Context Window**: Maintains conversation history (approx. 6-8 messages) for coherent multi-turn dialogues.
- **🎨 Immersive UI**: Built with **React 19**, **Vite**, and **Tailwind CSS**, featuring 3D elements (**Spline**) and smooth animations (**Framer Motion**).
- **📝 Feedback Loop**: Integrated SQLite feedback system to continuously improve response quality based on user interactions.
- **🔒 Local Embeddings**: Uses `@xenova/transformers` for privacy-first, on-device embedding generation (bge-m3).

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + clsx + tailwind-merge
- **Animations**: Framer Motion
- **3D Graphics**: @splinetool/react-spline
- **Routing**: React Router DOM 7

### Backend (Active)
- **Runtime**: Node.js (Express)
- **Language**: TypeScript
- **Vector DB**: Pinecone
- **LLM**: OpenAI / Custom LLM Integration
- **Database**: SQLite (for feedback & metrics)
- **Embeddings**: Local ONNX models via Xenova

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20+ recommended
- **Pinecone**: API Key and Index
- **OpenAI API Key**: (Or compatible LLM key)

### Installation

Clone the repository:
```bash
git clone https://github.com/Yashuuuu02/neo.git
cd neo
```

#### 1. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
The app will open at `http://localhost:5173`.

#### 2. Backend Setup
Navigate to the active backend directory:
```bash
cd backend-node

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# (Populate PORT, PINECONE_API_KEY, OPENAI_API_KEY, etc.)

# Start server
npm run dev
```
The backend runs on `http://localhost:3000`.

## 📂 Project Structure

- **`src/`**: Modern React Frontend source code.
- **`backend-node/`**: **(ACTIVE)** Main Node.js/Express backend service.
- **`backend/`**: *(Legacy)* Python FastAPI backend implementation.
- **`rag_feedback.db`**: Local SQLite database for storing user feedback.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements.

## 📄 License

This project is licensed under the MIT License.
