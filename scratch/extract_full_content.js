const fs = require('fs');
const path = 'C:\\Users\\ilike\\.gemini\\antigravity\\brain\\fc1cbe6b-5455-4544-aa5b-b50edd397a94\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(path, 'utf8');

const lines = fileContent.split('\n');
let found = false;
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.step_index === 1016 && obj.content) {
      fs.writeFileSync('C:\\Users\\ilike\\.gemini\\antigravity\\brain\\fc1cbe6b-5455-4544-aa5b-b50edd397a94\\scratch\\step_1016_raw_content.txt', obj.content);
      console.log('Successfully wrote raw content of step 1016');
      found = true;
      break;
    }
  } catch (e) {}
}
if (!found) {
  console.log('Not found step 1016 with content.');
}
