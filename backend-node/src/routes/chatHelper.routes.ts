import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ChatRequest, ChatResponse } from '../types/chat';
import { detectMode, shouldUseRag, getContextFromMatches } from '../services/rag.service';
import pineconeService from '../services/pinecone.service';
import llmService from '../services/llm.service';
import {
    parseLlmJsonResponse,
    createFallbackResponse,
    createErrorResponse,
    formatSources,
} from '../utils/formatter';
// Helper to get prompts
import { getGeneralPrompt, getRagPrompt } from '../utils/prompts';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
    const { message } = req.body as ChatRequest;
    const requestId = uuidv4().substring(0, 8);

    console.log(`[${requestId}] Incoming request: ${message.substring(0, 50)}...`);

    try {
        // Step 1: Detect intent/mode
        const mode = detectMode(message);
        console.log(`[${requestId}] Detected mode: ${mode}`);

        // Step 2: Handle general mode
        if (mode === 'general') {
            const systemPrompt = getGeneralPrompt();
            const llmResponse = await llmService.callLlm(systemPrompt, message);
            console.log(`[${requestId}] LLM Response (General): ${llmResponse.substring(0, 100)}...`);

            const blocks = parseLlmJsonResponse(llmResponse);

            const response: ChatResponse = {
                blocks,
                sources: [],
                mode: 'general',
                request_id: requestId,
            };
            res.json(response);
            return;
        }

        // Step 3: RAG candidate - query Pinecone
        const [matches, highestScore] = await pineconeService.queryPinecone(message);
        console.log(`[${requestId}] Pinecone Stats: Matches=${matches.length}, HighScore=${highestScore}`);

        // Step 4: Decide if RAG should be used
        const threshold = parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.5'); // Default 0.5
        const useRag = shouldUseRag(mode, highestScore, threshold);

        if (!useRag) {
            console.log(`[${requestId}] RAG rejected (Score below threshold)`);
            res.json(createFallbackResponse());
            return;
        }

        // Step 5: Extract context
        const [context, rawSources] = getContextFromMatches(matches, threshold);
        console.log(`[${requestId}] Context Length: ${context.length}`);

        if (!context.trim()) {
            console.log(`[${requestId}] Empty context after filtering`);
            res.json(createFallbackResponse());
            return;
        }

        // Generate grounded response
        const systemPrompt = getRagPrompt(context);
        const llmResponse = await llmService.callLlm(systemPrompt, message);
        console.log(`[${requestId}] LLM Response (RAG): ${llmResponse.substring(0, 100)}...`);

        const blocks = parseLlmJsonResponse(llmResponse);
        const sources = formatSources(rawSources);

        const response: ChatResponse = {
            blocks,
            sources,
            mode: 'rag',
            request_id: requestId,
        };

        res.json(response);

    } catch (error: any) {
        console.error(`[${requestId}] Chat API error:`, error);
        res.status(500).json(createErrorResponse(error.message, requestId));
    }
});

export default router;
