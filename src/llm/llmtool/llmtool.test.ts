import { LLMTool } from './index';
import { Result, Ok, Err } from 'ts-results-es';
import dotenv from 'dotenv';

dotenv.config();

describe('LLMTool', () => {
    let llmTool: LLMTool;
    const apiEndpoint = 'https://your-actual-api-endpoint.com'; // Replace with your actual API endpoint

    beforeEach(() => {
        llmTool = new LLMTool(apiEndpoint);
    });

    describe('getSchema', () => {
        it('should fetch and return a valid schema', async () => {
            const result = await llmTool.getSchema();
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const schema = result.unwrap();
                expect(schema).toHaveProperty('name');
                expect(schema).toHaveProperty('description');
                expect(schema).toHaveProperty('parameters');
                expect(schema.parameters).toHaveProperty('type');
                expect(schema.parameters).toHaveProperty('properties');
                expect(schema.parameters).toHaveProperty('required');
            }
        }, 30000); // Increased timeout to 30 seconds
    });

    describe('execute', () => {
        it('should execute the function with valid input', async () => {
            const schemaResult = await llmTool.getSchema();
            expect(schemaResult.isOk()).toBe(true);
            
            if (schemaResult.isOk()) {
                const schema = schemaResult.unwrap();
                const testInput: Record<string, any> = {};
                
                // Construct a valid input based on the schema
                Object.entries(schema.parameters.properties).forEach(([key, value]) => {
                    if (value.type === 'string') {
                        testInput[key] = 'test value';
                    } else if (value.type === 'number') {
                        testInput[key] = 1;
                    } else if (value.type === 'boolean') {
                        testInput[key] = true;
                    }
                });

                const result = await llmTool.execute(testInput);
                expect(result.isOk()).toBe(true);
                if (result.isOk()) {
                    expect(result.unwrap()).toBeDefined();
                }
            }
        }, 30000); // Increased timeout to 30 seconds

        it('should return an error for invalid input', async () => {
            const result = await llmTool.execute({ invalidParam: 'invalid value' });
            expect(result.isErr()).toBe(true);
        }, 30000); // Increased timeout to 30 seconds
    });

    describe('toFunctionDefinition', () => {
        it('should return a valid function definition', async () => {
            await llmTool.getSchema();
            const result = llmTool.toFunctionDefinition();
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const functionDef = result.unwrap();
                expect(functionDef).toHaveProperty('type', 'function');
                expect(functionDef.function).toHaveProperty('name');
                expect(functionDef.function).toHaveProperty('description');
                expect(functionDef.function).toHaveProperty('parameters');
            }
        }, 30000); // Increased timeout to 30 seconds

        it('should return an error if schema is not fetched', () => {
            const newLLMTool = new LLMTool(apiEndpoint);
            const result = newLLMTool.toFunctionDefinition();
            expect(result.isErr()).toBe(true);
        });
    });
});

