import { Result, Ok, Err } from 'ts-results-es';
import { z } from 'zod';
import { LuminaSkillContext } from '../../../luminaskillcontext';
import { FieldDescription, Tool } from '..';
import path from 'path';
import fs from 'fs';

const ListDirectoryContentsInputSchema = z.object({
    directory: z.string(),
    process_description: z.string().optional()
});

const ListDirectoryContentsResponseSchema = z.object({
    file_paths: z.array(z.string())
});

const inputSchemaFieldDescriptions: FieldDescription[] = [{
    name: "directory",
    type: "string",
    description: "The directory path to list contents from. The tool will list all files and directories in this directory. This will be relative to the root of the environment you have access to."
},
{
    name: "process_description",
    type: "string",
    description: "Use this field to communicate to the user what you are doing. For example, you can use this field to communicate that you are listing contents from a directory."
}];

export class ListDirectoryContentsTool implements Tool<z.infer<typeof ListDirectoryContentsInputSchema>, z.infer<typeof ListDirectoryContentsResponseSchema>> {
    name = "ListDirectoryContentsTool";
    description = "Lists all files and directories in a specified directory";
    input_data_format = ListDirectoryContentsInputSchema;
    input_field_descriptions = inputSchemaFieldDescriptions;

    /**
     * Parses the input data and returns a Result with the parsed data or an error message
     * @param inputData A string containing the input data json to parse
     */
    validateInputData(inputData: string): Result<z.infer<typeof ListDirectoryContentsInputSchema>, string> {
        let inputJson = JSON.parse(inputData);
        const parsedInputData = ListDirectoryContentsInputSchema.safeParse(inputJson);

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
    async invoke(inputData: z.infer<typeof ListDirectoryContentsInputSchema>, context: LuminaSkillContext): Promise<Result<z.infer<typeof ListDirectoryContentsResponseSchema>, string>> {
        try {
            const baseDir = process.cwd(); // Get the current working directory
            const requestedPath = path.resolve(baseDir, inputData.directory);

            // Check if the requested path is within or equal to the base directory
            if (!requestedPath.startsWith(baseDir)) {
                return Err(`Access denied: Cannot access directories outside of ${baseDir}`);
            }

            if (!fs.existsSync(requestedPath)) {
                return Err(`Directory does not exist: ${requestedPath}`);
            }

            const contents = fs.readdirSync(requestedPath);
            const contentPaths = contents.map(item => path.join(inputData.directory, item));

            console.log("Content paths:", contentPaths);

            return Ok({ file_paths: contentPaths });
        } catch (error) {
            console.error("Error in ListDirectoryContentsTool:", error);
            return Err(`An unexpected error occurred: ${error}`);
        }
    }
}
