import OpenAI from 'openai';

export class LLM {
    private openai: OpenAI;

    constructor(private model: string = 'gpt-4', systemPrompt: string = '') {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OpenAI API key is not set. Please check your environment variables.");
        }

        this.openai = new OpenAI({ apiKey });
    }

    async chat(messages: OpenAI.Chat.ChatCompletionMessageParam[]) {
        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: messages
        });
        return response.choices[0].message.content;
    }
}