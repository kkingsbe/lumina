/**
 * Agent will specify title, content, and which moc this memory is associated with
 */

import { FieldDescription, Tool } from "../index";
import { Err, Ok, Result } from "ts-results-es"
import { z } from "zod"
import { LuminaSkillContext } from "../../../luminaskillcontext";
import { Document } from "../../../document";

const EditMemoryInputSchema = z.object({
    id: z.string(),
    new_content: z.string(),
    process_description: z.string().optional()
});

const EditMemoryResponseSchema = z.object({});

const inputSchemaFieldDescriptions: FieldDescription[] = [
    {
        name: "id",
        type: "string",
        description: "The id of the memory to edit, found by using the contextual search tool to find the memory you want to edit."
    },
    {
        name: "new_content",
        type: "string",
        description: "The new content to replace the existing content of the memory"
    },
    {
        name: "process_description",
        type: "string",
        description: "Use this field to communicate to the user what you are doing. For example, you can use this field to communicate that you are editing a memory."
    }
];

export class EditMemoryTool implements Tool<z.infer<typeof EditMemoryInputSchema>, z.infer<typeof EditMemoryResponseSchema>> {
    name = "edit_memory";
    description = "Edits an existing memory by updating its content. The id of the memory to edit should be found using the contextual search tool.";

    input_data_format = EditMemoryInputSchema
    input_field_descriptions = inputSchemaFieldDescriptions

    /**
     * Parses the input data and returns a Result with the parsed data or an error message
     * @param inputData A string containing the input data json to parse
     */
    validateInputData(inputData: string): Result<z.infer<typeof EditMemoryInputSchema>, string> {
        let inputJson = JSON.parse(inputData)
        const parsedInputData = EditMemoryInputSchema.safeParse(inputJson)

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
    async invoke(inputData: z.infer<typeof EditMemoryInputSchema>, context: LuminaSkillContext): Promise<Result<z.infer<typeof EditMemoryResponseSchema>, string>> {
        try {
            console.log("Editing memory:");
            console.log(inputData);
            // Read the existing document
            const documentResult = await Document.read(inputData.id, context.folderName);
            if (!documentResult) {
                return Err(`Unable to find document with id ${inputData.id}`);
            }

            // Update the content
            documentResult.setContent(inputData.new_content);

            // Save the updated document
            await documentResult.save();

            return Ok({});
        } catch (error) {
            console.error("Error in EditMemoryTool:", error);
            return Err(`An unexpected error occurred: ${error}`);
        }
    }
}