import { CreateMocTool } from '../tools/createMoc';
import { LuminaSkillContext } from '../../../luminaskillcontext';
import { Moc } from '../../../moc';
import { SearchEngine } from '../../../searchengine';
import { DBManager } from '../../../dbmanager';
import path from 'path';
import fs from 'fs';

const tempFolderName = 'lumina_knowledge_test';

describe('CreateMocTool', () => {
    let createMocTool: CreateMocTool;
    let context: LuminaSkillContext;
    let manager: DBManager;

    beforeEach(async () => {
        createMocTool = new CreateMocTool();
        manager = new DBManager(path.join(tempFolderName, 'db', 'test_lumina.db'));
        await manager.initialize();
        context = {
            searchEngine: new SearchEngine(tempFolderName),
            dbManager: manager,
            folderName: tempFolderName
        };

        // Ensure the test folder exists
        if (!fs.existsSync(tempFolderName)) {
            fs.mkdirSync(tempFolderName, { recursive: true });
        }
    });

    // afterEach(() => {
    //     // Clean up the test folder
    //     if (fs.existsSync(tempFolderName)) {
    //         fs.rmSync(tempFolderName, { recursive: true, force: true });
    //     }
    // });

    // it('should validate input data correctly', () => {
    //     const validInput = JSON.stringify({
    //         title: 'Test MOC'
    //     });

    //     const result = createMocTool.validateInputData(validInput);
    //     expect(result.isOk()).toBe(true);
    //     if (result.isOk()) {
    //         expect(result.value).toEqual({
    //             title: 'Test MOC'
    //         });
    //     }
    // });

    // it('should return error for invalid input data', () => {
    //     const invalidInput = JSON.stringify({
    //         // missing title
    //     });

    //     const result = createMocTool.validateInputData(invalidInput);
    //     expect(result.isErr()).toBe(true);
    // });

    it('should create a MOC successfully', async () => {
        const input = {
            title: 'Test MOC',
            parent_moc_id: 'root',
            process_description: 'Create a new MOC'
        };

        const result = await createMocTool.invoke(input, context);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toHaveProperty('moc_id');

            //console.log("Created MOC:",result.unwrap())

            // Verify that the MOC was actually created
            const mocResult = await Moc.readById(result.value.moc_id, tempFolderName);
            expect(mocResult.isSome()).toBe(true);
            if (mocResult.isSome()) {
                const moc = mocResult.unwrap();
                expect(moc.getName()).toBe('Test MOC');
            }
        }
    });

    // it('should handle errors during MOC creation', async () => {
    //     // Simulate an error by using an invalid folder name
    //     const invalidContext = { ...context, folderName: '' };

    //     const input = {
    //         title: 'Test MOC'
    //     };

    //     const result = await createMocTool.invoke(input, invalidContext);
    //     expect(result.isErr()).toBe(true);
    // });
});
