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
import { EditMemoryTool } from './llmtoolmanager/tools/editMemory';
import { ListDirectoryContentsTool } from './llmtoolmanager/tools/listDirectoryContents';
import { ReadFileTool } from './llmtoolmanager/tools/readFile';
import { ReadMemoryTool } from './llmtoolmanager/tools/readMemory';

export class LLM {
    private openai: OpenAI;
    private toolManager: LLMToolManager;
    private systemPrompt: string;
    private folderName: string;
    private isInitialized: boolean = false;
    private maxTokens: number = 15000; // Adjust this value as needed
    private tokensPerChar: number = 0.25; // Approximation: 1 token ≈ 4 characters
    private messageHistory: ChatCompletionMessageParam[] = [];

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
        this.toolManager.addTool(new EditMemoryTool());
        this.toolManager.addTool(new ListDirectoryContentsTool());
        this.toolManager.addTool(new ReadFileTool());
        this.toolManager.addTool(new ReadMemoryTool());
    }

    async init() {
        await EmbeddingManager.init(this.folderName);
        this.isInitialized = true;
    }

    async chat(message: string) {
        if (!this.isInitialized) {
            throw new Error("LLM is not initialized. Please call init() before calling chat().");
        }

        if (this.messageHistory.length === 0) {
            this.messageHistory.push({ role: 'system', content: this.systemPrompt });
        }
        this.messageHistory.push({ role: 'user', content: message });

        while (true) {
            await this.updateTaskPlan();

            // Truncate messages if they exceed the token limit
            this.truncateMessages(this.messageHistory);

            // Print all requested tool call IDs
            // console.log("Message history:");
            // console.log(JSON.stringify(this.messageHistory, null, 2));
            console.log("Requested tool call IDs:");
            const assistantMessages = this.messageHistory.filter(msg => msg.role === 'assistant');
            const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
            if (lastAssistantMessage && 'tool_calls' in lastAssistantMessage && lastAssistantMessage.tool_calls) {
                lastAssistantMessage.tool_calls.forEach((toolCall: { id: string }) => {
                    console.log(toolCall.id);
                });
            } else {
                console.log("No tool calls requested in the last assistant message.");
            }

            // Print all tool call IDs with responses
            console.log("Tool call IDs with responses:");
            const lastAgentMessageIndex = this.messageHistory.map(msg => msg.role).lastIndexOf('assistant');
            const respondedToolCallIds = this.messageHistory
                .slice(lastAgentMessageIndex + 1)
                .filter(msg => msg.role === 'tool')
                .map(msg => (msg as { tool_call_id: string }).tool_call_id);
            
            if (respondedToolCallIds.length > 0) {
                respondedToolCallIds.forEach(id => console.log(id));
            } else {
                console.log("No tool call responses since the last agent message.");
            }

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: this.messageHistory,
                tools: this.toolManager.toJson()
            }).catch((error) => {
                console.log(error)
                console.log("Message history:")
                console.log(this.messageHistory)
                throw error
            })

            const promptRes = response.choices[0];
            if (promptRes.message.content) {
                console.log("Lumina:", promptRes.message.content);
            } else if (promptRes.message.tool_calls) {
                console.log(`Lumina: ${JSON.parse(promptRes.message.tool_calls[0].function.arguments)?.process_description}`)
                console.log("Tool calls:");
                promptRes.message.tool_calls.forEach((toolCall, index) => {
                    console.log(`Tool call ${index + 1}:`);
                    console.log(`  Name: ${toolCall.function.name}`);
                    console.log(`  Arguments: ${toolCall.function.arguments}`);
                });
            }

            if (!promptRes.message.tool_calls) {
                this.messageHistory.push(promptRes.message);
                return promptRes.message.content;
            }

            this.messageHistory.push(promptRes.message);

            const toolResults = [];
            for (const toolCall of promptRes.message.tool_calls) {
                try {
                    const toolResponse = await this.toolManager.invokeTool(toolCall.function.name, toolCall.function.arguments);
                    const toolResult = {
                        tool_call_id: toolCall.id,
                        role: 'tool' as const,
                        name: toolCall.function.name,
                        content: JSON.stringify(toolResponse)
                    };

                    console.log("Tool result:");
                    console.log(toolResult);
                    console.log("===================================")
                    toolResults.push(toolResult);
                    this.messageHistory.push(toolResult);
                } catch (error) {
                    console.error(`Error invoking tool ${toolCall.function.name}:`, error);
                    const errorResult = {
                        tool_call_id: toolCall.id,
                        role: 'tool' as const,
                        name: toolCall.function.name,
                        content: JSON.stringify({ error: `Error invoking tool: ${(error as Error).message || String(error)}` })
                    };
                    toolResults.push(errorResult);
                    this.messageHistory.push(errorResult);
                }
            }

            // Check if all tool calls have corresponding responses
            const toolCallIds = promptRes.message.tool_calls.map(tc => tc.id);
            const respondedToolCalls = toolResults.map(tr => tr.tool_call_id);
            const missingToolCallIds = toolCallIds.filter(id => !respondedToolCalls.includes(id));

            console.log("Missing tool call IDs:");
            console.log(missingToolCallIds);
        }
    }

    private async updateTaskPlan() {
        const updatePlanMessage = {
            role: 'system' as const,
            content: `
            Please update the task plan based on the current progress and any new information. In your response, provide only xml containing the updated plan, 
            following the format in the system prompt. Make sure to use the "<current-step> tag to indicate the current step you are on.
            The more steps in advance you are able to include in your response, the more effective you will be at accomplishing your task.
            If you need to drastically change your approach, that is completely fine. Especially if it is due to new information from the user.
            You must be as specific and verbose as possible. Make sure to not change your steps that are already completed.
            `,
        };
        this.messageHistory.push(updatePlanMessage);

        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: this.messageHistory,
            tools: this.toolManager.toJson(),
            tool_choice: 'none'
        });

        const updatedPlan = response.choices[0].message;

        console.log("===================================")
        console.log("Updated plan:");
        console.log(updatedPlan);
        console.log("===================================")

        this.messageHistory.push(updatedPlan);
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