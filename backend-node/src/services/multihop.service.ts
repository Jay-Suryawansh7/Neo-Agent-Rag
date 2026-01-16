import hybridService, { HybridSearchResult } from './hybrid.service';
import llmService from './llm.service';
import { getQueryDecompositionPrompt } from '../utils/prompts';
import { getContextFromHybridResults } from './rag.service';

interface MultiHopResult {
    results: HybridSearchResult[];
    hops: number;
    generatedQueries: string[];
}

class MultiHopService {
    private static instance: MultiHopService;

    private constructor() { }

    public static getInstance(): MultiHopService {
        if (!MultiHopService.instance) {
            MultiHopService.instance = new MultiHopService();
        }
        return MultiHopService.instance;
    }

    /**
     * Perform multi-hop search to gather comprehensive context
     */
    public async performMultiHopSearch(
        originalQuery: string,
        maxHops: number = 1 // Default to 1 extra hop for now to control latency
    ): Promise<MultiHopResult> {
        console.log(`[MultiHop] Starting search for: "${originalQuery}"`);

        // 1. Initial Search
        let allResults = await hybridService.performHybridSearch(originalQuery, 10);
        const seenIds = new Set<string>(allResults.map(r => r.id));
        const generatedQueries: string[] = [];

        // If no results found initially, might be worth trying a rephrased query? 
        // For now, if 0 results, multi-hop might struggle too, but let's see.

        let currentHop = 0;

        while (currentHop < maxHops) {
            // Prepare context for the LLM to evaluate
            const [currentContext] = getContextFromHybridResults(allResults, 0.4); // slightly lower threshold for context visibility

            // 2. Ask LLM if we need more info
            const decompositionPrompt = getQueryDecompositionPrompt(currentContext || "No context found yet.", originalQuery);
            try {
                // We use a separate LLM call here. Ideally should be fast (e.g. gpt-3.5-turbo or a smaller model)
                const analysisRaw = await llmService.callLlm(decompositionPrompt, "Analyze sufficiency.", []);

                // Parse JSON
                let analysis: { sufficient: boolean; queries: string[] };
                try {
                    // unexpected formatting handling (sometimes LLMs add markdown blocks)
                    const cleanJson = analysisRaw.replace(/```json/g, '').replace(/```/g, '').trim();
                    analysis = JSON.parse(cleanJson);
                } catch (e) {
                    console.error("[MultiHop] Failed to parse decomposition JSON", e);
                    break; // Stop if we can't parse
                }

                if (analysis.sufficient) {
                    console.log("[MultiHop] Context deemed sufficient. Stopping hops.");
                    break;
                }

                if (!analysis.queries || analysis.queries.length === 0) {
                    console.log("[MultiHop] No new queries generated. Stopping.");
                    break;
                }

                console.log(`[MultiHop] Hop ${currentHop + 1}: Generated queries:`, analysis.queries);
                generatedQueries.push(...analysis.queries);

                // 3. Execute new queries
                for (const subQuery of analysis.queries) {
                    // Limit sub-query results to keep context manageable
                    const subResults = await hybridService.performHybridSearch(subQuery, 5);

                    for (const res of subResults) {
                        if (!seenIds.has(res.id)) {
                            seenIds.add(res.id);
                            allResults.push(res);
                        }
                    }
                }

                currentHop++;

            } catch (err) {
                console.error("[MultiHop] Error during hop evaluation:", err);
                break;
            }
        }

        // Re-rank or sort combined results?
        // For now, hybridService results are already scored. 
        // We might want to re-sort the combined list by finalScore
        allResults.sort((a, b) => b.finalScore - a.finalScore);

        return {
            results: allResults,
            hops: currentHop,
            generatedQueries
        };
    }
}

export default MultiHopService.getInstance();
