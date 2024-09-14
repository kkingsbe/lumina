import { DBManager } from './index';
import sqlite3 from 'sqlite3';
import fs from 'fs';

describe('DBManager', () => {
  let dbManager: DBManager;
  const testDbPath = 'lumina_knowledge/db/test_lumina.db';

  beforeEach(() => {
    dbManager = new DBManager();
    // Use a test database file
    (dbManager as any).dbPath = testDbPath;
  });

  afterEach(() => {
    // Clean up the test database file
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('should initialize the database with required tables', async () => {
    await dbManager.initialize();

    const db = new sqlite3.Database(testDbPath);

    await new Promise<void>((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) reject(err);
        expect(tables.map((t: any) => t.name)).toEqual(expect.arrayContaining(['documents', 'moc_files']));
        resolve();
      });
    });

    await new Promise<void>((resolve, reject) => {
      db.all("PRAGMA table_info(documents)", (err, columns) => {
        if (err) reject(err);
        const columnNames = columns.map((c: any) => c.name);
        expect(columnNames).toEqual(expect.arrayContaining(['id', 'type', 'name', 'file_location', 'creation_timestamp']));
        resolve();
      });
    });

    await new Promise<void>((resolve, reject) => {
      db.all("PRAGMA table_info(moc_files)", (err, columns) => {
        if (err) reject(err);
        const columnNames = columns.map((c: any) => c.name);
        expect(columnNames).toEqual(expect.arrayContaining(['moc_id', 'document_id']));
        resolve();
      });
    });

    db.close();
  });
});
