import { LuminaSkillContext } from '../../../luminaskillcontext';
import { Moc } from '../../../moc';
import { SearchEngine } from '../../../searchengine';
import { DBManager } from '../../../dbmanager';
import path from 'path';
import { MocSearchTool } from '../tools/mocSearch';

const tempFolderName = 'lumina_knowledge_test'

describe('MocSearch', () => {
    let mocSearchTool: MocSearchTool;
    let context: LuminaSkillContext;
    let manager: DBManager;

    beforeEach(async () => {
        mocSearchTool = new MocSearchTool();
        context = {
            searchEngine: new SearchEngine(tempFolderName),
            dbManager: {} as DBManager,
            folderName: tempFolderName
        };

        manager = new DBManager(path.join(tempFolderName, 'db', 'test_lumina.db'));
        await manager.initialize();
    });

    it('should validate input data correctly', () => {
        const validInput = JSON.stringify({
            query: 'Test MOC'
        });

        const result = mocSearchTool.validateInputData(validInput);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toEqual({
                query: 'Test MOC'
            });
        }
    });

    it('should return error for invalid input data', () => {
        const invalidInput = JSON.stringify({
            invalidField: 'Test MOC'
        });

        const result = mocSearchTool.validateInputData(invalidInput);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toContain('query');
        }
    });

    it('should search for a MOC', async () => {
        const mockMoc = new Moc('Test MOC', tempFolderName);
        await mockMoc.save();

        const input = {
            query: 'Test MOC'
        };

        const result = await mocSearchTool.invoke(input, context);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.moc_ids).toContain(mockMoc.getId());
        }
    });

    it('should return empty array when MOC is not found', async () => {
        const input = {
            query: 'Non-existent MOC'
        };

        const result = await mocSearchTool.invoke(input, context);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.moc_ids).toHaveLength(0);
        }
    });
});
