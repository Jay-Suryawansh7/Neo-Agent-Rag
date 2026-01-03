import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';

class EmbeddingService {
    private static instance: EmbeddingService;
    private pipe: FeatureExtractionPipeline | null = null;
    private readonly modelName = 'Xenova/bge-m3';

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
        if (!this.pipe) {
            await this.init();
        }

        if (!this.pipe) {
            throw new Error("Failed to load embedding pipeline");
        }

        // Generate embedding
        // pooling: 'cls' or 'mean' is common. bge-m3 typically uses CLS or dense output.
        // The Python code uses model.encode which handles pooling.
        // Xenova pipeline output needs proper handling.
        const output = await this.pipe(text, { pooling: 'mean', normalize: true });

        // Output is a Tensor. We need to convert it to a regular array.
        // The tensor shape is [1, 1024].
        return Array.from(output.data);
    }
}

export default EmbeddingService.getInstance();
