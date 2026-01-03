import { Match } from './pinecone.service';

const STRONG_TRIGGERS = new Set<string>([
    'cogneoverse',
    'neo',
    'orion',
]);

const WEAK_TRIGGERS = new Set<string>([
    'internal',
    'architecture',
    'system',
    'project',
    'documentation',
    'docs',
]);

export function detectMode(message: string): 'general' | 'rag_strong' | 'rag_weak' {
    const messageLower = message.toLowerCase();

    for (const trigger of STRONG_TRIGGERS) {
        if (messageLower.includes(trigger)) {
            return 'rag_strong';
        }
    }

    for (const trigger of WEAK_TRIGGERS) {
        if (messageLower.includes(trigger)) {
            return 'rag_weak';
        }
    }

    return 'general';
}

export function shouldUseRag(
    mode: string,
    pineconeScore: number | null,
    threshold: number
): boolean {
    if (mode === 'general') return false;

    if (mode === 'rag_strong') {
        return pineconeScore !== null && pineconeScore >= threshold;
    }

    if (mode === 'rag_weak') {
        return pineconeScore !== null && pineconeScore >= threshold;
    }

    return false;
}

export function getContextFromMatches(matches: Match[], threshold: number): [string, any[]] {
    const contextParts: string[] = [];
    const sources: any[] = [];

    for (const match of matches) {
        if (match.score < threshold) continue;

        const metadata = match.metadata || {};
        const text = metadata.text;

        if (text) {
            contextParts.push(text);
            sources.push({
                title: metadata.title || 'Unknown',
                source: metadata.source || 'Unknown',
                score: Number(match.score.toFixed(3)),
            });
        }
    }

    const context = contextParts.join('\n\n---\n\n');
    return [context, sources];
}
