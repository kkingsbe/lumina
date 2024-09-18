import { Result, Ok, Err } from 'ts-results-es';
import { z } from 'zod';
import { LuminaSkillContext } from '../../../luminaskillcontext';
import { FieldDescription, Tool } from '..';
import path from 'path';
import fs from 'fs';

const ReadFileInputSchema = z.object({
    file_path: z.string(),
    process_description: z.string().optional()
});

const ReadFileResponseSchema = z.object({
    content: z.string()
});

const inputSchemaFieldDescriptions: FieldDescription[] = [{
    name: "file_path",
    type: "string",
    description: "The path to the file to read. This will be relative to the root of the environment you have access to."
},
{
    name: "process_description",
    type: "string",
    description: "Use this field to communicate to the user what you are doing. For example, you can use this field to communicate that you are reading a file."
}];

export class ReadFileTool implements Tool<z.infer<typeof ReadFileInputSchema>, z.infer<typeof ReadFileResponseSchema>> {
    name = "ReadFileTool";
    description = "Reads the content of a specified file from the file system of the host machine that you are running on. Do not use this for accessing your memory, use the ReadMemoryTool instead.";
    input_data_format = ReadFileInputSchema;
    input_field_descriptions = inputSchemaFieldDescriptions;

    /**
     * Parses the input data and returns a Result with the parsed data or an error message
     * @param inputData A string containing the input data json to parse
     */
    validateInputData(inputData: string): Result<z.infer<typeof ReadFileInputSchema>, string> {
        let inputJson = JSON.parse(inputData);
        const parsedInputData = ReadFileInputSchema.safeParse(inputJson);

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
    async invoke(inputData: z.infer<typeof ReadFileInputSchema>, context: LuminaSkillContext): Promise<Result<z.infer<typeof ReadFileResponseSchema>, string>> {
        try {
            const baseDir = process.cwd(); // Get the current working directory
            const requestedPath = path.resolve(baseDir, inputData.file_path);

            // Check if the requested path is within or equal to the base directory
            if (!requestedPath.startsWith(baseDir)) {
                return Err(`Access denied: Cannot access files outside of ${baseDir}`);
            }

            if (!fs.existsSync(requestedPath)) {
                return Err(`File does not exist: ${requestedPath}`);
            }

            const content = fs.readFileSync(requestedPath, 'utf8');

            return Ok({ content });
        } catch (error) {
            console.error("Error in ReadFileTool:", error);
            return Err(`An unexpected error occurred: ${error}`);
        }
    }
}
