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
// Context window utilities
import { getContextWindow, appendToContextWindow } from '../utils/contextWindow';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
    const { message, conversation_id } = req.body as ChatRequest;
    const requestId = uuidv4().substring(0, 8);
    // Use provided conversation_id or generate one
    const convId = conversation_id || requestId;

    console.log(`[${requestId}] Incoming request: ${message.substring(0, 50)}...`);

    try {
        // Retrieve conversation context for continuity
        const conversationHistory = getContextWindow(convId);

        // Step 1: Detect intent/mode
        const mode = detectMode(message);
        console.log(`[${requestId}] Detected mode: ${mode}`);

        // Step 2: Handle general mode
        if (mode === 'general') {
            const systemPrompt = getGeneralPrompt();
            const llmResponse = await llmService.callLlm(systemPrompt, message, conversationHistory);
            console.log(`[${requestId}] LLM Response (General): ${llmResponse.substring(0, 100)}...`);

            const blocks = parseLlmJsonResponse(llmResponse);

            // Append to context window after success
            appendToContextWindow(convId, 'user', message);
            appendToContextWindow(convId, 'assistant', llmResponse);

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

        // Generate grounded response (RAG context is authoritative, conversation history is for continuity)
        const systemPrompt = getRagPrompt(context);
        const llmResponse = await llmService.callLlm(systemPrompt, message, conversationHistory);
        console.log(`[${requestId}] LLM Response (RAG): ${llmResponse.substring(0, 100)}...`);

        const blocks = parseLlmJsonResponse(llmResponse);
        const sources = formatSources(rawSources);

        // Append to context window after success
        appendToContextWindow(convId, 'user', message);
        appendToContextWindow(convId, 'assistant', llmResponse);

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

/**
 * Streaming chat endpoint using Server-Sent Events (SSE)
 * Delivers LLM response progressively for faster perceived latency
 */
router.post('/chat/stream', async (req: Request, res: Response) => {
    const { message, conversation_id } = req.body as ChatRequest;
    const requestId = uuidv4().substring(0, 8);
    const convId = conversation_id || requestId;

    console.log(`[${requestId}] [STREAM] Incoming request: ${message.substring(0, 50)}...`);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    try {
        const conversationHistory = getContextWindow(convId);
        const mode = detectMode(message);
        console.log(`[${requestId}] [STREAM] Detected mode: ${mode}`);

        let systemPrompt: string;
        let sources: any[] = [];
        let responseMode = 'general';

        if (mode === 'general') {
            systemPrompt = getGeneralPrompt();
        } else {
            // RAG path
            const [matches, highestScore] = await pineconeService.queryPinecone(message);
            const threshold = parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.5');
            const useRag = shouldUseRag(mode, highestScore, threshold);

            if (!useRag) {
                // Send fallback as single chunk
                const fallback = createFallbackResponse();
                res.write(`data: ${JSON.stringify({ type: 'content', data: JSON.stringify(fallback) })}\n\n`);
                res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
                res.end();
                return;
            }

            const [context, rawSources] = getContextFromMatches(matches, threshold);
            if (!context.trim()) {
                const fallback = createFallbackResponse();
                res.write(`data: ${JSON.stringify({ type: 'content', data: JSON.stringify(fallback) })}\n\n`);
                res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
                res.end();
                return;
            }

            systemPrompt = getRagPrompt(context);
            sources = formatSources(rawSources);
            responseMode = 'rag';
        }

        // Send metadata first
        res.write(`data: ${JSON.stringify({ type: 'meta', mode: responseMode, sources, request_id: requestId })}\n\n`);

        // Stream the LLM response
        let fullContent = '';
        const stream = llmService.callLlmStream(systemPrompt, message, conversationHistory);

        for await (const chunk of stream) {
            fullContent += chunk;
            res.write(`data: ${JSON.stringify({ type: 'chunk', data: chunk })}\n\n`);
        }

        // Append to context window
        appendToContextWindow(convId, 'user', message);
        appendToContextWindow(convId, 'assistant', fullContent);

        // Send done signal
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();

        console.log(`[${requestId}] [STREAM] Complete (${fullContent.length} chars)`);

    } catch (error: any) {
        console.error(`[${requestId}] [STREAM] Error:`, error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
});

export default router;

