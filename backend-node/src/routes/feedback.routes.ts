import { Router, Request, Response } from 'express';
import feedbackService from '../services/feedback.service';
import { all } from '../utils/db'; // Direct DB access for metrics

const router = Router();

// Submit Feedback
router.post('/feedback', async (req: Request, res: Response) => {
    try {
        const { response_id, feedback, correction } = req.body;

        if (!response_id || feedback === undefined) {
            res.status(400).json({ error: 'Missing response_id or feedback value' });
            return;
        }

        await feedbackService.submitFeedback(response_id, feedback, correction);
        res.json({ status: 'success', message: 'Feedback received' });

    } catch (error: any) {
        console.error('Error processing feedback:', error);
        res.status(500).json({ error: error.message });
    }
});

// Debug Metrics
router.get('/debug/metrics', async (req: Request, res: Response) => {
    try {
        // Response Success Rate (Positive vs Total with Feedback)
        const feedbackStats = await all(`
            SELECT 
                SUM(CASE WHEN user_feedback = 1 THEN 1 ELSE 0 END) as positive,
                SUM(CASE WHEN user_feedback = -1 THEN 1 ELSE 0 END) as negative,
                COUNT(*) as total
            FROM responses 
            WHERE user_feedback != 0
        `);

        // Hop Failure Distribution
        const hopFailures = await all(`
            SELECT sub_query, COUNT(*) as failures
            FROM hops 
            WHERE status = 'failed' 
            GROUP BY sub_query 
            ORDER BY failures DESC 
            LIMIT 5
        `);

        // Top Penalized Documents (Simulated by checking low scores if we stored them, or just feedback counts)
        // Here we just check docs with negative feedback association
        const penalizedDocs = await all(`
            SELECT hd.document_id, COUNT(*) as neg_count
            FROM hop_documents hd
            JOIN hops h ON h.id = hd.hop_id
            JOIN queries q ON q.id = h.query_id
            JOIN responses r ON r.query_id = q.id
            WHERE r.user_feedback = -1
            GROUP BY hd.document_id
            ORDER BY neg_count DESC
            LIMIT 5
        `);

        res.json({
            responseSuccessRate: feedbackStats[0],
            hopFailures,
            penalizedDocs
        });

    } catch (error: any) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
