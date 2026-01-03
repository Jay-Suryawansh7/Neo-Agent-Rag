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

    public async callLlm(systemPrompt: string, userMessage: string): Promise<string> {
        if (!this.client) this.init();

        if (!this.client) {
            throw new Error("LLM Client not initialized");
        }

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
            });

            return response.choices[0].message.content || '';
        } catch (error) {
            console.error('LLM Call Error:', error);
            throw error;
        }
    }
}

export default LlmService.getInstance();
