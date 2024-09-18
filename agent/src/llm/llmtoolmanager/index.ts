import { Err, Ok, Result } from "ts-results-es"
import { ZodObject } from 'zod';
import { LuminaSkillContext } from "../../luminaskillcontext";

/**
 * Defines an interface that all Tools must follow.
 * The generic type T is the type of the input data which is provided into the tool
 */
export interface Tool<T, R> {
    name: string;
    description: string;
    input_data_format: ZodObject<any>;
    input_field_descriptions: FieldDescription[];
    validateInputData: (inputData: string) => Result<T, string>;
    invoke: (inputData: T, context: LuminaSkillContext) => Promise<Result<R, string> | Result<R[], string>>;
}

export interface FieldDescription {
    name: string;
    description: string;
    type: "string" | "number" | "boolean" | "object" | "array" | "null";
    values?: string[];
}

interface OpenaiTool {
    type: "function",
    function: {
        name: string,
        description: string,
        parameters: {
            type: "object",
            properties: any,
            required: string[]
        }
    }
}

interface PropertySchema {
    type: string;
    description: string;
    enum?: string[];
    items?: {
        type: string
    }
}

export class LLMToolManager {
    tools: Map<string, Tool<any, any>>;
    private context: LuminaSkillContext;

    constructor(folderName: string) {
        this.tools = new Map()
        this.context = new LuminaSkillContext(folderName)
    }
    
    addTool(tool: Tool<any, any>) {
        this.tools.set(tool.name, tool)
    }

    toJson(): OpenaiTool[] {
        const allTools = Array.from(this.tools.values())
        return allTools.map(tool => {
            let properties: { [key: string]: PropertySchema } = {};
            for(let field of tool.input_field_descriptions) {
                properties[field.name] = { 
                    type: field.type, 
                    description: field.description,
                    enum: field?.values ?? undefined
                }

                if(field.type == "array") {
                    properties[field.name].items = {
                        type: "string"
                    }
                }
            }

            return {
                type: "function",
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: {
                        type: "object",
                        properties,
                        required: tool.input_field_descriptions.map(field => field.name)
                    }
                }
            }
        })
    }

    async invokeTool(toolName: string, toolInput: string): Promise<Result<string, string>> {
        // Make sure the tool exists
        const tool = this.tools.get(toolName)
        if(!tool) {
            return Err(`Tool ${toolName} not found`)
        }

        // Make sure the input is valid
        const parsedInput = tool.validateInputData(toolInput)
        if(parsedInput.isErr()) {
            console.log(`Error while validating input for tool ${toolName}: `, toolInput)
            console.log(parsedInput.error)
            return Err(`Error parsing tool input: ${parsedInput.error}`)
        }

        // Invoke the tool
        const toolResponse = await tool.invoke(parsedInput.unwrap(), this.context)
        if(toolResponse.isErr()) {
            return Err(`Error invoking tool ${toolName}: ${toolResponse.error}`)
        }

        return Ok(toolResponse.unwrap())
    }
}
