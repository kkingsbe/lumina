import { LLM } from './index';
import dotenv from 'dotenv';
import { Moc } from '../moc';
import { DBManager } from '../dbmanager';
import path from 'path';
import fs from 'fs';

dotenv.config();

const testArticle = `
Floodwater surged into homes, stranded vehicles, and forced water rescues in coastal North Carolina Monday after a tropical storm-like system dumped historic amounts of rain on the area in a matter of hours. “It’s probably the worst flooding that any of us have seen in Carolina Beach,” Town Manager Bruce Oakley told CNN. “We’ve had to rescue people from cars, also some from houses and businesses.” Emergency services fielded dozens of calls for rescue, Oakley added. Carolina Beach was placed under a state of emergency Monday after a “historic” 18 inches of rain fell there in 12 hours at one station, a once-in-1,000-year rainfall event, according to the National Weather Service in Wilmington, North Carolina. More than a foot of rain in 12 hours was reported elsewhere in the area, a once-in-200-year rain event. The Carolina Beach Elementary School was closed and students were dismissed early after classrooms started to flood, Oakley confirmed. Police and fire crews assisted in the dismissal as some routes to the school were open but others were impassible due to the flooding with roads under 3 feet of water. Flooding also ramped up in neighboring Brunswick County where rainfall rates exceeded 4 to 5 inches per hour for a time Monday. Sunny Point, North Carolina, picked up more than a month’s worth of rain when over 9 inches fell in just three hours. “Our deputies are assisting multiple people who are stranded in their vehicles and some homes at this time,” the Brunswick County Sheriff’s office said on Facebook. The extreme rainfall and flooding is another stark reminder that it doesn’t take a named storm to trigger extremely dangerous conditions. The atmosphere was ripe to unload torrential rainfall, something that’s becoming more common as the world warms due to fossil fuel pollution. Floodwaters started to recede in Carolina Beach early Monday afternoon as torrential rain shifted west of the area, according to Oakley. But cars abandoned during the worst of the flooding remained on empty roadways, according to town mayor Lynn Barbee. The center of the system responsible for the rain was about 50 miles east of Charleston, South Carolina, with tropical storm-force winds of 40 mph Monday morning. Tropical storm warnings are in effect in the coastal Carolinas. The system is being called Potential Tropical Cyclone Eight because it hasn’t become organized enough to be dubbed a tropical or subtropical storm. A system’s center is typically where its strongest winds and its heaviest rain occur, but that’s not the case for Potential Tropical Cyclone Eight. Most of the system’s heaviest rain and gusty winds are far removed from its poorly defined center, satellite imagery shows. This means that while the center of the system will likely make landfall Monday evening in South Carolina – between Charleston and Myrtle Beach – southern North Carolina will continue to endure most of its significant impacts. Flooding rain will continue to be the storm’s most significant threat. Areas near the North Carolina-South Carolina border – including Wilmington, North Carolina – are under a level 3 of 4 risk of flooding rainfall Monday, according to the Weather Prediction Center. A much larger level 2 of 4 risk area encapsulates most of North Carolina and northern South Carolina. Flash flooding is likely, especially for any area that gets multiple rounds of heavy rain. Widespread rainfall totals of 4 to 8 inches will drench these areas through Monday night, with totals in the double digits for parts of extreme southern North Carolina. In addition to heavy rain, this system could also produce a few tornadoes in eastern North Carolina Monday. Up to 3 feet of storm surge is possible from the northern South Carolina coast into southern portions of North Carolina’s Outer Banks through landfall Monday afternoon. “Dangerous” marine conditions will persist throughout the day, the National Weather Service warned. The system’s winds will deteriorate quickly as it moves inland over South Carolina late Monday and Monday night. Rain will continue over parts of the Carolinas and reach more of the mid-Atlantic Tuesday, but the system is expected to dissipate by midweek. The Carolinas were deluged by 6 to 12 inches of rainfall from Debby in early August that created a flash flood emergency near Charleston, South Carolina. If this system manages to grab a name Monday, it’ll be the first named storm to make landfall in South Carolina since Ian came ashore as a Category 1 hurricane in 2022 and the fourth named storm to make landfall in the US this hurricane season.
`

const tempFolderName = 'lumina_knowledge_test'

describe('LLM', () => {
  let llm: LLM;
  let manager: DBManager;

  beforeEach(async () => {
    manager = new DBManager(path.join(tempFolderName, 'db', 'test_lumina.db'));
    await manager.initialize();

    const systemPrompt = fs.readFileSync(path.join(__dirname, '../prompts/systempromptv1.xml'), 'utf8');
    llm = new LLM("gpt-4o-mini", systemPrompt, tempFolderName);
    await llm.init();
    const rootMoc = new Moc('Lumina Knowledge Base', tempFolderName);
    await rootMoc.save();
  });

  // it("should determine a tool call correctly", async () => {
  //   const response = await llm.chat("Can you add a new file with the title 'Test File' and the content 'This is a test file' to your root level MOC?");
  //   console.log(response)
  // }, 30000);

  // it("should process a news article", async () => {
  //   const prompt = "Process the following news article into your knowledge base: \n\n" + testArticle;
  //   const response = await llm.chat(prompt);
  //   console.log(response)

  //   const prompt2 = "Next, go through your knowledge base and find any information about flooding in North Carolina. If you find any relevant information, please summarize the key points and potential impacts. Also, if you have any relevant information in your knowledge base about previous flooding events in this area or climate change effects on extreme weather, please include that in your response.";
  //   const response2 = await llm.chat(prompt2);
  //   console.log(response2)
  // }, 100_000)

  it("should search wikipedia", async () => {
    // const prompt = `
    // Design a injector for a 1kN alcohol / nitrous oxide rocket engine. Include a detailed explanation of the injector's design, specific materials, dimensions, and calculation required to verify the design. Conduct any research you need to do to complete the task.
    // `
    //const prompt = "Improve on your existing injector design"
    const prompt = "Explore the directory structure which is available to you"
    const response = await llm.chat(prompt);
    console.log(response)

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
      console.log(response);
    }
  }, 1_000_000)
});
