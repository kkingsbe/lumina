import OpenAI from 'openai';
import { LLMToolManager } from './llmtoolmanager';
import { CreateMemoryTool } from './llmtoolmanager/tools/createMemory';
import { CreateMocTool } from './llmtoolmanager/tools/createMoc';
import { MocSearchTool } from './llmtoolmanager/tools/mocSearch';
import { ChatCompletionMessageParam } from 'openai/resources';

export class LLM {
    private openai: OpenAI;
    private toolManager: LLMToolManager;
    private systemPrompt: string;

    constructor(private model: string = 'gpt-4o', systemPrompt: string = '', folderName: string) {
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
    }

    async chat(message: string) {
        let messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: message }
        ];

        while (true) {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: messages,
                tools: this.toolManager.toJson()
            });

            const promptRes = response.choices[0];
            console.log(promptRes.message.tool_calls);

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
}