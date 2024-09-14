import OpenAI from "openai";
import path from "path";
import { LocalIndex } from "vectra";
import { v4 as uuidv4 } from "uuid";
import { DBWrapper } from "../dbmanager";
import fs from "fs"
import { Moc } from "../moc";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const index = new LocalIndex(path.join(__dirname, "..", "", "lumina_knowledge/vector_index"))

export class Document {
    private id: string;
    private title: string;
    private content: string;
    private filePath: string;
    private documentsPath: string;
    
    constructor(title: string, content: string, folderName: string = "lumina_knowledge") {
        this.id = uuidv4();
        this.title = title;
        this.content = content;
        this.documentsPath = path.join(__dirname, "..", "..", folderName, "documents");
        this.filePath = path.join(this.documentsPath, `${this.id}.txt`);

        if (!fs.existsSync(this.documentsPath)) {
            console.log("Creating documents directory:", this.documentsPath);
            fs.mkdirSync(this.documentsPath, { recursive: true });
        } else {
            console.log("Documents directory already exists:", this.documentsPath);
        }
    }

    static async read(id: string, folderName: string = "lumina_knowledge") {
        const documentRes = await DBWrapper.getDocumentMetadataById(id)
        if (documentRes.isNone()) {
            throw new Error(`Document with id ${id} not found`)
        }

        const documentData = documentRes.unwrap();
        const filePath = documentData.file_location;
        let content = '';

        try {
            content = fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            throw new Error(`Failed to read document content from file: ${filePath}`);
        }

        const document = new Document(documentData.name, content, folderName);
        document.id = documentData.id;
        document.filePath = filePath;
        return document;
    }

    async save() {
        // Save the content to the file
        fs.writeFileSync(this.filePath, this.content);

        // Save to the database
        await DBWrapper.saveDocument({
            id: this.id,
            title: this.title,
            filePath: this.filePath
        });
    }

    getTitle(): string {
        return this.title
    }

    getId(): string {
        return this.id
    }

    getContent(): string {
        return this.content
    }

    /**
     * Generates an embedding for the document
     * @returns
     */
    private async embed(): Promise<number[]> {
        const response = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: this.content
        })

        return response.data[0].embedding
    }

    async storeEmbedding() {
        if (!await index.isIndexCreated()) {
            await index.createIndex()
        }

        await index.insertItem({
            vector: await this.embed(),
            metadata: {
                title: this.title,
                filePath: this.filePath
            }
        });
    }

    async addToMoc(mocId: string) {
        await DBWrapper.addToMoc(mocId, this.id)
    }

    async getMocs(): Promise<Moc[]> {
        const mocIds = await DBWrapper.getMocIdsForDocument(this.id)
        return Promise.all(mocIds.map((mocId: string) => Moc.read(mocId, this.documentsPath)))
    }
}