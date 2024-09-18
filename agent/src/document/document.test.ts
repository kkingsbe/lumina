import { Document } from "./index";

describe('Document', () => {
  let document: Document;

  beforeEach(() => {
    document = new Document('Test Document', 'This is a test document content.');
  });

  test('should create a Document instance', () => {
    expect(document).toBeInstanceOf(Document);
    expect(document['title']).toBe('Test Document');
    expect(document['content']).toBe('This is a test document content.');
    expect(document['id']).toBeDefined();
    expect(document['filePath']).toBeDefined();
  });

  test('should store embedding', async () => {
    await document.storeEmbedding();
  });
});
