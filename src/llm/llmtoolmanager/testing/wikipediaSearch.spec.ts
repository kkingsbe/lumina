import { WikipediaSearchTool } from '../tools/wikipediaSearch';
import { LuminaSkillContext } from '../../../luminaskillcontext';

describe('WikipediaTool', () => {
    let wikipediaTool: WikipediaSearchTool;
    let mockContext: LuminaSkillContext;

    beforeEach(() => {
        wikipediaTool = new WikipediaSearchTool();
        mockContext = {} as LuminaSkillContext; // Mock context as it's not used in this tool
    });

    describe('validateInputData', () => {
        it('should return Ok for valid input', () => {
            const validInput = JSON.stringify({ query: 'Test query' });
            const result = wikipediaTool.validateInputData(validInput);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual({ query: 'Test query' });
            }
        });

        it('should return Err for invalid input', () => {
            const invalidInput = JSON.stringify({ invalidKey: 'Test query' });
            const result = wikipediaTool.validateInputData(invalidInput);
            expect(result.isErr()).toBe(true);
        });

        it('should return Err for invalid JSON', () => {
            const invalidJson = 'Not a JSON string';
            const result = wikipediaTool.validateInputData(invalidJson);
            expect(result.isErr()).toBe(true);
        });
    });

    describe('invoke', () => {
        it('should return Wikipedia search results', async () => {
            const input = { query: 'JavaScript' };
            const result = await wikipediaTool.invoke(input, mockContext);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const testPage = result.unwrap()[0];
                expect(testPage).toHaveProperty('title');
                expect(testPage).toHaveProperty('summary');
            }
        });

        it('should return Err for non-existent query', async () => {
            const input = { query: 'ThisQueryShouldNotExistInWikipedia123456789' };
            const result = await wikipediaTool.invoke(input, mockContext);
            expect(result.isErr()).toBe(true);
        });
    });
});
