import OpenAI from 'openai';

class LlmService {
    private static instance: LlmService;
    private client: OpenAI | null = null;
    private model: string = 'openai/gpt-3.5-turbo';

    private constructor() { }

    public static getInstance(): LlmService {
        if (!LlmService.instance) {
            LlmService.instance = new LlmService();
        }
        return LlmService.instance;
    }

    public init() {
        const apiKey = process.env.OPENROUTER_API_KEY; // Using OpenRouter
        const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

        this.model = process.env.LLM_MODEL || 'openai/gpt-3.5-turbo';

        if (!apiKey) {
            console.warn('OpenRouter API Key is missing!');
            return;
        }

        this.client = new OpenAI({
            apiKey: apiKey,
            baseURL: baseURL,
        });
    }

    private buildMessages(
        systemPrompt: string,
        userMessage: string,
        conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
    ): { role: 'system' | 'user' | 'assistant'; content: string }[] {
        const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system', content: systemPrompt },
        ];

        for (const msg of conversationHistory) {
            messages.push({ role: msg.role, content: msg.content });
        }

        messages.push({ role: 'user', content: userMessage });
        return messages;
    }

    public async callLlm(
        systemPrompt: string,
        userMessage: string,
        conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
    ): Promise<string> {
        if (!this.client) this.init();

        if (!this.client) {
            throw new Error("LLM Client not initialized");
        }

        try {
            const messages = this.buildMessages(systemPrompt, userMessage, conversationHistory);

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages,
                temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
            });

            return response.choices[0].message.content || '';
        } catch (error) {
            console.error('LLM Call Error:', error);
            throw error;
        }
    }

    /**
     * Streaming LLM call - returns an async generator yielding content chunks
     */
    public async *callLlmStream(
        systemPrompt: string,
        userMessage: string,
        conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
    ): AsyncGenerator<string, void, unknown> {
        if (!this.client) this.init();

        if (!this.client) {
            throw new Error("LLM Client not initialized");
        }

        const messages = this.buildMessages(systemPrompt, userMessage, conversationHistory);

        const stream = await this.client.chat.completions.create({
            model: this.model,
            messages,
            temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
            stream: true,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                yield content;
            }
        }
    }
}

export default LlmService.getInstance();

