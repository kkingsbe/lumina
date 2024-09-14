import { SearchEngine } from './index';
import { Document } from '../document';
import { Moc } from '../moc';
import { DBManager } from '../dbmanager';
import path from 'path';
import fs from 'fs';

const tempFolderName = 'lumina_knowledge_test'

describe('SearchEngine', () => {
    let manager: DBManager;
  let searchEngine: SearchEngine;

  beforeEach(async () => {
    manager = new DBManager(path.join(tempFolderName, 'db', 'test_lumina.db'));
    await manager.initialize();
    searchEngine = new SearchEngine();
  });

  describe('searchByTitle', () => {
    it('should return documents and MOCs with matching titles', async () => {
      // Create test documents and MOCs
      const doc1 = new Document('Test Document 1', 'Content 1');
      const doc2 = new Document('Another Document', 'Content 2');
      const doc3 = new Document('Test Document 2', 'Content 3');
      const moc1 = new Moc('Test MOC 1');
      const moc2 = new Moc('Unrelated MOC');
      
      await Promise.all([doc1.save(), doc2.save(), doc3.save(), moc1.save(), moc2.save()]);

      const searchResult = await searchEngine.searchByTitle('Test');
      
      expect(searchResult.isOk()).toBe(true);
      
      if (searchResult.isOk()) {
        const results = searchResult.unwrap();
        expect(results.length).toBe(3);
        
        const documents = results.filter(item => item instanceof Document) as Document[];
        const mocs = results.filter(item => item instanceof Moc) as Moc[];
        
        expect(documents.length).toBe(2);
        expect(mocs.length).toBe(1);
        
        expect(documents.map(doc => doc.getTitle())).toEqual(expect.arrayContaining(['Test Document 1', 'Test Document 2']));
        expect(mocs[0].getName()).toBe('Test MOC 1');
        
        // Verify that unrelated items are not included
        expect(results.some(item => item instanceof Document && item.getTitle() === 'Another Document')).toBe(false);
        expect(results.some(item => item instanceof Moc && item.getName() === 'Unrelated MOC')).toBe(false);
      } else {
        fail('Search by title failed: ' + searchResult.unwrapErr());
      }
    });
  });

  describe('searchByContent', () => {
    it('should return documents with matching content', async () => {
      const doc1 = new Document('Document 1', 'This is a test content');
      const doc2 = new Document('Document 2', 'This is another content');
      const doc3 = new Document('Document 3', 'Test content with multiple matches');
      const doc4 = new Document('Document 4', 'No matching information here');
      
      await Promise.all([doc1.save(), doc2.save(), doc3.save(), doc4.save()]);

      // Test exact match
      let searchResult = await searchEngine.searchByContent('test');
      
      if (searchResult.isOk()) {
        let results = searchResult.unwrap();
        expect(results.length).toBe(2);
        expect(results.map(doc => doc.getTitle())).toEqual(expect.arrayContaining(['Document 1', 'Document 3']));
      } else {
        fail('Search by content failed for exact match');
      }

      // Test case insensitivity
      searchResult = await searchEngine.searchByContent('TEST');
      
      if (searchResult.isOk()) {
        let results = searchResult.unwrap();
        expect(results.length).toBe(2);
        expect(results.map(doc => doc.getTitle())).toEqual(expect.arrayContaining(['Document 1', 'Document 3']));
      } else {
        fail('Search by content failed for case insensitive match');
      }

      // Test partial match
      searchResult = await searchEngine.searchByContent('conte');
      
      if (searchResult.isOk()) {
        let results = searchResult.unwrap();
        console.log(results);
        expect(results.length).toBe(3);
        expect(results.map(doc => doc.getTitle())).toEqual(expect.arrayContaining(['Document 1', 'Document 2', 'Document 3']));
      } else {
        fail('Search by content failed for partial match');
      }

      // Test no match
      searchResult = await searchEngine.searchByContent('nonexistent');
      
      if (searchResult.isOk()) {
        let results = searchResult.unwrap();
        expect(results.length).toBe(0);
      } else {
        fail('Search by content failed for no match');
      }

      // Test multiple word search
      searchResult = await searchEngine.searchByContent('test multiple');
      
      if (searchResult.isOk()) {
        let results = searchResult.unwrap();
        expect(results.length).toBe(1);
        expect(results[0].getTitle()).toBe('Document 3');
      } else {
        fail('Search by content failed for multiple word search');
      }
    });
  });

  describe('searchAll', () => {
    it('should return documents and MOCs matching in title or content', async () => {
      const doc1 = new Document('Test Document', 'Regular content');
      const doc2 = new Document('Regular Document', 'Test content');
      const doc3 = new Document('Another Document', 'This is a test');
      const doc4 = new Document('Unrelated Document', 'No matching content');
      const moc1 = new Moc('Test MOC');
      const moc2 = new Moc('Another MOC with test');
      const moc3 = new Moc('Unrelated MOC');
      
      await Promise.all([doc1.save(), doc2.save(), doc3.save(), doc4.save(), moc1.save(), moc2.save(), moc3.save()]);

      const searchResult = await searchEngine.searchAll('test');
      
      if (searchResult.isOk()) {
        const results = searchResult.unwrap();
        expect(results.length).toBe(5);

        const documents = results.filter(item => item instanceof Document) as Document[];
        const mocs = results.filter(item => item instanceof Moc) as Moc[];

        expect(documents.length).toBe(3);
        expect(mocs.length).toBe(2);

        // Check documents
        expect(documents.some(doc => doc.getTitle() === 'Test Document')).toBeTruthy();
        expect(documents.some(doc => doc.getTitle() === 'Regular Document' && doc.getContent().includes('Test content'))).toBeTruthy();
        expect(documents.some(doc => doc.getTitle() === 'Another Document' && doc.getContent().includes('This is a test'))).toBeTruthy();

        // Check MOCs
        expect(mocs.some(moc => moc.getName() === 'Test MOC')).toBeTruthy();
        expect(mocs.some(moc => moc.getName() === 'Another MOC with test')).toBeTruthy();

        // Check that unrelated items are not included
        expect(results.some(item => item instanceof Document && item.getTitle() === 'Unrelated Document')).toBeFalsy();
        expect(results.some(item => item instanceof Moc && item.getName() === 'Unrelated MOC')).toBeFalsy();

        // Check case insensitivity
        const caseInsensitiveResult = await searchEngine.searchAll('TEST');
        expect(caseInsensitiveResult.isOk()).toBeTruthy();
        if (caseInsensitiveResult.isOk()) {
          expect(caseInsensitiveResult.unwrap().length).toBe(5);
        }

        // Check partial matching
        const partialMatchResult = await searchEngine.searchAll('tes');
        expect(partialMatchResult.isOk()).toBeTruthy();
        if (partialMatchResult.isOk()) {
          expect(partialMatchResult.unwrap().length).toBe(5);
        }
      } else {
        fail('Search all failed: ' + searchResult.unwrapErr());
      }
    });

    it('should return an empty array when no matches are found', async () => {
      const doc = new Document('Unrelated Document', 'No matching content');
      const moc = new Moc('Unrelated MOC');
      
      await Promise.all([doc.save(), moc.save()]);

      const searchResult = await searchEngine.searchAll('nonexistent');
      
      expect(searchResult.isOk()).toBeTruthy();
      if (searchResult.isOk()) {
        const results = searchResult.unwrap();
        expect(results.length).toBe(0);
      } else {
        fail('Search all failed: ' + searchResult.unwrapErr());
      }
    });
  });

  afterEach(async () => {
    await manager.close();
    // Delete the test database file
    const testDbPath = path.join(tempFolderName, 'db', 'test_lumina.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  })
});
