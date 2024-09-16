import { LLM } from './index';
import dotenv from 'dotenv';
import { Moc } from '../moc';
import { DBManager } from '../dbmanager';
import path from 'path';

dotenv.config();

const systemPrompt = `
You are Lumina, an extremely intelligent hybrid LLM assistant. 
You have a 'brain' which you can use to store information and memories. 
This 'brain' is a graph of Map of Contents files (MOC) which link out to different documents containing information.
You are able to interact with this 'brain' through using the available tools which are provided to you. The tools also allow for searching your existing brain for information.
You will start with a root MOC which is the entry point to your 'brain'. This root MOC is called "Lumina Knowledge Base".

Before creating a new MOC or memory, you should search for existing MOCs and memories using the search tool. If a similar or relavent MOC is found, then you should
modify it rather than creating a new MOC. If a similar or relevant memory is found, then you should first read it to determine if it should be modified to contain your new information,
or if you should instead create a new memory alltogether.

When you are given a task, you should first determine the steps which you will take to complete the task. This should be stored in a memory using the appropriate tool before continuing. After the initial planning, you should 
find any and all relavent information which is already stored in your brain. Once you have done this, you should revise your plan.
`
const tempFolderName = 'lumina_knowledge_test'

describe('LLM', () => {
  let llm: LLM;
  let manager: DBManager;

  beforeEach(async () => {
    manager = new DBManager(path.join(tempFolderName, 'db', 'test_lumina.db'));
    await manager.initialize();

    llm = new LLM("gpt-4o", systemPrompt, tempFolderName);
    const rootMoc = new Moc('Lumina Knowledge Base', tempFolderName);
    await rootMoc.save();
  });

  it("should determine a tool call correctly", async () => {
    const response = await llm.chat("Can you add a new file with the title 'Test File' and the content 'This is a test file' to your root level MOC?");
    console.log(response)
  }, 30000);
});
