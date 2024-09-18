import { Result, Ok, Err } from 'ts-results-es';
import { z } from 'zod';
import { LuminaSkillContext } from '../../../luminaskillcontext';
import { FieldDescription, Tool } from '..';
import wikipedia from 'wikipedia';

const WikipediaInputSchema = z.object({
    query: z.string(),
    process_description: z.string().optional()
});

const WikipediaResponseSchema = z.object({
    title: z.string(),
    id: z.number(),
    summary: z.string()
});

const inputSchemaFieldDescriptions: FieldDescription[] = [{
    name: "query",
    type: "string",
    description: "The search query to find information on Wikipedia."
},
{
    name: "process_description",
    type: "string",
    description: "Use this field to communicate to the user what you are doing. For example, you can use this field to communicate that you are searching Wikipedia."
}];

export class WikipediaSearchTool implements Tool<z.infer<typeof WikipediaInputSchema>, z.infer<typeof WikipediaResponseSchema>> {
    name = "WikipediaSearchTool";
    description = "Searches Wikipedia for pages based on the provided query";
    input_data_format = WikipediaInputSchema;
    input_field_descriptions = inputSchemaFieldDescriptions;

    validateInputData(inputData: string): Result<z.infer<typeof WikipediaInputSchema>, string> {
        try {
            const inputJson = JSON.parse(inputData);
            const parsedInputData = WikipediaInputSchema.safeParse(inputJson);

            if (parsedInputData.success) {
                return Ok(parsedInputData.data);
            } else {
                return Err(parsedInputData.error.errors.map(e => e.message).join(", "));
            }
        } catch (error) {
            return Err(`Invalid JSON: ${error}`);
        }
    }

    async invoke(inputData: z.infer<typeof WikipediaInputSchema>, context: LuminaSkillContext): Promise<Result<z.infer<typeof WikipediaResponseSchema>[], string>> {
        try {
            const searchResults = await wikipedia.search(inputData.query);
            if (searchResults.results.length === 0) {
                return Err("No results found for the given query.");
            }

            const pages = await Promise.all(searchResults.results.slice(0, 3).map(async (result) => {
                const page = await wikipedia.page(result.pageid);
                const summary = await page.summary();
                return {
                    title: page.title,
                    id: page.pageid,
                    summary: summary.extract_html
                };
            }));

            return Ok(pages);
        } catch (error) {
            console.error("Error in WikipediaTool:", error);
            return Err(`An error occurred while searching Wikipedia: ${error}`);
        }
    }
}
