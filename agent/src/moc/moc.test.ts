import { Moc } from "./index";
import { Document } from "../document";
import { DBManager } from "../dbmanager";
import path from "path";
import fs from "fs";


const tempFolderName = 'lumina_knowledge_test'

describe('Moc', () => {
  let manager: DBManager;

  beforeEach(async () => {
    manager = new DBManager(path.join(tempFolderName, 'db', 'test_lumina.db'));
    await manager.initialize();
  });

  beforeAll(async () => {
    // Delete the temporary database folder if it exists
    if (fs.existsSync(tempFolderName)) {
      fs.rmSync(tempFolderName, { recursive: true, force: true });
    }
    // Create the temporary database folder
    fs.mkdirSync(tempFolderName, { recursive: true });
  })

  afterEach(async () => {
    await manager.close();
    // Delete the test database file
    const testDbPath = path.join(tempFolderName, 'db', 'test_lumina.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  })

  test('should create a Moc instance', async () => {
    const moc = new Moc('Test MOC');
    await moc.save();

    expect(moc).toBeInstanceOf(Moc);
    expect(moc.name).toBe('Test MOC');
    expect(moc.id).toBeDefined();
    expect(moc.documents).toBeDefined();
  });

  test('should add a document to the MOC', async () => {
    const moc = new Moc('Test MOC 2', tempFolderName);
    await moc.save();

    const document = new Document('Test Document', 'This is a test document content.', tempFolderName);
    await document.save(); // Save the document first
    await moc.addDocument(document);
    expect(moc.documents).toContain(document.getId());

    const readMoc = await Moc.read('Test MOC 2');
    expect(readMoc.documents).toContain(document.getId());
  });

  test("Should create two MOCs and add documents to them", async () => {
    const thermodynamicsMoc = new Moc('Thermodynamics', tempFolderName);
    const physicsMoc = new Moc('Physics', tempFolderName);

    const enthalpy = new Document('Enthalpy', 'What is enthalpy?', tempFolderName);
    const temperature = new Document('Temperature', 'What is temperature?', tempFolderName);

    await thermodynamicsMoc.addDocument(enthalpy);
    await thermodynamicsMoc.addDocument(temperature);

    await physicsMoc.addDocument(temperature);
    await physicsMoc.addDocument(enthalpy);

    const readThermodynamicsMoc = await Moc.read('Thermodynamics');
    const readPhysicsMoc = await Moc.read('Physics');

    expect(readThermodynamicsMoc.documents).toContain(enthalpy.getId());
    expect(readThermodynamicsMoc.documents).toContain(temperature.getId());
    expect(readPhysicsMoc.documents).toContain(temperature.getId());
    expect(readPhysicsMoc.documents).toContain(enthalpy.getId());

    const enthalpyRead = await Document.read(enthalpy.getId(), tempFolderName)
    expect(enthalpyRead.getId()).toBe(enthalpy.getId());

    const temperatureRead = await Document.read(temperature.getId(), tempFolderName)
    expect(temperatureRead.getId()).toBe(temperature.getId());
  })
});
