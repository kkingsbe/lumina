/**
 * Agent will specify title, content, and which moc this memory is associated with
 */

import { FieldDescription, Tool } from "../index";
import { Err, Ok, Result } from "ts-results-es"
import { z } from "zod"
import { LuminaSkillContext } from "../../../luminaskillcontext";
import { Moc } from "../../../moc";
import { Document } from "../../../document";

const CreateMemoryInputSchema = z.object({
    title: z.string(),
    content: z.string(),
    moc_id: z.string()
});

const CreateMemoryResponseSchema = z.object({
    document_id: z.string()
});

const inputSchemaFieldDescriptions: FieldDescription[] = [
    {
        name: "title",
        type: "string",
        description: "The title of the memory"
    },
    {
        name: "content",
        type: "string",
        description: "The content of the memory"
    },
    {
        name: "moc_id",
        type: "string",
        description: "The id of the map of contents file (MOC) that this memory is associated with. All memories must be associated with a MOC."
    }
];

export class CreateMemoryTool implements Tool<z.infer<typeof CreateMemoryInputSchema>, z.infer<typeof CreateMemoryResponseSchema>> {
    name = "create_memory";
    description = "Creates a new memory in the specified map of contents file (MOC). All memories must be associated with a MOC. A search tool should be used to find the desired MOC id, or create it using the MOC creation tool";

    input_data_format = CreateMemoryInputSchema
    input_field_descriptions = inputSchemaFieldDescriptions

    /**
     * Parses the input data and returns a Result with the parsed data or an error message
     * @param inputData A string containing the input data json to parse
     */
    validateInputData(inputData: string): Result<z.infer<typeof CreateMemoryInputSchema>, string> {
        let inputJson = JSON.parse(inputData)
        const parsedInputData = CreateMemoryInputSchema.safeParse(inputJson)

        if (parsedInputData.success) {
            return Ok(parsedInputData.data)
        } else {
            return Err(parsedInputData.error.errors.map(e => e.message).join(", "))
        }
    }

    /**
     * Invokes the skill and returns the result set or an error message
     * @param inputData 
     * @returns 
     */
    async invoke(inputData: z.infer<typeof CreateMemoryInputSchema>, context: LuminaSkillContext): Promise<Result<z.infer<typeof CreateMemoryResponseSchema>, string>> {
        try {
            // Check if the provided MOC exists
            console.log("Creating memory with MOC id:", inputData.moc_id)
            const mocResult = await Moc.readById(inputData.moc_id, context.folderName)
            if (mocResult.isNone()) {
                return Err(`Unable to find MOC with id ${inputData.moc_id}`);
            }

            const moc = mocResult.unwrap()

            // Create the document
            const document = new Document(inputData.title, inputData.content, context.folderName)
            
            // Save to disk
            await document.save()

            // Add the document to the MOC
            await moc.addDocument(document)

            return Ok({ document_id: document.getId() })
        } catch (error) {
            console.error("Error in CreateMemoryTool:", error);
            return Err(`An unexpected error occurred: ${error}`);
        }
    }
}