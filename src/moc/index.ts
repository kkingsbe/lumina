import path from "path";
import fs from "fs"
import { v4 as uuidv4 } from "uuid";
import { Document } from "../document";
import { DBWrapper } from "../dbmanager";

export class Moc {
    id: string;
    name: string;
    documents: string[];
    mocsPath: string;

    constructor(name: string, folderName: string = "lumina_knowledge") {
        this.mocsPath = path.join(__dirname, "..", "..", folderName, "mocs");

        this.id = uuidv4();
        this.name = name;
        this.documents = [];

        if (!fs.existsSync(this.mocsPath)) {
            console.log("Creating mocs directory:", this.mocsPath);
            fs.mkdirSync(this.mocsPath, { recursive: true });
        }

    }

    getName(): string {
        return this.name;
    }

    getId(): string {
        return this.id;
    }

    async addDocument(document: Document) {
        try {
            await document.save(); // Ensure the document is saved first
            await this.save(); // Ensure the MOC is saved or updated
            if (!this.documents.includes(document.getId())) {
                this.documents.push(document.getId());

                console.log(`Adding document with id ${document.getId()} to MOC with id ${this.id}`);
                await DBWrapper.addToMoc(this.id, document.getId());
                console.log("Document added to MOC:", document.getId());
                const tempFiles = await DBWrapper.getDocumentIdsForMoc(this.id);
                console.log("Documents in MOC:", tempFiles);
            }
        } catch (error) {
            console.error("Error adding document to MOC:", error);
            // Check if the error is due to the document not existing in the database
            if ((error as any).name === 'SequelizeForeignKeyConstraintError') {
                console.error("Document does not exist in the database. Make sure to save the document before adding it to a MOC.");
            }
            throw error;
        }
    }

    static async read(name: string, folderName: string = "lumina_knowledge") {
        const mocDataRes = await DBWrapper.getMocByName(name);
        if (mocDataRes.isNone()) {
            throw new Error(`MOC with name '${name}' not found`);
        }

        console.log("MOC data:", mocDataRes.unwrap());

        const mocData = mocDataRes.unwrap();
        const moc = new Moc(mocData.name, folderName);
        moc.id = mocData.id;
        moc.documents = await DBWrapper.getDocumentIdsForMoc(mocData.id);

        console.log("Documents in MOC:", moc.documents);

        return moc;
    }

    async save() {
        const mocFilePath = path.join(this.mocsPath, `${this.id}.json`);
        fs.writeFileSync(mocFilePath, JSON.stringify({
            name: this.name,
            documents: this.documents
        }, null, 2));
        await DBWrapper.saveMoc(this);
    }
}