import { Result, Ok, Err } from 'ts-results-es';
import { z } from 'zod';
import { LuminaSkillContext } from '../../../luminaskillcontext';
import { FieldDescription, Tool } from '..';
import { Document } from '../../../document';

const ReadMemoryInputSchema = z.object({
    document_id: z.string(),
    process_description: z.string().optional()
});

const ReadMemoryResponseSchema = z.object({
    content: z.string()
});

const inputSchemaFieldDescriptions: FieldDescription[] = [
    {
        name: "document_id",
        type: "string",
        description: "The ID of the memory document to read"
    },
    {
        name: "process_description",
        type: "string",
        description: "Use this field to communicate to the user what you are doing. For example, you can use this field to communicate that you are reading a specific memory document."
    }
];

export class ReadMemoryTool implements Tool<z.infer<typeof ReadMemoryInputSchema>, z.infer<typeof ReadMemoryResponseSchema>> {
    name = "ReadMemoryTool";
    description = "Reads the content of a specific memory document based on the provided document ID.";
    input_data_format = ReadMemoryInputSchema;
    input_field_descriptions = inputSchemaFieldDescriptions;

    validateInputData(inputData: string): Result<z.infer<typeof ReadMemoryInputSchema>, string> {
        let inputJson = JSON.parse(inputData);
        const parsedInputData = ReadMemoryInputSchema.safeParse(inputJson);

        if (parsedInputData.success) {
            return Ok(parsedInputData.data);
        } else {
            return Err(parsedInputData.error.errors.map(e => e.message).join(", "));
        }
    }

    async invoke(inputData: z.infer<typeof ReadMemoryInputSchema>, context: LuminaSkillContext): Promise<Result<z.infer<typeof ReadMemoryResponseSchema>, string>> {
        try {
            const document = await Document.read(inputData.document_id, context.folderName);
            
            if (!document) {
                return Err(`Document with ID ${inputData.document_id} not found.`);
            }

            const content = document.getContent();

            return Ok({ content });
        } catch (error) {
            console.error("Error in ReadMemoryTool:", error);
            return Err(`An unexpected error occurred: ${error}`);
        }
    }
}
