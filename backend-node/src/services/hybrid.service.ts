/**
 * Hybrid Search Service
 * Combines semantic vector search with keyword-based retrieval for improved RAG accuracy
 */

import pineconeService, { Match } from './pinecone.service';
import { extractKeywords, calculateKeywordScore } from '../utils/keywords';

export interface HybridSearchResult {
    id: string;
    semanticScore: number;
    keywordScore: number;
    finalScore: number;
    metadata: Record<string, any>;
    appearsInBoth: boolean;
}

// Weighting constants for score fusion
const SEMANTIC_WEIGHT = 0.65;
const KEYWORD_WEIGHT = 0.35;

// Boost for results appearing in both semantic and keyword searches
const BOTH_MATCH_BOOST = 0.1;

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
     * Perform hybrid search combining semantic and keyword-based retrieval
     * @param query - User query string
     * @param topK - Number of results to return
     * @returns Sorted array of hybrid search results
     */
    public async performHybridSearch(
        query: string,
        topK: number = 10
    ): Promise<HybridSearchResult[]> {
        console.log(`[Hybrid] Starting hybrid search for: "${query.substring(0, 50)}..."`);

        // Extract keywords from query
        const keywords = extractKeywords(query);
        console.log(`[Hybrid] Extracted keywords: [${keywords.join(', ')}]`);

        // Perform semantic search via Pinecone
        const [semanticMatches, highestSemanticScore] = await pineconeService.queryPinecone(query, topK * 2);
        console.log(`[Hybrid] Semantic search returned ${semanticMatches.length} results (highest: ${highestSemanticScore?.toFixed(3)})`);

        // Calculate keyword scores for all semantic matches
        const results = this.fuseResults(semanticMatches, keywords);

        // Sort by final score descending
        results.sort((a, b) => b.finalScore - a.finalScore);

        // Return top K
        const topResults = results.slice(0, topK);

        console.log(`[Hybrid] Final results: ${topResults.length} (top score: ${topResults[0]?.finalScore?.toFixed(3)})`);
        if (topResults.length > 0) {
            console.log(`[Hybrid] Top 3 results:`, topResults.slice(0, 3).map(r => ({
                id: r.id,
                semantic: r.semanticScore.toFixed(3),
                keyword: r.keywordScore.toFixed(3),
                final: r.finalScore.toFixed(3)
            })));
        }

        return topResults;
    }

    /**
     * Fuse semantic matches with keyword scores
     */
    private fuseResults(
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

            // Calculate keyword score from text content
            const textContent = this.extractTextContent(metadata);
            const keywordScore = keywords.length > 0
                ? calculateKeywordScore(keywords, textContent)
                : 0;

            // Determine if this result has strong keyword matches
            const appearsInBoth = keywordScore > 0.3;

            // Calculate final fusion score
            let finalScore = (SEMANTIC_WEIGHT * semanticScore) + (KEYWORD_WEIGHT * keywordScore);

            // Boost if appears in both semantic and keyword results
            if (appearsInBoth) {
                finalScore = Math.min(1, finalScore + BOTH_MATCH_BOOST);
            }

            results.push({
                id: match.id,
                semanticScore,
                keywordScore,
                finalScore,
                metadata,
                appearsInBoth
            });
        }

        return results;
    }

    /**
     * Extract all text content from metadata for keyword matching
     */
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

    /**
     * Get the highest score from hybrid results
     */
    public getHighestScore(results: HybridSearchResult[]): number | null {
        if (results.length === 0) return null;
        return Math.max(...results.map(r => r.finalScore));
    }
}

export default HybridSearchService.getInstance();
