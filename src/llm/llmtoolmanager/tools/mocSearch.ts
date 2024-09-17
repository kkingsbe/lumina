import { Result, Ok, Err } from 'ts-results-es';
import { z } from 'zod';
import { LuminaSkillContext } from '../../../luminaskillcontext';
import { FieldDescription, Tool } from '..';
import { Moc } from '../../../moc';

const MocSearchInputSchema = z.object({
    query: z.string()
});

const MocSearchResponseSchema = z.object({
    moc_ids: z.array(z.string())
});

const inputSchemaFieldDescriptions: FieldDescription[] = [{
    name: "query",
    type: "string",
    description: "The search query to find the MOC. The tool will search for MOCs that contain the query string in their title."
}];

export class MocSearchTool implements Tool<z.infer<typeof MocSearchInputSchema>, z.infer<typeof MocSearchResponseSchema>> {
    name = "MocSearchTool";
    description = "Searches for MOCs by title, using the provided query";
    input_data_format = MocSearchInputSchema;
    input_field_descriptions = inputSchemaFieldDescriptions;

    /**
     * Parses the input data and returns a Result with the parsed data or an error message
     * @param inputData A string containing the input data json to parse
     */
    validateInputData(inputData: string): Result<z.infer<typeof MocSearchInputSchema>, string> {
        let inputJson = JSON.parse(inputData);
        const parsedInputData = MocSearchInputSchema.safeParse(inputJson);

        if (parsedInputData.success) {
            return Ok(parsedInputData.data);
        } else {
            return Err(parsedInputData.error.errors.map(e => e.message).join(", "));
        }
    }

    /**
     * Invokes the skill and returns the result set or an error message
     * @param inputData 
     * @returns 
     */
    async invoke(inputData: z.infer<typeof MocSearchInputSchema>, context: LuminaSkillContext): Promise<Result<z.infer<typeof MocSearchResponseSchema>, string>> {
        try {
            const searchResults = await context.searchEngine.searchByTitle(inputData.query);
            if (searchResults.isErr()) {
                return Err(searchResults.error.message);
            }
            const mocIds = searchResults.unwrap().filter(result => result instanceof Moc).map(result => result.getId());

            return Ok({ moc_ids: mocIds });
        } catch (error) {
            console.error("Error in MocSearchTool:", error);
            return Err(`An unexpected error occurred: ${error}`);
        }
    }
}
