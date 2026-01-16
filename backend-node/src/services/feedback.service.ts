import { v4 as uuidv4 } from 'uuid';
import { run, get, all } from '../utils/db';
import embeddingService from './embedding.service';
import pineconeService from './pinecone.service';

export interface DocFeedback {
    documentId: string;
    score: number;
}

class FeedbackService {
    private static instance: FeedbackService;

    private constructor() { }

    public static getInstance(): FeedbackService {
        if (!FeedbackService.instance) {
            FeedbackService.instance = new FeedbackService();
        }
        return FeedbackService.instance;
    }

    // --- Logging Methods ---

    public async logQuery(queryId: string, text: string): Promise<void> {
        await run('INSERT INTO queries (id, text, timestamp) VALUES (?, ?, ?)', [
            queryId,
            text,
            Date.now()
        ]);
    }

    public async logHop(hopId: string, queryId: string, hopOrder: number, subQuery: string, reasoning: string = ''): Promise<void> {
        await run('INSERT INTO hops (id, query_id, hop_order, sub_query, reasoning, status) VALUES (?, ?, ?, ?, ?, ?)', [
            hopId,
            queryId,
            hopOrder,
            subQuery,
            reasoning,
            'pending'
        ]);
    }

    public async logHopDocument(hopId: string, documentId: string, denseScore: number, sparseScore: number, rank: number): Promise<void> {
        await run('INSERT INTO hop_documents (id, hop_id, document_id, dense_score, sparse_score, rank_position) VALUES (?, ?, ?, ?, ?, ?)', [
            uuidv4(),
            hopId,
            documentId,
            denseScore,
            sparseScore,
            rank
        ]);
    }

    public async logResponse(responseId: string, queryId: string, content: string): Promise<void> {
        await run('INSERT INTO responses (id, query_id, content, timestamp) VALUES (?, ?, ?, ?)', [
            responseId,
            queryId,
            content,
            Date.now()
        ]);
    }

    public async logEvidenceChain(responseId: string, hopIds: string[], documentIds: string[], confidence: number): Promise<void> {
        await run('INSERT INTO evidence_chains (id, response_id, hop_ids, document_ids, confidence_score) VALUES (?, ?, ?, ?, ?)', [
            uuidv4(),
            responseId,
            JSON.stringify(hopIds),
            JSON.stringify(documentIds),
            confidence
        ]);
    }

    // --- Learning & Feedback ---

    /**
     * Get the effective feedback score for a document, applying time decay.
     * Score = tanh(total_raw_score / 10) * e^(-lambda * age_days)
     */
    public async getDocumentGlobalScore(documentId: string): Promise<number> {
        // Global Score linked to Document ID across all queries
        const result = await get(`
            SELECT 
                SUM(CASE WHEN r.user_feedback = 1 THEN 1 WHEN r.user_feedback = -1 THEN -1 ELSE 0 END) as raw_score,
                MAX(r.timestamp) as last_feedback_time
            FROM responses r
            JOIN queries q ON r.query_id = q.id
            JOIN hops h ON h.query_id = q.id
            JOIN hop_documents hd ON hd.hop_id = h.id
            WHERE hd.document_id = ? AND r.user_feedback != 0
        `, [documentId]);

        if (!result || result.raw_score === null) return 0;

        const rawScore = result.raw_score;
        const lastTime = result.last_feedback_time || Date.now();

        // Tanh normalization
        const normalized = Math.tanh(rawScore / 10.0);

        // Time Decay
        const daysSince = (Date.now() - lastTime) / (1000 * 60 * 60 * 24);
        const lambda = 0.1; // Decay rate
        const effectiveScore = normalized * Math.exp(-lambda * daysSince);

        return effectiveScore;
    }

    /**
     * Submit user feedback for a response
     */
    public async submitFeedback(responseId: string, feedback: number, correction?: string): Promise<void> {
        await run('UPDATE responses SET user_feedback = ?, user_correction = ? WHERE id = ?', [
            feedback,
            correction || null,
            responseId
        ]);

        // If negative feedback, perform Failure Analysis
        if (feedback === -1) {
            await this.handleNegativeFeedback(responseId);
        }

        // If correction provided, inject into RAG memory
        if (correction && correction.trim().length > 5) {
            await this.injectCorrection(correction);
        }
    }

    private async injectCorrection(text: string): Promise<void> {
        try {
            console.log(`[Feedback] Injecting correction: "${text}"`);
            const embedding = await embeddingService.generateEmbedding(text);
            const id = `correction-${uuidv4()}`;

            await pineconeService.upsert([{
                id,
                values: embedding,
                metadata: {
                    text,
                    type: 'correction',
                    timestamp: Date.now(),
                    source: 'user_feedback'
                }
            }]);
            console.log(`[Feedback] Correction upserted to Pinecone: ${id}`);
        } catch (e) {
            console.error("[Feedback] Failed to inject correction:", e);
        }
    }

    private async handleNegativeFeedback(responseId: string) {
        // Find the evidence chain
        const chain = await get('SELECT * FROM evidence_chains WHERE response_id = ?', [responseId]);
        if (!chain) return;

        const hopIds: string[] = JSON.parse(chain.hop_ids);

        // Heuristic: Find the "Weakest Link"
        // For each hop, calculate average document score (dense + sparse)
        let worstHopId = null;
        let minScore = 2.0;

        for (const hopId of hopIds) {
            const docs = await all('SELECT dense_score, sparse_score FROM hop_documents WHERE hop_id = ?', [hopId]);
            if (docs.length === 0) continue;

            const avgScore = docs.reduce((sum, d) => sum + d.dense_score + d.sparse_score, 0) / docs.length; // Max ~2.0
            if (avgScore < minScore) {
                minScore = avgScore;
                worstHopId = hopId;
            }
        }

        if (worstHopId) {
            await run("UPDATE hops SET status = 'failed' WHERE id = ?", [worstHopId]);
            console.log(`[Feedback] Marked hop ${worstHopId} as FAILED based on feedback.`);
        }
    }

    /**
     * One-Shot Learning: Retrieve a successful hop breakdown for a similar query.
     */
    public async getSuccessfulTemplate(queryText: string): Promise<any[]> {
        const row = await get(`
            SELECT h.hop_order, h.sub_query, h.reasoning
            FROM queries q
            JOIN responses r ON r.query_id = q.id
            JOIN hops h ON h.query_id = q.id
            WHERE q.text = ? AND r.user_feedback = 1
            ORDER BY h.hop_order ASC
        `, [queryText]);

        if (row) {
            const rows = await all(`
                SELECT h.hop_order, h.sub_query, h.reasoning
                FROM queries q
                JOIN responses r ON r.query_id = q.id
                JOIN hops h ON h.query_id = q.id
                WHERE q.text = ? AND r.user_feedback = 1
                ORDER BY h.hop_order ASC
             `, [queryText]);
            return rows;
        }
        return [];
    }
}

export default FeedbackService.getInstance();
