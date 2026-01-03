import { Block, ChatResponse, Source } from '../types/chat';

export function parseLlmJsonResponse(llmOutput: string): Block[] {
    let cleaned = llmOutput.trim();

    // Remove markdown code block wrapper if present
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    cleaned = cleaned.trim();

    try {
        const data = JSON.parse(cleaned);

        // Guard against non-dict JSON
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            return [{ type: 'paragraph', content: llmOutput }];
        }

        const blocksData = data.blocks;
        if (!blocksData || !Array.isArray(blocksData)) {
            return [{ type: 'paragraph', content: llmOutput }];
        }

        return blocksData.map((b: any) => ({
            type: b.type || 'paragraph',
            content: b.content,
            items: b.items,
            language: b.language,
        }));
    } catch (e) {
        // Fallback: wrap raw text as paragraph
        return [{ type: 'paragraph', content: llmOutput }];
    }
}

export function createFallbackResponse(): ChatResponse {
    return {
        blocks: [
            {
                type: 'paragraph',
                content:
                    "I don't have that information in Cogneoverse knowledge. Try asking about general topics, or rephrase your question about our internal projects.",
            },
        ],
        sources: [],
        mode: 'rag',
        request_id: '',
    };
}

export function createErrorResponse(errorMessage: string, requestId: string): ChatResponse {
    return {
        blocks: [
            {
                type: 'paragraph',
                content: `I encountered an issue processing your request. Please try again. (${errorMessage})`,
            },
        ],
        sources: [],
        mode: 'general',
        request_id: requestId,
    };
}

export function formatSources(rawSources: any[]): Source[] {
    return rawSources.map((s) => ({
        title: s.title || 'Unknown',
        source: s.source || 'Unknown',
        score: s.score || 0,
    }));
}
