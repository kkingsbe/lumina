import { ReadFileTool } from '../tools/readFile';
import { LuminaSkillContext } from '../../../luminaskillcontext';

describe('ReadFileTool', () => {
    let tool: ReadFileTool;
    let context: LuminaSkillContext;
    const testFolderName = 'lumina_knowledge_test';

    beforeEach(() => {
        tool = new ReadFileTool();
        context = {
            folderName: testFolderName,
        } as LuminaSkillContext;
    });

    it("shound read the contents of a file", async () => {
        const input = { file_path: './src/dbmanager/index.ts' };
        const result = await tool.invoke(input, context);
        console.log(result)
        expect(result.isOk())
    });
});
