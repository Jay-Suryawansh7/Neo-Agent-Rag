import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chatHelper.routes';
import embeddingService from './services/embedding.service';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', chatRouter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Async startup to preload models
(async () => {
    console.log('[Startup] Preloading embedding model...');
    const startTime = Date.now();
    await embeddingService.init();
    console.log(`[Startup] Embedding model loaded in ${Date.now() - startTime}ms`);

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
})();
