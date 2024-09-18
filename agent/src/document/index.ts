import path from "path";
import { v4 as uuidv4 } from "uuid";
import { DBWrapper } from "../dbmanager";
import fs from "fs"
import { Moc } from "../moc";
import { Option } from "ts-results-es";
import { EmbeddingManager } from "../embeddingmanager";

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
            // console.log("Creating documents directory:", this.documentsPath);
            fs.mkdirSync(this.documentsPath, { recursive: true });
        } else {
            // console.log("Documents directory already exists:", this.documentsPath);
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
        fs.writeFileSync(this.filePath, this.title + "\n" + this.content);

        // Save to the database
        await DBWrapper.saveDocument({
            id: this.id,
            title: this.title,
            filePath: this.filePath
        });

        await this.storeEmbedding()
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

    setContent(newContent: string): void {
        this.content = newContent;
    }

    /**
     * Generates an embedding for the documents title and content
     * @returns
     */
    private async embed(): Promise<number[]> {
        return await EmbeddingManager.generateEmbedding(this.title + " " + this.content)
    }

    async storeEmbedding() {
        await EmbeddingManager.storeEmbedding(this.id, await this.embed(), { title: this.title, filePath: this.filePath, id: this.id, type: "document" })
    }

    async addToMoc(mocId: string) {
        await DBWrapper.addToMoc(mocId, this.id)
    }

    async getMocs(): Promise<Moc[]> {
        const mocIds = await DBWrapper.getMocIdsForDocument(this.id)
        return Promise.all(mocIds.map((mocId: string) => Moc.read(mocId, this.documentsPath))).then((mocs: Option<Moc>[]) => mocs.filter(moc => moc.isSome()).map(moc => moc.unwrap()))
    }
}