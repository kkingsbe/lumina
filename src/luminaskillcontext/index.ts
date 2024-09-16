import path from "path"
import { DBManager } from "../dbmanager"
import { SearchEngine } from "../searchengine"

export class LuminaSkillContext {
    searchEngine: SearchEngine
    dbManager: DBManager
    folderName: string

    constructor(folderName: string) {
        this.folderName = folderName
        this.dbManager = new DBManager(path.join(folderName, 'db', 'lumina.db'))
        this.searchEngine = new SearchEngine(folderName)
    }
}