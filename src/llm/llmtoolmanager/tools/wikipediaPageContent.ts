import { Result, Ok, Err } from 'ts-results-es';
import { z } from 'zod';
import { LuminaSkillContext } from '../../../luminaskillcontext';
import { FieldDescription, Tool } from '..';
import wikipedia from 'wikipedia';

const WikipediaPageContentInputSchema = z.object({
    pageId: z.string(),
    page: z.number().int().nonnegative().default(0)
});

const WikipediaPageContentResponseSchema = z.object({
    title: z.string(),
    content: z.string(),
    hasMore: z.boolean()
});
 
const inputSchemaFieldDescriptions: FieldDescription[] = [
    {
        name: "pageId",
        type: "string",
        description: "The Wikipedia page ID to fetch content for."
    },
    {
        name: "page",
        type: "number",
        description: "The page number of the content to fetch (default: 0). This allows for reading larger pages in chunks to stay within the token limit. If `hasMore` is true in the response, then there is more content to fetch."
    }
];

export class WikipediaPageContentTool implements Tool<z.infer<typeof WikipediaPageContentInputSchema>, z.infer<typeof WikipediaPageContentResponseSchema>> {
    name = "WikipediaPageContentTool";
    description = "Fetches the content of a specific Wikipedia page based on its ID, with pagination support";
    input_data_format = WikipediaPageContentInputSchema;
    input_field_descriptions = inputSchemaFieldDescriptions;

    private readonly PAGE_SIZE = 1000;

    validateInputData(inputData: string): Result<z.infer<typeof WikipediaPageContentInputSchema>, string> {
        try {
            const inputJson = JSON.parse(inputData);
            const parsedInputData = WikipediaPageContentInputSchema.safeParse(inputJson);

            if (parsedInputData.success) {
                return Ok(parsedInputData.data);
            } else {
                return Err(parsedInputData.error.errors.map(e => e.message).join(", "));
            }
        } catch (error) {
            return Err(`Invalid JSON: ${error}`);
        }
    }

    async invoke(inputData: z.infer<typeof WikipediaPageContentInputSchema>, context: LuminaSkillContext): Promise<Result<z.infer<typeof WikipediaPageContentResponseSchema>, string>> {
        try {
            const page = await wikipedia.page(inputData.pageId);
            const fullContent = await page.content();

            const start = inputData.page * this.PAGE_SIZE;
            const end = start + this.PAGE_SIZE;
            const paginatedContent = fullContent.slice(start, end);

            return Ok({
                title: page.title,
                content: paginatedContent,
                hasMore: end < fullContent.length
            });
        } catch (error) {
            console.error("Error in WikipediaPageContentTool:", error);
            return Err(`An error occurred while fetching Wikipedia page content: ${error}`);
        }
    }
}
