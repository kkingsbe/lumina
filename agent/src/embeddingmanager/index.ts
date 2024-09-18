import { LocalIndex } from "vectra";
import OpenAI from "openai";

export class EmbeddingManager {
    private static index: LocalIndex;
    private static openai: OpenAI;
    private static isInitialized: boolean = false;

    static async init(folderName: string) {
        if (this.isInitialized) {
            return;
        }

        this.index = new LocalIndex(`${folderName}/vector_index`);
        if (!await this.index.isIndexCreated()) {
            await this.index.createIndex()
        }

        if (!this.openai) {
            this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
        }

        this.isInitialized = true;
    }

    static async generateEmbedding(input: string): Promise<number[]> {
        if (!this.isInitialized) {
            throw new Error("EmbeddingManager is not initialized. Please call init() before generating embeddings.");
        }

        const response = await this.openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: input
        });

        return response.data[0].embedding;
    }

    static async storeEmbedding(id: string, vector: number[], metadata: any) {
        if (!this.isInitialized) {
            throw new Error("EmbeddingManager is not initialized. Please call init() before storing embeddings.");
        }

        if (!await this.index.isIndexCreated()) {
            await this.index.createIndex();
        }

        await this.index.upsertItem({
            id,
            vector: vector,
            metadata: metadata
        });
    }

    static async searchEmbeddings(query: string, limit: number = 5): Promise<Array<{ score: number; metadata: any }>> {
        if (!this.isInitialized) {
            throw new Error("EmbeddingManager is not initialized. Please call init() before searching.");
        }
        

        if (!await this.index.isIndexCreated()) {
            throw new Error("Index has not been created. Please create the index before searching.");
        }

        const queryEmbedding = await this.generateEmbedding(query);
        const searchResults = await this.index.queryItems(queryEmbedding, limit);

        return searchResults.map(result => ({
            score: result.score,
            metadata: result.item.metadata
        }));
    }
}