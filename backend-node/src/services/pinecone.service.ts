
import { Pinecone } from '@pinecone-database/pinecone';
import embeddingService from './embedding.service';

export interface Match {
    id: string;
    score: number;
    metadata?: Record<string, any>;
}

class PineconeService {
    private static instance: PineconeService;
    private pc: Pinecone | null = null;
    private indexName: string = '';

    private constructor() { }

    public static getInstance(): PineconeService {
        if (!PineconeService.instance) {
            PineconeService.instance = new PineconeService();
        }
        return PineconeService.instance;
    }

    public init() {
        const apiKey = process.env.PINECONE_API_KEY;
        this.indexName = process.env.PINECONE_INDEX || '';

        if (!apiKey) {
            console.warn('Pinecone API Key is missing!');
            return;
        }

        this.pc = new Pinecone({ apiKey });
    }

    public async queryPinecone(query: string, topK: number = 5): Promise<[Match[], number | null]> {
        if (!this.pc) this.init();

        if (!this.pc || !this.indexName) {
            console.error("Pinecone not initialized");
            return [[], null];
        }

        try {
            const index = this.pc.index(this.indexName);

            const queryEmbedding = await embeddingService.generateEmbedding(query);

            const queryResponse = await index.query({
                vector: queryEmbedding,
                topK: topK,
                includeMetadata: true,
            });

            const matches = queryResponse.matches.map(m => ({
                id: m.id,
                score: m.score || 0,
                metadata: m.metadata
            }));

            if (matches.length === 0) {
                return [[], null];
            }

            const highestScore = Math.max(...matches.map(m => m.score));

            return [matches, highestScore];

        } catch (error) {
            console.error('Error querying Pinecone:', error);
            return [[], null];
        }
    }
}

export default PineconeService.getInstance();
