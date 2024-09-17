import OpenAI from 'openai';
import { LLMToolManager } from './llmtoolmanager';
import { CreateMemoryTool } from './llmtoolmanager/tools/createMemory';
import { CreateMocTool } from './llmtoolmanager/tools/createMoc';
import { MocSearchTool } from './llmtoolmanager/tools/mocSearch';
import { ChatCompletionMessageParam } from 'openai/resources';
import { ContextualSearchTool } from './llmtoolmanager/tools/contextualSearch';
import { EmbeddingManager } from '../embeddingmanager';
import { WikipediaPageContentTool } from './llmtoolmanager/tools/wikipediaPageContent';
import { WikipediaSearchTool } from './llmtoolmanager/tools/wikipediaSearch';

export class LLM {
    private openai: OpenAI;
    private toolManager: LLMToolManager;
    private systemPrompt: string;
    private folderName: string;
    private isInitialized: boolean = false;
    private maxTokens: number = 15000; // Adjust this value as needed
    private tokensPerChar: number = 0.25; // Approximation: 1 token ≈ 4 characters

    constructor(private model: string = 'gpt-4o', systemPrompt: string = '', folderName: string) {
        this.folderName = folderName;

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OpenAI API key is not set. Please check your environment variables.");
        }

        this.systemPrompt = systemPrompt;
        this.openai = new OpenAI({ apiKey });
        this.toolManager = new LLMToolManager(folderName);

        this.toolManager.addTool(new CreateMemoryTool());
        this.toolManager.addTool(new CreateMocTool());
        this.toolManager.addTool(new MocSearchTool());
        this.toolManager.addTool(new ContextualSearchTool());
        this.toolManager.addTool(new WikipediaPageContentTool());
        this.toolManager.addTool(new WikipediaSearchTool());
    }

    async init() {
        await EmbeddingManager.init(this.folderName);
        this.isInitialized = true;
    }

    async chat(message: string) {
        if (!this.isInitialized) {
            throw new Error("LLM is not initialized. Please call init() before calling chat().");
        }

        let messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: message }
        ];

        while (true) {
            // Truncate messages if they exceed the token limit
            this.truncateMessages(messages);

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: messages,
                tools: this.toolManager.toJson()
            });

            const promptRes = response.choices[0];
            if (promptRes.message.content) {
                console.log("Lumina:", promptRes.message.content);
            } else if (promptRes.message.tool_calls) {
                console.log("Tool calls:");
                promptRes.message.tool_calls.forEach((toolCall, index) => {
                    console.log(`Tool call ${index + 1}:`);
                    console.log(`  Name: ${toolCall.function.name}`);
                    console.log(`  Arguments: ${toolCall.function.arguments}`);
                });
            }

            if (!promptRes.message.tool_calls) {
                return promptRes.message.content;
            }

            messages.push(promptRes.message);

            const toolResults = [];
            for (const toolCall of promptRes.message.tool_calls) {
                const toolResponse = await this.toolManager.invokeTool(toolCall.function.name, toolCall.function.arguments);
                console.log("Tool response:");
                console.log(toolResponse);
                const toolResult = {
                    tool_call_id: toolCall.id,
                    role: 'tool' as const,
                    name: toolCall.function.name,
                    content: JSON.stringify(toolResponse)
                };
                toolResults.push(toolResult);
                messages.push(toolResult);
            }
        }
    }

    private truncateMessages(messages: ChatCompletionMessageParam[]) {
        let totalTokens = this.estimateTokens(JSON.stringify(messages[0])); // Start with system prompt tokens
        const truncatedMessages: ChatCompletionMessageParam[] = [messages[0]]; // Always keep the system prompt

        for (let i = 1; i < messages.length; i++) {
            const message = messages[i];
            const messageTokens = this.estimateTokens(JSON.stringify(message));
            
            if (totalTokens + messageTokens <= this.maxTokens) {
                truncatedMessages.push(message);
                totalTokens += messageTokens;
            } else {
                const remainingTokens = this.maxTokens - totalTokens;
                const truncatedContent = this.truncateContent(message.content as string, remainingTokens);
                truncatedMessages.push({ ...message, content: truncatedContent });
                break;
            }
        }

        messages.splice(0, messages.length, ...truncatedMessages);
    }

    private truncateContent(content: string, maxTokens: number): string {
        const maxChars = Math.floor(maxTokens / this.tokensPerChar);
        return content.slice(0, maxChars);
    }

    private estimateTokens(text: string): number {
        return Math.ceil(text.length * this.tokensPerChar);
    }
}