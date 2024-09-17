import { Sequelize, DataTypes, Model, Op, FindOptions, WhereAttributeHash, WhereOptions } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { None, Option, Some } from 'ts-results-es';
import { Moc } from '../moc';
import { Document } from '../document';

class DocumentModel extends Model {
  public id!: string;
  public type!: 'memory' | 'moc';
  public name!: string;
  public file_location!: string;
  public creation_timestamp!: number;
}

class MocFileModel extends Model {
  public moc_id!: string;
  public document_id!: string;
}

export class DBManager {
    private sequelize: Sequelize;
    private dbPath: string;

    constructor(dbPath: string = path.join('lumina_knowledge', 'db', 'lumina.db')) {
        this.dbPath = dbPath;
        this.sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: this.dbPath,
            logging: false
        });
    }

    async initialize() {
        // Ensure the directory exists
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        this.createTables()

        try {
            await this.sequelize.sync();
            console.log("Database initialized at:", this.dbPath);
        } catch (error) {
            console.error("Error initializing database:", error);
            throw error;
        }
    }

    // Specify schema for tables
    private createTables() {
        DocumentModel.init({
            id: {
                type: DataTypes.STRING,
                primaryKey: true
            },
            type: {
                type: DataTypes.ENUM('memory', 'moc'),
                allowNull: false
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            file_location: {
                type: DataTypes.STRING,
                allowNull: false
            },
            creation_timestamp: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        }, {
            sequelize: this.sequelize,
            modelName: 'Document',
            tableName: 'documents',
            timestamps: false
        });

        MocFileModel.init({
            moc_id: {
                type: DataTypes.STRING,
                primaryKey: true,
                references: {
                    model: DocumentModel,
                    key: 'id'
                }
            },
            document_id: {
                type: DataTypes.STRING,
                primaryKey: true,
                references: {
                    model: DocumentModel,
                    key: 'id'
                }
            }
        }, {
            sequelize: this.sequelize,
            modelName: 'MocFile',
            tableName: 'moc_files',
            timestamps: false
        });
    }

    async close() {
        await this.sequelize.close();
    }
}

export class DBWrapper {
    static async addToMoc(mocId: string, documentId: string) {
        try {
            await MocFileModel.create({
                moc_id: mocId,
                document_id: documentId
            });
        } catch (error) {
            console.error("Error adding to moc:", error);
            throw error;
        }
    }

    static async saveDocument(document: { id: string; title: string; filePath: string }): Promise<void> {
        try {
            await DocumentModel.upsert({
                id: document.id,
                type: 'memory',
                name: document.title,
                file_location: document.filePath,
                creation_timestamp: Date.now()
            });
            // console.log("Document saved successfully");
        } catch (error) {
            console.error("Error saving document:", error);
            throw error;
        }
    }

    static async getMocByName(name: string): Promise<Option<Moc>> {
        const mocData = await DocumentModel.findOne({
            where: { name: name, type: 'moc' },
            attributes: ['id', 'name']
        });

        if (mocData) {
            return Some(mocData.toJSON() as Moc);
        }
        return None;
    }

    static async getDocumentIdsForMoc(mocId: string): Promise<string[]> {
        try {
            // console.log("Getting document IDs for MOC with id:", mocId);
            const mocFiles = await MocFileModel.findAll({
                where: { moc_id: mocId },
                attributes: ['document_id']
            });
            // console.log("Moc files:", mocFiles);
            return mocFiles.map(file => file.document_id);
        } catch (error) {
            console.error("Error getting document IDs for MOC:", error);
            throw error;
        }
    }

    static async saveMoc(moc: Moc): Promise<void> {
        // console.log("Saving MOC:", moc)
        try {
            await DocumentModel.upsert({
                id: moc.id,
                type: 'moc',
                name: moc.name,
                file_location: '', // MOCs don't have a file location
                creation_timestamp: Date.now()
            });
        } catch (error) {
            console.error("Error saving MOC:", error);
            throw error;
        }
    }

    static async getMocIdsForDocument(documentId: string): Promise<string[]> {
        const mocFiles = await MocFileModel.findAll({
            where: { document_id: documentId },
            attributes: ['moc_id']
        });
        return mocFiles.map(file => file.moc_id);
    }

    static async getDocumentMetadataById(id: string): Promise<Option<DocumentModel>> {
        const document = await DocumentModel.findOne({
            where: { id: id },
            attributes: ['id', 'name', 'file_location']
        });
        if (document) {
            return Some(document.toJSON() as DocumentModel);
        }
        return None;
    }

    static async getDocumentsByTitle(title: string): Promise<Document[]> {
        try {
            // console.log("Searching for documents with title:", title);
            const documentModels = await DocumentModel.findAll({
                where: {
                    name: {
                        [Op.like]: `%${title}%`
                    },
                    type: 'memory'
                },
                attributes: ['name', 'file_location']
            });
            // console.log(`Found ${documentModels.length} documents matching title:`, title);
            
            const documents = await Promise.all(documentModels.map(async (model) => {
                return await Document.read(model.id);
            }));
            
            return documents;
        } catch (error) {
            console.error("Error searching for documents by title:", error);
            throw error;
        }
    }

    static async getMocById(id: string, folderName: string): Promise<Option<Moc>> {
        const mocData = await DocumentModel.findOne({
            where: { id: id, type: 'moc' },
            attributes: ['id', 'name']
        });

        if (!mocData) {
            return None
        }

        const moc = await Moc.read(mocData.name, folderName);
        if (moc.isSome()) {
            return Some(moc.unwrap());
        }
        return None;
    }

    /**
     * Searches for documents based on the provided options.
     * @param {FindOptions<DocumentModel>} options - The search criteria and options for querying documents.
     * @returns {Promise<DocumentModel[]>} A promise that resolves to an array of DocumentModel instances matching the search criteria.
     * @throws {Error} If there's an error during the search process.
     */
    static async searchDocuments(options: FindOptions<DocumentModel>): Promise<DocumentModel[]> {
        try {
            // console.log("Searching for documents with options:", options);
            
            // Replace ILIKE with case-insensitive LIKE
            if (options.where && typeof options.where === 'object' && 'name' in options.where) {
                const nameCondition = options.where.name;
                if (typeof nameCondition === 'object' && Op.iLike in nameCondition) {
                    options.where = {
                        ...options.where,
                        name: Sequelize.where(
                            Sequelize.fn('LOWER', Sequelize.col('name')),
                            'LIKE',
                            `%${(nameCondition[Op.iLike] as string).slice(1, -1).toLowerCase()}%`
                        )
                    } as WhereOptions<DocumentModel>;
                }
            }
            
            const documents = await DocumentModel.findAll(options);
            // console.log(`Found ${documents.length} documents matching search criteria`);
            return documents;
        } catch (error) {
            console.error("Error searching for documents:", error);
            throw error;
        }
    }

    static async getDocumentsByTitleOrContent(query: string): Promise<Document[]> {
        try {
            // console.log("Searching for documents with query:", query);
            const documentModels = await DocumentModel.findAll({
                where: {
                    type: 'memory'
                },
                attributes: ['id', 'name', 'file_location']
            });

            // Map over all documents and check if they match the query
            const matchingDocuments = await Promise.all(documentModels.map(async (doc) => {
                // Read the full document content
                const document = await Document.read(doc.id);
                
                // Check if the query matches either the title or content (case-insensitive)
                if (document.getTitle().toLowerCase().includes(query.toLowerCase()) ||
                    document.getContent().toLowerCase().includes(query.toLowerCase())) {
                    return document;
                }
                
                // Return null for non-matching documents
                return null;
            }));

            const filteredDocuments = matchingDocuments.filter(doc => doc !== null) as Document[];
            // console.log(`Found ${filteredDocuments.length} documents matching query:`, query);
            return filteredDocuments;
        } catch (error) {
            console.error("Error searching for documents by title or content:", error);
            throw error;
        }
    }
}