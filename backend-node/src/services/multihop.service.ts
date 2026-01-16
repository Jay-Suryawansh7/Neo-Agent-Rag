import { v4 as uuidv4 } from 'uuid';
import hybridService, { HybridSearchResult } from './hybrid.service';
import llmService from './llm.service';
import feedbackService from './feedback.service';
import { getQueryDecompositionPrompt } from '../utils/prompts';
import { getContextFromHybridResults } from './rag.service';

interface MultiHopResult {
    results: HybridSearchResult[];
    hops: number;
    generatedQueries: string[];
    queryId: string;
    hopIds: string[];
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
     * Perform multi-hop search with specific attention to feedback history
     */
    public async performMultiHopSearch(
        originalQuery: string,
        maxHops: number = 1
    ): Promise<MultiHopResult> {
        const queryId = uuidv4();
        console.log(`[MultiHop] Starting search for: "${originalQuery}" (ID: ${queryId})`);

        // Log Query Start
        await feedbackService.logQuery(queryId, originalQuery);

        const hopIds: string[] = [];
        const seenIds = new Set<string>();
        let allResults: HybridSearchResult[] = [];
        const generatedQueries: string[] = [];

        // 0. Check for Successful Template (One-Shot Learning)
        const successfulTemplate = await feedbackService.getSuccessfulTemplate(originalQuery);

        if (successfulTemplate.length > 0) {
            console.log(`[MultiHop] 🟢 Found successful template with ${successfulTemplate.length} hops. Replaying...`);

            for (const step of successfulTemplate) {
                const hopId = uuidv4();
                hopIds.push(hopId);
                await feedbackService.logHop(hopId, queryId, step.hop_order, step.sub_query, "Replay from history");

                // Execute Search
                const subResults = await hybridService.performHybridSearch(step.sub_query, 5);
                generatedQueries.push(step.sub_query);

                // Log Docs & Aggregate
                let rank = 1;
                for (const res of subResults) {
                    await feedbackService.logHopDocument(hopId, res.id, res.semanticScore, res.keywordScore, rank++);
                    if (!seenIds.has(res.id)) {
                        seenIds.add(res.id);
                        allResults.push(res);
                    }
                }
            }
            // Logic ends here for template replay? Or do we proceed to check sufficiency?
            // For now, let's assume template sufficiency is high.
            allResults.sort((a, b) => b.finalScore - a.finalScore);
            return {
                results: allResults,
                hops: successfulTemplate.length,
                generatedQueries,
                queryId,
                hopIds
            };
        }

        // --- Standard Decompostion Loop ---

        // 1. Initial Search (Hop 0)
        const initialHopId = uuidv4();
        hopIds.push(initialHopId);
        await feedbackService.logHop(initialHopId, queryId, 0, originalQuery, "Initial Query");

        let currentResults = await hybridService.performHybridSearch(originalQuery, 10);

        let rank = 1;
        for (const res of currentResults) {
            await feedbackService.logHopDocument(initialHopId, res.id, res.semanticScore, res.keywordScore, rank++);
            if (!seenIds.has(res.id)) {
                seenIds.add(res.id);
                allResults.push(res);
            }
        }

        let currentHop = 0;

        while (currentHop < maxHops) {
            // Prepare context
            const [currentContext] = getContextFromHybridResults(allResults, 0.4);

            console.log(`[MultiHop] Hop ${currentHop + 1}/${maxHops}: Evaluating sufficiency...`);

            // 2. Ask LLM
            const decompositionPrompt = getQueryDecompositionPrompt(currentContext || "No context found yet.", originalQuery);
            try {
                const analysisRaw = await llmService.callLlm(decompositionPrompt, "Analyze sufficiency.", []);

                let analysis: { sufficient: boolean; queries: string[] };
                try {
                    const cleanJson = analysisRaw.replace(/```json/g, '').replace(/```/g, '').trim();
                    analysis = JSON.parse(cleanJson);
                } catch (e) {
                    console.error("[MultiHop] Failed to parse JSON", e);
                    break;
                }

                if (analysis.sufficient) {
                    console.log("[MultiHop] ✅ Context sufficient.");
                    break;
                }

                if (!analysis.queries || analysis.queries.length === 0) {
                    break;
                }

                console.log(`[MultiHop] Hop ${currentHop + 1}: Generated queries:`, analysis.queries);
                generatedQueries.push(...analysis.queries);

                // 3. Execute new queries
                for (const subQuery of analysis.queries) {
                    const hopId = uuidv4();
                    hopIds.push(hopId);
                    // Use a simple increment for hop order, or track rigorously
                    await feedbackService.logHop(hopId, queryId, currentHop + 1, subQuery, "LLM Generated");

                    const subResults = await hybridService.performHybridSearch(subQuery, 5);

                    let subRank = 1;
                    for (const res of subResults) {
                        await feedbackService.logHopDocument(hopId, res.id, res.semanticScore, res.keywordScore, subRank++);
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

        allResults.sort((a, b) => b.finalScore - a.finalScore);

        return {
            results: allResults,
            hops: currentHop,
            generatedQueries,
            queryId,
            hopIds
        };
    }
}

export default MultiHopService.getInstance();
