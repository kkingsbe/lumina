import { EditMemoryTool } from '../tools/editMemory';
import { LuminaSkillContext } from '../../../luminaskillcontext';
import { Moc } from '../../../moc';
import { Document } from '../../../document';
import { DBManager } from '../../../dbmanager';
import path from 'path';
import { EmbeddingManager } from '../../../embeddingmanager';

describe('EditMemoryTool', () => {
    let tool: EditMemoryTool;
    let context: LuminaSkillContext;
    let manager: DBManager;
    const testFolderName = '../lumina_knowledge_test';

    beforeEach(async () => {
        tool = new EditMemoryTool();
        context = {
            folderName: testFolderName,
        } as LuminaSkillContext;

        manager = new DBManager(path.join(testFolderName, 'db', 'test_lumina.db'));
        await manager.initialize();

        await EmbeddingManager.init(testFolderName);

        // Create a test MOC and document
        const moc = new Moc('Test MOC', testFolderName);
        await moc.save();

        const document = new Document('Test Document', 'Initial content', testFolderName);
        await document.save();

        await moc.addDocument(document);
        await moc.save();

        // Check if the document is in the MOC
        const readMoc = await Moc.read('Test MOC', testFolderName);
        expect(readMoc.isSome()).toBe(true);
        if (readMoc.isSome()) {
            const documents = readMoc.unwrap().documents;
            expect(documents.includes(document.getId()));
        }
    });

    it('should edit the contents of an existing memory', async () => {
        const moc = await Moc.read('Test MOC', testFolderName);
        const docId = moc.unwrap().documents[0];
        const document = await Document.read(docId, testFolderName);

        const testId = document.getId();
        expect(testId).not.toBeNull();
        expect(testId).not.toBeUndefined();

        const input = {
            id: testId,
            new_content: 'Updated content',
            process_description: 'Updating test document'
        };

        const result = await tool.invoke(input, context);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const updatedDocument = await Document.read(document.getId(), testFolderName);
            expect(updatedDocument.getContent().includes("Updated content"));
        }
    });

    it('should return an error for non-existent document', async () => {
        const input = {
            id: 'non-existent-id',
            new_content: 'This should fail',
            process_description: 'Attempting to edit non-existent document'
        };

        const result = await tool.invoke(input, context);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toContain('Unable to find document');
        }
    });
});
