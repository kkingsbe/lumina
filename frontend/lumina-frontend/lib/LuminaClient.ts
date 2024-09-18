export interface LuminaMoc {
    id: string;
    name: string;
    documents: string[];
}

export interface LuminaDocument {
    id: string;
    name: string;
    content: string;
}

export interface ListDocumentsResponse {
    documents: {id: string, name: string}[]
}

export interface ListMocsResponse {
    mocs: {id: string, name: string}[]
}

export class LuminaClient {
    private baseUrl: string;

    constructor(baseUrl: string = 'http://localhost:5555') {
        this.baseUrl = baseUrl;
    }

    async getMocs(): Promise<ListMocsResponse> {
        const response = await fetch(`${this.baseUrl}/api/mocs`);
        if (!response.ok) {
            throw new Error('Failed to fetch MOCs');
        }
        const data = await response.json();
        return data;
    }

    async getDocuments(): Promise<ListDocumentsResponse> {
        const response = await fetch(`${this.baseUrl}/api/documents`);
        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }
        const data = await response.json();
        return data;
    }

    async getMocContent(id: string): Promise<LuminaMoc> {
        const response = await fetch(`${this.baseUrl}/api/moc/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch MOC content');
        }
        const data = await response.json();
        return data.content;
    }

    async getDocumentContent(id: string): Promise<LuminaDocument> {
        const response = await fetch(`${this.baseUrl}/api/document/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch document content');
        }
        const data = await response.json();
        
        return {
            id,
            name: data.name,
            content: data.content
        };
    }
}