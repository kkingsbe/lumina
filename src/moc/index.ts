import path from "path";
import fs from "fs"
import { v4 as uuidv4 } from "uuid";
import { Document } from "../document";
import { DBWrapper } from "../dbmanager";
import { Option, None, Some } from "ts-results-es";
import { EmbeddingManager } from "../embeddingmanager";

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

    async addDocument(document: Document | Moc) {
        try {
            await document.save(); // Ensure the document is saved first
            await this.save(); // Ensure the MOC is saved or updated
            if (!this.documents.includes(document.getId())) {
                this.documents.push(document.getId());

                await DBWrapper.addToMoc(this.id, document.getId());
                const updatedDocuments = await DBWrapper.getDocumentIdsForMoc(this.id);
                this.documents = updatedDocuments;
                await this.save();
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

    static async read(name: string, folderName: string): Promise<Option<Moc>> {
        const mocDataRes = await DBWrapper.getMocByName(name);
        if (mocDataRes.isNone()) {
            return None;
        }

        // console.log("MOC data:", mocDataRes.unwrap());

        const mocData = mocDataRes.unwrap();
        const moc = new Moc(mocData.name, folderName);
        moc.id = mocData.id;
        
        try {
            moc.documents = await DBWrapper.getDocumentIdsForMoc(mocData.id);
            // console.log("Documents in MOC:", moc.documents);
            return Some(moc);
        } catch (error) {
            console.error(`Failed to get document IDs for MOC: ${error}`);
            return None;
        }
    }

    static async readById(id: string, folderName: string): Promise<Option<Moc>> {
        const mocDataRes = await DBWrapper.getMocById(id, folderName);
        if (mocDataRes.isNone()) {
            return None;
        }

        const mocData = mocDataRes.unwrap();
        const moc = new Moc(mocData.name, folderName);
    
        moc.id = mocData.id;
        moc.documents = await DBWrapper.getDocumentIdsForMoc(mocData.id);
        // console.log("Documents in MOC:", moc.documents);
        return Some(moc);
    }

    /**
     * Generates an embedding for the MOCs name (title)
     * @returns
     */
    private async embed(): Promise<number[]> {
        return EmbeddingManager.generateEmbedding(this.name);
    }

    async storeEmbedding() {
        await EmbeddingManager.storeEmbedding(this.id, await this.embed(), { title: this.name, type: "moc" });
    }
    

    async save() {
        const mocFilePath = path.join(this.mocsPath, `${this.id}.json`);
        fs.writeFileSync(mocFilePath, JSON.stringify({
            name: this.name,
            documents: this.documents
        }, null, 2));
        await DBWrapper.saveMoc(this);

        await this.storeEmbedding()
    }
}

