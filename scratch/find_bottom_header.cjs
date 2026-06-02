const fs = require('fs');
const path = 'C:\\Users\\ilike\\.gemini\\antigravity\\brain\\fc1cbe6b-5455-4544-aa5b-b50edd397a94\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(path, 'utf8');

const lines = fileContent.split('\n');
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'VIEW_FILE' && obj.content && obj.content.includes('App.tsx') && obj.content.includes('1600:') && obj.content.includes('1620:')) {
      console.log(`Found step ${obj.step_index}`);
      fs.writeFileSync(`C:\\Users\\ilike\\.gemini\\antigravity\\brain\\fc1cbe6b-5455-4544-aa5b-b50edd397a94\\scratch\\bottom_header_${obj.step_index}.txt`, obj.content);
    }
  } catch (e) {}
}
console.log('Done searching bottom headers.');
