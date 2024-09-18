import { Result, Ok, Err } from 'ts-results-es';
import { z } from 'zod';
import { LuminaSkillContext } from '../../../luminaskillcontext';
import { FieldDescription, Tool } from '..';
import { Document } from '../../../document';
import { Moc } from '../../../moc';

const ContextualSearchInputSchema = z.object({
    query: z.string(),
    limit: z.number().int().positive().default(5),
    process_description: z.string().optional()
});

const ContextualSearchResponseSchema = z.object({
    document_ids: z.array(z.string()),
    moc_ids: z.array(z.string())
});

const inputSchemaFieldDescriptions: FieldDescription[] = [
    {
        name: "query",
        type: "string",
        description: "The search query to find relevant documents"
    },
    {
        name: "limit",
        type: "number",
        description: "The maximum number of results to return (default: 5)"
    },
    {
        name: "process_description",
        type: "string",
        description: "Use this field to communicate to the user what you are doing. For example, you can use this field to communicate that you are searching the knowledge base for relevant information."
    }
];

export class ContextualSearchTool implements Tool<z.infer<typeof ContextualSearchInputSchema>, z.infer<typeof ContextualSearchResponseSchema>> {
    name = "ContextualSearchTool";
    description = "Performs a contextual search using vector embeddings to find the most relevant documents and MOCs based on the provided query.";
    input_data_format = ContextualSearchInputSchema;
    input_field_descriptions = inputSchemaFieldDescriptions;

    validateInputData(inputData: string): Result<z.infer<typeof ContextualSearchInputSchema>, string> {
        let inputJson = JSON.parse(inputData);
        const parsedInputData = ContextualSearchInputSchema.safeParse(inputJson);

        if (parsedInputData.success) {
            return Ok(parsedInputData.data);
        } else {
            return Err(parsedInputData.error.errors.map(e => e.message).join(", "));
        }
    }

    async invoke(inputData: z.infer<typeof ContextualSearchInputSchema>, context: LuminaSkillContext): Promise<Result<z.infer<typeof ContextualSearchResponseSchema>, string>> {
        try {
            const searchResults = await context.searchEngine.contextualSearch(inputData.query, inputData.limit);
            if (searchResults.isErr()) {
                return Err(searchResults.error.message);
            }

            const mocIds = searchResults.unwrap().filter(result => result instanceof Moc).map(result => result.getId());
            const documentIds = searchResults.unwrap().filter(result => result instanceof Document).map(result => result.getId());

            return Ok({ document_ids: documentIds, moc_ids: mocIds });
        } catch (error) {
            console.error("Error in ContextualSearchTool:", error);
            return Err(`An unexpected error occurred: ${error}`);
        }
    }
}
