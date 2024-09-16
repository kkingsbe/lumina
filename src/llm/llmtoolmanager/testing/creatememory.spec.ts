import { CreateMemoryTool } from '../tools/createMemory';
import { LuminaSkillContext } from '../../../luminaskillcontext';
import { Moc } from '../../../moc';
import { Document } from '../../../document';
import { SearchEngine } from '../../../searchengine';
import { DBManager } from '../../../dbmanager';
import path from 'path';

const tempFolderName = 'lumina_knowledge_test'

describe('CreateMemoryTool', () => {
    let createMemoryTool: CreateMemoryTool;
    let context: LuminaSkillContext;
    let mockMoc: Moc;
    let manager: DBManager;

    beforeEach(async () => {
        createMemoryTool = new CreateMemoryTool();
        context = {
            searchEngine: {} as SearchEngine,
            dbManager: {} as DBManager,
            folderName: 'lumina_knowledge_test'
        };
        mockMoc = new Moc('Test MOC', 'test_folder');
        manager = new DBManager(path.join(tempFolderName, 'db', 'test_lumina.db'));
        await manager.initialize();
    });

    it('should validate input data correctly', () => {
        const validInput = JSON.stringify({
            title: 'Test Memory',
            content: 'This is a test memory content',
            moc_id: 'test-moc-id'
        });

        const result = createMemoryTool.validateInputData(validInput);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toEqual({
                title: 'Test Memory',
                content: 'This is a test memory content',
                moc_id: 'test-moc-id'
            });
        }
    });

    it('should return error for invalid input data', () => {
        const invalidInput = JSON.stringify({
            title: 'Test Memory',
            content: 'This is a test memory content'
            // missing moc_id
        });

        const result = createMemoryTool.validateInputData(invalidInput);
        expect(result.isErr()).toBe(true);
    });

    it('should create a memory and add it to MOC', async () => {
        const input = {
            title: 'Test Memory',
            content: 'This is a test memory content',
            moc_id: mockMoc.getId()
        };

        const mocResult = await Moc.read(input.moc_id, context.folderName);
        if (mocResult.isSome()) {
            const moc = mocResult.unwrap();
            const document = new Document(input.title, input.content, context.folderName);
            await document.save();
            await moc.addDocument(document);

            const result = await createMemoryTool.invoke(input, context);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveProperty('document_id');
            }
        } else {
            fail('MOC not found');
        }
    });

    it('should return error when MOC is not found', async () => {
        const input = {
            title: 'Test Memory',
            content: 'This is a test memory content',
            moc_id: 'non-existent-moc-id'
        };

        const result = await createMemoryTool.invoke(input, context);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toContain('Unable to find MOC');
        }
    });
});
