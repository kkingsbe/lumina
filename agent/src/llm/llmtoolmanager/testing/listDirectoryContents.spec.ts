import { ListDirectoryContentsTool } from '../tools/listDirectoryContents';
import { LuminaSkillContext } from '../../../luminaskillcontext';

describe('ListDirectoryContentsTool', () => {
    let tool: ListDirectoryContentsTool;
    let context: LuminaSkillContext;
    const testFolderName = 'lumina_knowledge_test';

    beforeEach(() => {
        tool = new ListDirectoryContentsTool();
        context = {
            folderName: testFolderName,
        } as LuminaSkillContext;
    });

    it("should list directory contents correctly", async () => {
        const input = { directory: '.' };
        const result = await tool.invoke(input, context);
        console.log(result);
    })
});
