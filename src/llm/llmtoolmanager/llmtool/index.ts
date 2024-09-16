import { z } from 'zod';
import { Result, Ok, Err } from 'ts-results-es';

const FunctionSchemaProperties = z.record(z.object({
    type: z.string(),
    description: z.string(),
    enum: z.array(z.string()).optional()
}));

const FunctionSchemaZ = z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.object({
        type: z.literal('object'),
        properties: FunctionSchemaProperties,
        required: z.array(z.string())
    })
});

type FunctionSchema = z.infer<typeof FunctionSchemaZ>;

const FunctionDefinitionZ = z.object({
    type: z.literal('function'),
    function: z.object({
        name: z.string(),
        description: z.string(),
        parameters: z.object({
            type: z.literal('object'),
            properties: FunctionSchemaProperties,
            required: z.array(z.string())
        })
    })
});

type FunctionDefinition = z.infer<typeof FunctionDefinitionZ>;

export class LLMTool {
    private apiEndpoint: string;
    private schema: FunctionSchema | null = null;

    constructor(apiEndpoint: string) {
        this.apiEndpoint = apiEndpoint;
    }

    async getSchema(): Promise<Result<FunctionSchema, Error>> {
        if (this.schema) {
            return Ok(this.schema);
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/schema`);
            if (!response.ok) {
                return Err(new Error(`HTTP error! status: ${response.status}`));
            }
            const data = await response.json();
            const parseResult = FunctionSchemaZ.safeParse(data);
            if (parseResult.success) {
                this.schema = parseResult.data;
                return Ok(this.schema);
            } else {
                return Err(new Error(`Invalid schema: ${parseResult.error}`));
            }
        } catch (error) {
            console.error("Error fetching schema:", error);
            return Err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async execute(input: Record<string, any>): Promise<Result<any, Error>> {
        if (!this.schema) {
            const schemaResult = await this.getSchema();
            if (schemaResult.isErr()) {
                return schemaResult;
            }
        }

        const validationResult = this.validateInput(input);
        if (validationResult.isErr()) {
            return validationResult;
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(input),
            });
            if (!response.ok) {
                return Err(new Error(`HTTP error! status: ${response.status}`));
            }
            return Ok(await response.json());
        } catch (error) {
            console.error("Error executing tool:", error);
            return Err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    private validateInput(input: Record<string, any>): Result<true, Error> {
        if (!this.schema) {
            return Err(new Error("Schema not fetched yet. Call getSchema() first."));
        }

        const { properties, required } = this.schema.parameters;
        const inputSchema = z.object(
            Object.fromEntries(
                Object.entries(properties).map(([key, value]) => {
                    let schema: z.ZodTypeAny = z.any();
                    if (value.type === 'string') schema = z.string();
                    if (value.type === 'number') schema = z.number();
                    if (value.type === 'boolean') schema = z.boolean();
                    if (value.enum) schema = z.enum(value.enum as [string, ...string[]]);
                    return [key, required.includes(key) ? schema : schema.optional()];
                })
            )
        );

        const parseResult = inputSchema.safeParse(input);
        if (parseResult.success) {
            return Ok(true);
        } else {
            return Err(new Error(`Invalid input: ${parseResult.error}`));
        }
    }

    toFunctionDefinition(): Result<FunctionDefinition, Error> {
        if (!this.schema) {
            return Err(new Error("Schema not fetched yet. Call getSchema() first."));
        }

        const definition: FunctionDefinition = {
            type: "function",
            function: {
                name: this.schema.name,
                description: this.schema.description,
                parameters: {
                    type: "object",
                    properties: this.schema.parameters.properties,
                    required: this.schema.parameters.required
                }
            }
        };

        const parseResult = FunctionDefinitionZ.safeParse(definition);
        if (parseResult.success) {
            return Ok(parseResult.data);
        } else {
            return Err(new Error(`Invalid function definition: ${parseResult.error}`));
        }
    }
}