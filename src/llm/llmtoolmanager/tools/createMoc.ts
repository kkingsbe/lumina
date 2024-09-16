/**
 * Agent will specify which moc this moc will be listed in
 */

import { FieldDescription, Tool } from "../index";
import { Err, Ok, Result } from "ts-results-es"
import { z } from "zod"
import { LuminaSkillContext } from "../../../luminaskillcontext";
import { Moc } from "../../../moc";

const CreateMocInputSchema = z.object({
    title: z.string()
});

const CreateMocResponseSchema = z.object({
    moc_id: z.string()
});

const inputSchemaFieldDescriptions: FieldDescription[] = [
    {
        name: "title",
        type: "string",
        description: "The title of the Map of Contents (MOC) to be created"
    }
];

export class CreateMocTool implements Tool<z.infer<typeof CreateMocInputSchema>, z.infer<typeof CreateMocResponseSchema>> {
    name = "create_moc";
    description = "Creates a new Map of Contents (MOC) with the specified title";

    input_data_format = CreateMocInputSchema
    input_field_descriptions = inputSchemaFieldDescriptions

    validateInputData(inputData: string): Result<z.infer<typeof CreateMocInputSchema>, string> {
        try {
            const inputJson = JSON.parse(inputData);
            const parsedInputData = CreateMocInputSchema.safeParse(inputJson);

            if (parsedInputData.success) {
                return Ok(parsedInputData.data);
            } else {
                return Err(parsedInputData.error.errors.map(e => e.message).join(", "));
            }
        } catch (error) {
            return Err(`Invalid JSON input: ${error}`);
        }
    }

    async invoke(inputData: z.infer<typeof CreateMocInputSchema>, context: LuminaSkillContext): Promise<Result<z.infer<typeof CreateMocResponseSchema>, string>> {
        try {
            if (!context.folderName) {
                return Err("Invalid context: folderName is missing or empty");
            }
            const moc = new Moc(inputData.title, context.folderName);
            await moc.save();

            return Ok({ moc_id: moc.getId() });
        } catch (error) {
            console.error("Error in CreateMocTool:", error);
            return Err(`An unexpected error occurred: ${error}`);
        }
    }
}
