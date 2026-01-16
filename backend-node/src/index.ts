import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chatHelper.routes';
import feedbackRouter from './routes/feedback.routes';
import embeddingService from './services/embedding.service';
import { simpleFetch, Headers, Request, Response } from './utils/simpleFetch';
import { initDb } from './utils/db'; // Initialize DB

dotenv.config();

// Initialize DB
initDb();

// Polyfill global fetch to fix DNS issues with Pinecone (Selective)
const originalFetch = global.fetch;
// @ts-ignore
global.fetch = async (url: string | any, init: any) => {
    const urlStr = (url && url.url) ? url.url : String(url);
    if (urlStr.includes('pinecone.io')) {
        // console.log(`[FetchPolyfill] Intercepting Pinecone request: ${urlStr}`);
        return simpleFetch(url, init);
    }
    // Fallback to native fetch for everything else (OpenAI, etc.)
    return originalFetch(url, init);
};

// @ts-ignore
global.Headers = Headers;
// @ts-ignore
global.Request = Request;
// @ts-ignore
global.Response = Response;

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', chatRouter);
app.use('/api', feedbackRouter);



app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Async startup to preload models
(async () => {
    try {
        console.log('[Startup] Preloading embedding model...');
        const startTime = Date.now();
        await embeddingService.init();
        console.log(`[Startup] Embedding model loaded in ${Date.now() - startTime}ms`);

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (err) {
        console.error('[Startup] Critical error:', err);
        process.exit(1);
    }
})();
