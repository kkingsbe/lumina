import path from "path";
import { DBManager } from "./dbmanager";
import dotenv from 'dotenv';
import fs from 'fs';
import { LLM } from "./llm";
import { Moc } from "./moc";
import { ExpressServer } from "./expressServer";

dotenv.config();

const tempFolderName = '../lumina_knowledge_test';

async function main() {
    const manager = new DBManager(path.join(tempFolderName, 'db', 'test_lumina.db'));
    await manager.initialize();

    let systemPrompt = fs.readFileSync(path.join(__dirname, './prompts/systempromptv1.xml'), 'utf8');

    // Attempt to read the root MOC from disk first
    const rootMocResult = await Moc.read('Lumina Knowledge Base', tempFolderName);
    let rootMoc: Moc;
    let createdNewRootMoc = false;

    if (rootMocResult.isSome()) {
        rootMoc = rootMocResult.unwrap();
        console.log("Root MOC loaded from disk:", rootMoc.getName());
    } else {
        // If the root MOC doesn't exist, create a new one
        rootMoc = new Moc('Lumina Knowledge Base', tempFolderName);
        createdNewRootMoc = true;
        console.log("New Root MOC created:", rootMoc.getName());
    }

    systemPrompt = systemPrompt.replace("{ROOT_MOC_ID}", rootMoc.getId());

    const llm = new LLM("gpt-4o-mini", systemPrompt, tempFolderName);
    await llm.init();

    if (createdNewRootMoc) {
        await rootMoc.save(); // Needs to be saved after initializing the LLM as the embedding manager needs to be initialized
    }

    const server = new ExpressServer(tempFolderName);
    server.start();

    //const prompt = "Explore and document your codebase such that you fully understand how you work. Store this documentation in your knowledge base split across multiple files, and go into as much detail as is required to fully describe how your code functions."
    
    const prompt = "Use the ReadFile tool to access the files within your codebase, and document it in your knowledge base so that you can remember how to do it later. Start with just listing the files in the root directory, and proceed from there."
    const response = await llm.chat(prompt);
    //console.log(response)

    while (true) {
      const userInput = await new Promise<string>((resolve) => {
        console.log("Reply to Lumina:")
        process.stdin.once('data', (data) => {
          resolve(data.toString().trim());
        });
      });

      if (userInput.toLowerCase() === 'exit') {
        break;
      }

      const response = await llm.chat(userInput);
      //console.log(response);
    }
}

main()