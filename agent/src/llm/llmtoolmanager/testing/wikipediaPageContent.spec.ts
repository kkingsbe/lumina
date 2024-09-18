import { WikipediaPageContentTool } from '../tools/wikipediaPageContent';
import { LuminaSkillContext } from '../../../luminaskillcontext';

describe('WikipediaPageContentTool', () => {
    let wikipediaPageContentTool: WikipediaPageContentTool;
    let mockContext: LuminaSkillContext;

    beforeEach(() => {
        wikipediaPageContentTool = new WikipediaPageContentTool();
        mockContext = {} as LuminaSkillContext; // Mock context as it's not used in this tool
    });

    describe('validateInputData', () => {
        it('should return Ok for valid input', () => {
            const validInput = JSON.stringify({ pageId: '12345' });
            const result = wikipediaPageContentTool.validateInputData(validInput);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual({ pageId: '12345' });
            }
        });

        it('should return Err for invalid input', () => {
            const invalidInput = JSON.stringify({ invalidKey: '12345' });
            const result = wikipediaPageContentTool.validateInputData(invalidInput);
            expect(result.isErr()).toBe(true);
        });

        it('should return Err for invalid JSON', () => {
            const invalidJson = 'Not a JSON string';
            const result = wikipediaPageContentTool.validateInputData(invalidJson);
            expect(result.isErr()).toBe(true);
        });
    });

    describe('invoke', () => {
        it('should return Wikipedia page content', async () => {
            const input = { pageId: '9845', page: 0 }; // Example page ID for "JavaScript"
            const result = await wikipediaPageContentTool.invoke(input, mockContext);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const pageContent = result.unwrap();
                expect(pageContent).toHaveProperty('title');
                expect(pageContent).toHaveProperty('content');
                expect(pageContent.title).toBe('JavaScript');
                expect(pageContent.content.length).toBeGreaterThan(0);
            }
        });

        it('should return Err for non-existent page ID', async () => {
            const input = { pageId: 'ThisPageIdShouldNotExistInWikipedia123456789', page: 0 };
            const result = await wikipediaPageContentTool.invoke(input, mockContext);
            expect(result.isErr()).toBe(true);
        });
    });
});
