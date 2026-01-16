/**
 * Hybrid Search Service
 * Combines semantic vector search with keyword-based retrieval for improved RAG accuracy
 */

import pineconeService, { Match } from './pinecone.service';
import { extractKeywords, calculateKeywordScore } from '../utils/keywords';
import feedbackService from './feedback.service';

export interface HybridSearchResult {
    id: string;
    semanticScore: number;
    keywordScore: number;
    feedbackScore: number;
    finalScore: number;
    metadata: Record<string, any>;
    appearsInBoth: boolean;
}

// Default weights
const DEFAULT_WEIGHTS = {
    alpha: 0.6, // Semantic
    beta: 0.3,  // Keyword
    gamma: 0.1  // Feedback
};

class HybridSearchService {
    private static instance: HybridSearchService;

    private constructor() { }

    public static getInstance(): HybridSearchService {
        if (!HybridSearchService.instance) {
            HybridSearchService.instance = new HybridSearchService();
        }
        return HybridSearchService.instance;
    }

    /**
     * Perform hybrid search combining semantic, keyword, and feedback signals
     */
    public async performHybridSearch(
        query: string,
        topK: number = 10,
        weights: { alpha: number; beta: number; gamma: number } = DEFAULT_WEIGHTS
    ): Promise<HybridSearchResult[]> {
        console.log(`[Hybrid] Starting search for: "${query.substring(0, 50)}..."`);

        // Extract keywords
        const keywords = extractKeywords(query);

        // Perform semantic search
        // Fetch more for re-ranking
        const [semanticMatches, highestSemanticScore] = await pineconeService.queryPinecone(query, topK * 3);

        // Fuse Semantic + Keyword first to get candidates
        let candidates = this.initialFusion(semanticMatches, keywords);

        // Fetch Feedback Scores for these candidates
        // Done in parallel for speed
        if (candidates.length > 0) {
            await Promise.all(candidates.map(async (c) => {
                try {
                    c.feedbackScore = await feedbackService.getDocumentGlobalScore(c.id);
                } catch (err) {
                    console.error(`[Hybrid] Error fetching feedback for doc ${c.id}:`, err);
                    c.feedbackScore = 0;
                }
            }));
        }

        // Calculate Final Score
        candidates.forEach(c => {
            // Normalized scores assumed to be 0..1
            // We can allow a small boost for 'appearsInBoth'
            const boost = c.appearsInBoth ? 0.05 : 0;

            c.finalScore = (weights.alpha * c.semanticScore) +
                (weights.beta * c.keywordScore) +
                (weights.gamma * c.feedbackScore) +
                boost;
        });

        // Sort by final score
        candidates.sort((a, b) => b.finalScore - a.finalScore);

        // Logging top result for debug
        if (candidates.length > 0) {
            const top = candidates[0];
            console.log(`[Hybrid] Top result: ${top.id} | Final: ${top.finalScore.toFixed(3)} (Sem: ${top.semanticScore.toFixed(2)}, Key: ${top.keywordScore.toFixed(2)}, Feed: ${top.feedbackScore.toFixed(2)})`);
        }

        return candidates.slice(0, topK);
    }

    /**
     * Initial fusion of Semantic + Keyword to build candidate objects
     */
    private initialFusion(
        semanticMatches: Match[],
        keywords: string[]
    ): HybridSearchResult[] {
        const results: HybridSearchResult[] = [];
        const seenIds = new Set<string>();

        for (const match of semanticMatches) {
            if (seenIds.has(match.id)) continue;
            seenIds.add(match.id);

            const metadata = match.metadata || {};
            const semanticScore = match.score;

            // Calculate keyword score
            const textContent = this.extractTextContent(metadata);
            const keywordScore = keywords.length > 0
                ? calculateKeywordScore(keywords, textContent)
                : 0;

            const appearsInBoth = keywordScore > 0.3;

            results.push({
                id: match.id,
                semanticScore,
                keywordScore,
                feedbackScore: 0, // Placeholder
                finalScore: 0,    // Placeholder
                metadata,
                appearsInBoth
            });
        }

        return results;
    }

    private extractTextContent(metadata: Record<string, any>): string {
        const parts: string[] = [];
        if (metadata.text) parts.push(metadata.text);
        if (metadata.title) parts.push(metadata.title);
        if (metadata.source) parts.push(metadata.source);
        if (metadata.tags && Array.isArray(metadata.tags)) {
            parts.push(metadata.tags.join(' '));
        }
        return parts.join(' ');
    }

    public getHighestScore(results: HybridSearchResult[]): number | null {
        if (results.length === 0) return null;
        return Math.max(...results.map(r => r.finalScore));
    }
}

export default HybridSearchService.getInstance();
