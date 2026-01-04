import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';
import { LRUCache } from '../utils/cache';

class EmbeddingService {
    private static instance: EmbeddingService;
    private pipe: FeatureExtractionPipeline | null = null;
    private readonly modelName = 'Xenova/bge-m3';

    // LRU cache for embeddings (max 100 entries)
    private embeddingCache = new LRUCache<string, number[]>(100);
    private cacheHits = 0;
    private cacheMisses = 0;

    private constructor() { }

    public static getInstance(): EmbeddingService {
        if (!EmbeddingService.instance) {
            EmbeddingService.instance = new EmbeddingService();
        }
        return EmbeddingService.instance;
    }

    public async init(): Promise<void> {
        if (!this.pipe) {
            console.log(`Loading embedding model ${this.modelName}...`);
            this.pipe = await pipeline('feature-extraction', this.modelName);
            console.log('Embedding model loaded.');
        }
    }

    public async generateEmbedding(text: string): Promise<number[]> {
        // Check cache first
        const cached = this.embeddingCache.get(text);
        if (cached) {
            this.cacheHits++;
            console.log(`[Embedding] Cache HIT (${this.cacheHits} hits / ${this.cacheMisses} misses)`);
            return cached;
        }

        this.cacheMisses++;
        console.log(`[Embedding] Cache MISS - generating embedding...`);

        if (!this.pipe) {
            await this.init();
        }

        if (!this.pipe) {
            throw new Error("Failed to load embedding pipeline");
        }

        // Generate embedding
        const output = await this.pipe(text, { pooling: 'mean', normalize: true });

        // Output is a Tensor. We need to convert it to a regular array.
        const embedding = Array.from(output.data) as number[];

        // Store in cache
        this.embeddingCache.set(text, embedding);

        return embedding;
    }

    public getCacheStats(): { hits: number; misses: number; size: number } {
        return {
            hits: this.cacheHits,
            misses: this.cacheMisses,
            size: this.embeddingCache.size
        };
    }
}

export default EmbeddingService.getInstance();

