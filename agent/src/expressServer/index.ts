import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { DBManager } from '../dbmanager';
import { Document } from '../document';

export class ExpressServer {
    private app: express.Application;
    private port: number;
    private tempFolderName: string;
    private dbManager: DBManager;

    constructor(tempFolderName: string, port: number = 5555) {
        this.app = express();
        this.port = port;
        this.tempFolderName = tempFolderName;
        this.dbManager = new DBManager(path.join(tempFolderName, 'db', 'test_lumina.db'));
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware() {
        this.app.use(cors());
    }

    private setupRoutes() {
        // API route for listing MOC files
        this.app.get('/api/mocs', (req, res) => {
            const mocsPath = path.join(this.tempFolderName, 'mocs');
            fs.readdir(mocsPath, (err, files) => {
                if (err) {
                    res.status(500).json({ error: 'Failed to read MOC files' });
                } else {
                    const mocs = files.map(file => {
                        const filePath = path.join(mocsPath, file);
                        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        return {
                            id: path.parse(file).name,
                            name: content.name
                        };
                    });
                    res.json({ mocs });
                }
            });
        });

        // API route for listing document files
        this.app.get('/api/documents', async (req, res) => {
            const documentsPath = path.join(this.tempFolderName, 'documents');
            try {
                const files = await fs.promises.readdir(documentsPath);
                const documents = await Promise.all(files.map(async file => {
                    const id = path.parse(file).name;
                    const document = await Document.read(id, this.tempFolderName);
                    return {
                        id,
                        name: document.getTitle()
                    };
                }));
                res.json({ documents });
            } catch (err) {
                res.status(500).json({ error: 'Failed to read document files' });
            }
        });

        // API route for accessing MOC content
        this.app.get('/api/moc/:id', (req, res) => {
            const mocsPath = path.join(this.tempFolderName, 'mocs');
            fs.readdir(mocsPath, (err, files) => {
                if (err) {
                    res.status(500).json({ error: 'Failed to read MOC files' });
                } else {
                    const mocFile = files.find(file => path.parse(file).name === req.params.id);
                    if (mocFile) {
                        const mocPath = path.join(mocsPath, mocFile);
                        fs.readFile(mocPath, 'utf8', (err, data) => {
                            if (err) {
                                res.status(404).json({ error: 'MOC file not found' });
                            } else {
                                res.json({ content: JSON.parse(data) });
                            }
                        });
                    } else {
                        res.status(404).json({ error: 'MOC file not found' });
                    }
                }
            });
        });

        // API route for accessing document content
        this.app.get('/api/document/:id', async (req, res) => {
            try {
                const documentId = req.params.id;
                const document = await Document.read(documentId, this.tempFolderName);
                if (document) {
                    res.json({ 
                        id: document.getId(),
                        name: document.getTitle(),
                        content: document.getContent()
                     });
                } else {
                    res.status(404).json({ error: 'Document not found' });
                }
            } catch (err) {
                res.status(500).json({ error: 'Failed to retrieve document content' });
            }
        });
    }

    public async start() {
        await this.dbManager.initialize();
        this.app.listen(this.port, () => {
            console.log(`Server running on http://localhost:${this.port}`);
        });
    }
}