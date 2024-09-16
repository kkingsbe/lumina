import { Document } from "../document";
import { Moc } from "../moc";
import { DBWrapper } from "../dbmanager";
import { Op } from "sequelize";
import { Result, Ok, Err } from "ts-results-es";
import { sanitizeQuery } from "../utils";

export class SearchEngine {
    folderName: string

    constructor(folderName: string) {
        this.folderName = folderName
    }

    /**
     * Searches for documents and MOCs by title.
     * @param {string} query - The search query string.
     * @returns {Promise<Result<(Document | Moc)[], Error>>} A Result containing an array of Documents and MOCs matching the query, or an Error.
     */
    async searchByTitle(query: string): Promise<Result<(Document | Moc)[], Error>> {
        if (!query.trim()) {
            return Err(new Error("Search query cannot be empty"));
        }

        const sanitizedQuery = sanitizeQuery(query);
        try {
            const results = await DBWrapper.searchDocuments({
                where: {
                    name: {
                        [Op.like]: `%${sanitizedQuery}%`
                    }
                }
            });
            const convertedResults = await this.convertToDocumentsAndMocs(results);
            return Ok(convertedResults);
        } catch (error) {
            return Err(new Error(`Error searching by title: ${error}`));
        }
    }

    /**
     * Searches for documents by content.
     * @param {string} query - The search query string.
     * @param {number} limit - The maximum number of results to return.
     * @param {number} offset - The number of results to skip for pagination.
     * @returns {Promise<Result<Document[], Error>>} A Result containing an array of Documents whose content matches the query, or an Error.
     */
    async searchByContent(query: string, limit: number = 10, offset: number = 0): Promise<Result<Document[], Error>> {
        if (!query.trim()) {
            return Err(new Error("Search query cannot be empty"));
        }

        const sanitizedQuery = sanitizeQuery(query);
        const queryWords = sanitizedQuery.toLowerCase().split(/\s+/);

        try {
            const documents = await DBWrapper.searchDocuments({
                where: {
                    type: 'memory'
                },
                limit,
                offset
            });
            
            const matchingDocuments: Document[] = [];
            for (const doc of documents) {
                const document = await Document.read(doc.id);
                const content = document.getContent().toLowerCase();
                
                // Check if all query words are present in the content
                if (queryWords.every(word => content.includes(word))) {
                    matchingDocuments.push(document);
                }
            }
            
            console.log("Matching documents:", matchingDocuments);
            return Ok(matchingDocuments);
        } catch (error) {
            return Err(new Error(`Error searching by content: ${error}`));
        }
    }

    /**
     * Searches for documents and MOCs by both title and content.
     * @param {string} query - The search query string.
     * @param {number} limit - The maximum number of results to return.
     * @param {number} offset - The number of results to skip for pagination.
     * @returns {Promise<Result<(Document | Moc)[], Error>>} A Result containing a deduplicated array of Documents and MOCs matching the query in either title or content, or an Error.
     */
    async searchAll(query: string, limit: number = 10, offset: number = 0): Promise<Result<(Document | Moc)[], Error>> {
        if (!query.trim()) {
            return Err(new Error("Search query cannot be empty"));
        }

        try {
            const titleResultsPromise = this.searchByTitle(query);
            const contentResultsPromise = this.searchByContent(query, limit, offset);
            
            const [titleResults, contentResults] = await Promise.all([titleResultsPromise, contentResultsPromise]);
            
            if (titleResults.isErr()) {
                return Err(titleResults.error);
            }
            if (contentResults.isErr()) {
                return Err(contentResults.error);
            }
            
            // Combine and deduplicate results
            const allResults = [...titleResults.unwrap(), ...contentResults.unwrap()];
            const uniqueResults = Array.from(new Set(allResults.map(r => r.getId()))).map(id => 
                allResults.find(r => r.getId() === id)
            ).filter((r): r is Document | Moc => r !== undefined);
            
            return Ok(uniqueResults);
        } catch (error) {
            return Err(new Error(`Error in searchAll: ${error}`));
        }
    }

    private async convertToDocumentsAndMocs(results: any[]): Promise<(Document | Moc)[]> {
        const convertedResults: (Document | Moc)[] = [];
        for (const result of results) {
            if (result.type === 'moc') {
                const mocResult = await Moc.read(result.name, this.folderName);
                convertedResults.push(mocResult.unwrap());
            } else {
                const documentResult = await Document.read(result.id);
                convertedResults.push(documentResult);
            }
        }
        return convertedResults;
    }
}
